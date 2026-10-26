"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { DIRETORIA, type Diretor } from "@/data/diretoria";
import { useIdioma } from "@/lib/i18n";

// Radar da diretoria, inspirado no site novo do Orkut: a logo no centro e as pessoas orbitando em volta.
//
// Como funciona:
// - O giro roda num loop (requestAnimationFrame) que só atualiza a variável CSS --giro no radar.
//   O CSS (classes .radar-* em globals.css) usa --giro + o ângulo de cada pessoa (--a) para posicioná-la.
//   O React não redesenha nada a cada quadro.
// - Arrastar: ao segurar uma pessoa e mover, calculamos o ângulo do ponteiro em relação ao centro
//   e guardamos como o novo lugar dela na órbita. Funciona com mouse, dedo e setas do teclado.
// - A órbita pausa com o mouse em cima, durante o arrasto e com o foco do teclado.
// - Com "reduzir movimento" ligado no sistema, nada gira sozinho (arrastar continua funcionando).

/** Segundos para uma volta completa. */
const VOLTA = 80;
/** Graus que as setas do teclado movem a pessoa selecionada. */
const PASSO_TECLADO = 10;

function iniciais(nome: string) {
  const partes = nome.split(" ");
  return (partes[0][0] + (partes[1]?.[0] ?? partes[0][1] ?? "")).toUpperCase();
}

function Avatar({ pessoa, alt = "" }: { pessoa: Diretor; alt?: string }) {
  return pessoa.foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pessoa.foto} alt={alt} draggable={false} className="h-full w-full object-cover" />
  ) : (
    <span aria-hidden={!alt} aria-label={alt || undefined} className="font-serif text-[1.6em] text-azul italic">
      {iniciais(pessoa.nome)}
    </span>
  );
}

// variáveis CSS precisam deste "molde" para o TypeScript aceitar no style
const comAngulo = (graus: number) => ({ "--a": `${graus}deg` }) as CSSProperties;
const comRaio = (raio: string) => ({ "--raio": raio }) as CSSProperties;

export function RadarDiretoria() {
  const { t, idioma } = useIdioma();
  const d = t.sobre.diretoria;
  const [ativo, setAtivo] = useState(0);
  // lugar de cada pessoa na órbita, em graus (-90 = topo); começam igualmente espaçadas
  const [angulos, setAngulos] = useState(() => DIRETORIA.map((_, i) => -90 + (i * 360) / DIRETORIA.length));
  const [arrastando, setArrastando] = useState<number | null>(null);

  const radar = useRef<HTMLDivElement>(null);
  const giro = useRef(0);
  const pausa = useRef({ mouse: false, foco: false, arrasto: false });
  const arrasto = useRef<{ i: number; x: number; y: number; moveu: boolean } | null>(null);

  const atual = DIRETORIA[ativo];
  const tx = atual.textos[idioma];
  const ir = (delta: number) => setAtivo((i) => (i + delta + DIRETORIA.length) % DIRETORIA.length);
  const mover = (i: number, graus: number) => setAngulos((lista) => lista.map((v, j) => (j === i ? graus : v)));

  // Loop do giro: fora do React, só escreve --giro no radar.
  useEffect(() => {
    const el = radar.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let quadro = 0;
    let antes = performance.now();
    const loop = (agora: number) => {
      const dt = Math.max(0, Math.min((agora - antes) / 1000, 0.05));
      antes = agora;
      const p = pausa.current;
      if (!p.mouse && !p.foco && !p.arrasto) {
        giro.current = (giro.current + (dt * 360) / VOLTA) % 360;
        el.style.setProperty("--giro", `${giro.current.toFixed(3)}deg`);
      }
      quadro = requestAnimationFrame(loop);
    };
    quadro = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(quadro);
  }, []);

  // Ângulo do ponteiro em relação ao centro do radar, já descontando o giro atual.
  const anguloNaOrbita = (e: PointerEvent) => {
    const r = radar.current!.getBoundingClientRect();
    const graus = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    return graus - giro.current;
  };

  const segurar = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId); // continua recebendo o movimento mesmo fora do botão
    arrasto.current = { i, x: e.clientX, y: e.clientY, moveu: false };
    pausa.current.arrasto = true;
  };
  const arrastar = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    const a = arrasto.current;
    if (!a || a.i !== i) return;
    // só vira arrasto depois de alguns pixels: um toque rápido continua sendo um clique
    if (!a.moveu && Math.hypot(e.clientX - a.x, e.clientY - a.y) < 6) return;
    if (!a.moveu) setArrastando(i);
    a.moveu = true;
    mover(i, anguloNaOrbita(e));
  };
  const soltar = () => {
    arrasto.current = null;
    pausa.current.arrasto = false;
    setArrastando(null);
  };
  const teclas = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    mover(i, angulos[i] + (e.key === "ArrowRight" ? PASSO_TECLADO : -PASSO_TECLADO));
    setAtivo(i);
  };

  return (
    <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div
        ref={radar}
        className="radar"
        data-arrastando={arrastando !== null ? "" : undefined}
        role="group"
        aria-label={d.rotulo}
        onPointerEnter={(e) => e.pointerType === "mouse" && (pausa.current.mouse = true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && (pausa.current.mouse = false)}
        onFocus={(e) => (pausa.current.foco = e.target.matches(":focus-visible"))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pausa.current.foco = false;
        }}
      >
        {/* fundo: varredura do radar, ondas saindo do centro e anéis */}
        <div className="radar-varredura" aria-hidden />
        <span className="radar-pulso" aria-hidden />
        <span className="radar-pulso radar-pulso-2" aria-hidden />
        <span className="radar-anel" style={comRaio("21cqw")} aria-hidden />
        <span className="radar-anel radar-anel-tracejado" style={comRaio("var(--r)")} aria-hidden />
        <span className="radar-anel" style={comRaio("48.5cqw")} aria-hidden />

        {/* pontinhos de luz em órbitas próprias, em velocidades diferentes */}
        <div className="radar-orbita radar-pontos-1" aria-hidden>
          {[20, 200].map((a) => (
            <span key={a} className="radar-ponto" style={{ ...comAngulo(a), ...comRaio("21cqw") }} />
          ))}
        </div>
        <div className="radar-orbita radar-pontos-2" aria-hidden>
          {[60, 170, 300].map((a) => (
            <span key={a} className="radar-ponto" style={{ ...comAngulo(a), ...comRaio("48.5cqw") }} />
          ))}
        </div>

        {/* a diretoria */}
        <div className="radar-orbita">
          {DIRETORIA.map((p, i) => {
            const selecionado = i === ativo;
            return (
              <Fragment key={p.id}>
                <span aria-hidden className={`radar-raio ${selecionado ? "ativo" : ""}`} style={comAngulo(angulos[i])} />
                <div className={`radar-planeta ${arrastando === i ? "arrastando" : ""}`} style={comAngulo(angulos[i])}>
                  <button
                    type="button"
                    className="radar-rosto"
                    aria-pressed={selecionado}
                    aria-controls="painel-diretoria"
                    aria-label={`${p.nome}, ${p.sigla} · ${p.textos[idioma].cargo}`}
                    onClick={() => setAtivo(i)}
                    onPointerDown={segurar(i)}
                    onPointerMove={arrastar(i)}
                    onPointerUp={soltar}
                    onPointerCancel={soltar}
                    onKeyDown={teclas(i)}
                  >
                    <span className="radar-avatar">
                      <Avatar pessoa={p} />
                    </span>
                    <span className="radar-legenda" aria-hidden>
                      <span className="font-mono text-[11px] tracking-[0.16em] text-azul">{p.sigla}</span>
                      <span className="text-[13px] font-medium">{p.nome.split(" ")[0]}</span>
                    </span>
                  </button>
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* centro: a logo em versão mínima (só o olho, que pisca) */}
        <div className="radar-centro" aria-hidden>
          <svg viewBox="-104 -56 208 112" className="w-[62%] text-azul">
            <g className="radar-olho">
              <path d="M-95 0C-50 -50 50 -50 95 0C50 46 -50 46 -95 0Z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="miter" strokeMiterlimit="12" />
              <circle cx="0" cy="0" r="31" fill="none" stroke="currentColor" strokeWidth="9" />
              <circle cx="0" cy="0" r="15" fill="currentColor" />
            </g>
          </svg>
          <span className="font-marca text-[3.2cqw] leading-none tracking-[0.18em] text-azul">MIRAV</span>
        </div>
      </div>

      {/* painel com a função da pessoa selecionada */}
      <div id="painel-diretoria" aria-live="polite" className="flex flex-col gap-6 border border-linha bg-superficie p-6 sm:p-8">
        <div key={`${atual.id}-${idioma}`} className="radar-painel flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-azul bg-fundo text-[22px]">
              <Avatar pessoa={atual} alt={atual.nome} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-sm tracking-[0.18em] text-azul">{atual.sigla}</span>
              <h3 className="text-[clamp(26px,3vw,36px)] leading-tight font-medium tracking-tight">{atual.nome}</h3>
              <span className="text-texto-2">{tx.cargo}</span>
              {atual.linkedin && (
                <a
                  href={atual.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={d.linkedin.replace("{nome}", atual.nome)}
                  className="mt-1 inline-flex min-h-8 items-center gap-1.5 self-start text-sm font-medium text-azul underline-offset-4 hover:underline"
                >
                  LinkedIn <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </div>

          <p className="text-[17px] leading-relaxed">{tx.descricao}</p>

          <div className="flex flex-col gap-3">
            <span className="rotulo">{d.diaADia}</span>
            <ul className="flex flex-col gap-2.5">
              {tx.diaADia.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-texto-2">
                  <span aria-hidden className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-azul" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="rotulo">{d.frentes}</span>
            <ul className="flex flex-wrap gap-2">
              {tx.frentes.map((f) => (
                <li key={f} className="rounded-full border border-azul-escuro px-3 py-1 text-[13px]">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* anterior / próximo: outro jeito de navegar, sem precisar acertar quem está girando */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-linha pt-5">
          <button type="button" onClick={() => ir(-1)} className="btn-linha cursor-pointer !min-h-11 !px-4">
            <span aria-hidden>←</span> {d.anterior}
          </button>
          <span className="font-mono text-xs tracking-[0.14em] text-apagado">
            {String(ativo + 1).padStart(2, "0")} / {String(DIRETORIA.length).padStart(2, "0")}
          </span>
          <button type="button" onClick={() => ir(1)} className="btn-linha cursor-pointer !min-h-11 !px-4">
            {d.proximo} <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
