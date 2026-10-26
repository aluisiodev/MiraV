"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { DIRETORIA, type Diretor } from "@/data/diretoria";
import { useIdioma } from "@/lib/i18n";

// Radar da diretoria, inspirado na órbita do site novo do Orkut.
//
// Como funciona:
// - Há três órbitas (dentro, meio e fora). Quem está mais perto do centro gira mais rápido e tem a foto maior.
// - Um loop (requestAnimationFrame) calcula, a cada quadro, onde cada pessoa está e escreve direto no
//   style do elemento (translate em cqw, que é % da largura do radar). O React não redesenha nada a cada quadro;
//   ele só entra quando alguém muda de órbita (para trocar o data-orbita, que muda o tamanho da foto no CSS).
// - De vez em quando uma pessoa troca sozinha para uma órbita vizinha, se houver espaço lá.
// - Dá para arrastar uma pessoa para outra órbita: o anel mais próximo acende e, ao soltar, ela encaixa
//   no lugar livre mais perto. Pelo teclado: ← → andam na órbita, ↑ ↓ trocam de órbita.
// - A faixa do radar gira no mesmo loop; quando ela passa por cima de alguém, a foto acende (data-brilho).
// - As órbitas param com o mouse em cima de alguém, durante o arrasto e com o foco do teclado.
//   A faixa do radar continua girando.
// - Com "reduzir movimento" ligado no sistema, nada se mexe sozinho (arrastar e o teclado continuam funcionando).

type Orbita = "dentro" | "meio" | "fora";
const ORBITAS: Orbita[] = ["dentro", "meio", "fora"];

/** Raio de cada órbita, em fração da largura do radar (0,5 seria a borda). */
const RAIO: Record<Orbita, number> = { dentro: 0.215, meio: 0.325, fora: 0.435 };
/** Tamanho da foto em cada órbita: [mínimo em px, fração da largura, máximo em px]. Precisa bater com o --tam do globals.css. */
const FOTO: Record<Orbita, [number, number, number]> = { dentro: [38, 0.11, 84], meio: [32, 0.095, 72], fora: [28, 0.08, 61] };
/** Segundos para uma volta completa em cada órbita. */
const VOLTA: Record<Orbita, number> = { dentro: 36, meio: 56, fora: 84 };
/** Segundos para uma volta da faixa do radar. */
const VARREDURA = 7;
/** A cada quarto de volta, a chance de a pessoa tentar ir para uma órbita vizinha. */
const CHANCE_TROCA = 0.1;
/** Uma troca automática nunca deixa uma órbita com menos gente que isso. */
const MINIMO_POR_ORBITA = 1;
/** Quanto tempo (s), mais ou menos, a pessoa leva para deslizar até a nova órbita. Serve para conferir se há espaço no caminho. */
const DESLIZE = 2.5;
/** Graus que as setas ← → andam. */
const PASSO_TECLADO = 10;
/** Por quantos graus depois da faixa passar a foto continua acesa (depois o CSS apaga devagar). */
const BRILHO = 20;

/** Onde cada pessoa começa: órbita e ângulo em graus (-90 = topo, 0 = direita). Pode mudar à vontade. */
const INICIO: Record<string, [Orbita, number]> = {
  luan: ["dentro", -90],
  aluisio: ["meio", -20],
  livia: ["meio", 160],
  caio: ["fora", 70],
  ryan: ["fora", 230],
};

type Corpo = {
  orbita: Orbita;
  /** lugar na órbita, em graus */
  ang: number;
  /** quanto ainda falta deslizar até "ang" (depois de soltar ou usar as setas) */
  extra: number;
  /** raio atual; desliza até o raio da órbita */
  r: number;
  /** velocidade atual em graus/s; desliza até a velocidade da órbita */
  vel: number;
  /** graus andados desde a última chance de trocar de órbita */
  percorrido: number;
  /** posição (x, y em fração da largura) enquanto está sendo arrastada */
  livre: { x: number; y: number } | null;
  brilho: boolean;
  ultimoT: string;
  ultimoR: number;
};

const RAD = Math.PI / 180;
const velocidade = (o: Orbita) => 360 / VOLTA[o];
/** Diferença entre dois ângulos, sempre entre -180 e 180. */
const diferenca = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;
const translate = (r: number, a: number) =>
  `translate(${(r * 100 * Math.cos(a * RAD)).toFixed(3)}cqw, ${(r * 100 * Math.sin(a * RAD)).toFixed(3)}cqw)`;

function fotoPx(o: Orbita, largura: number) {
  const [min, fracao, max] = FOTO[o];
  return Math.min(max, Math.max(min, fracao * largura));
}

/** Menor distância, em graus, entre duas pessoas na mesma órbita (foto + nome embaixo + folga). */
function espaco(o: Orbita, largura: number) {
  const precisa = Math.max(fotoPx(o, largura) + 34, 64); // em px
  return (2 * Math.asin(Math.min(1, precisa / (2 * RAIO[o] * largura)))) / RAD;
}

function maisProxima(r: number): Orbita {
  return ORBITAS.reduce((a, b) => (Math.abs(RAIO[b] - r) < Math.abs(RAIO[a] - r) ? b : a));
}

/** Onde a pessoa aparece agora (raio e ângulo). */
function posicao(c: Corpo) {
  if (c.livre) return { r: Math.hypot(c.livre.x, c.livre.y), a: Math.atan2(c.livre.y, c.livre.x) / RAD };
  return { r: c.r, a: c.ang + c.extra };
}

/** O ângulo "ang" da órbita "o" está livre? (ignora a própria pessoa e quem está sendo arrastado) */
function cabe(corpos: Corpo[], o: Orbita, ang: number, ignorar: number, largura: number, folga = 0) {
  const minimo = espaco(o, largura) + folga;
  return corpos.every((c, j) => j === ignorar || c.livre || c.orbita !== o || Math.abs(diferenca(ang, c.ang)) >= minimo);
}

/** Procura o lugar livre mais perto de "ang": dos dois lados, ou só num sentido (setas do teclado). */
function lugarLivre(corpos: Corpo[], o: Orbita, ang: number, ignorar: number, largura: number, sentido?: 1 | -1) {
  for (let s = 0; s <= (sentido ? 350 : 180); s += 2) {
    const tentativas = sentido ? [ang + sentido * s] : s === 0 ? [ang] : [ang + s, ang - s];
    for (const t of tentativas) if (cabe(corpos, o, t, ignorar, largura)) return t;
  }
  return null;
}

/** Troca automática: vai para uma órbita vizinha se houver espaço lá e no caminho. Devolve true se trocou. */
function tentarTroca(corpos: Corpo[], i: number, largura: number) {
  const c = corpos[i];
  const n = ORBITAS.indexOf(c.orbita);
  const vizinhas = [ORBITAS[n - 1], ORBITAS[n + 1]].filter(Boolean);
  const destino = vizinhas[Math.floor(Math.random() * vizinhas.length)];
  if (corpos.filter((o) => o.orbita === c.orbita).length <= MINIMO_POR_ORBITA) return false;
  // enquanto desliza, a pessoa muda de velocidade e se afasta um pouco dos vizinhos: pedimos essa folga a mais
  const folga = Math.abs(velocidade(c.orbita) - velocidade(destino)) * DESLIZE;
  if (!cabe(corpos, destino, c.ang, i, largura, folga) || !cabe(corpos, c.orbita, c.ang, i, largura, folga)) return false;
  c.orbita = destino;
  c.percorrido = 0;
  return true;
}

function criarCorpos(): Corpo[] {
  return DIRETORIA.map((p, i) => {
    const [orbita, ang] = INICIO[p.id] ?? ["fora", -90 + (i * 360) / DIRETORIA.length];
    const r = RAIO[orbita];
    return { orbita, ang, extra: 0, r, vel: velocidade(orbita), percorrido: (i * 37) % 90, livre: null, brilho: false, ultimoT: translate(r, ang), ultimoR: r };
  });
}

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
  // posição inicial (só para o primeiro desenho; depois quem move é o loop)
  const [inicial] = useState(criarCorpos);
  const [orbitas, setOrbitas] = useState<Orbita[]>(() => inicial.map((c) => c.orbita));
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<Orbita | null>(null);

  const radar = useRef<HTMLDivElement>(null);
  const varredura = useRef<HTMLDivElement>(null);
  const planetas = useRef<(HTMLDivElement | null)[]>([]);
  const etiquetas = useRef<(HTMLDivElement | null)[]>([]);
  const raios = useRef<(HTMLSpanElement | null)[]>([]);
  const corpos = useRef<Corpo[]>([]);
  const largura = useRef(760);
  const pausa = useRef({ mouse: false, foco: false, arrasto: false });
  const arrasto = useRef<{ i: number; x: number; y: number; dx: number; dy: number; moveu: boolean } | null>(null);

  const atual = DIRETORIA[ativo];
  const tx = atual.textos[idioma];
  const ir = (delta: number) => setAtivo((i) => (i + delta + DIRETORIA.length) % DIRETORIA.length);
  const lerOrbitas = () => setOrbitas(corpos.current.map((c) => c.orbita));

  // O loop: move as pessoas, gira a faixa e acende quem a faixa acabou de tocar.
  useEffect(() => {
    const el = radar.current;
    const faixa = varredura.current;
    if (!el || !faixa) return;
    if (!corpos.current.length) corpos.current = inicial.map((c) => ({ ...c }));
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    largura.current = el.getBoundingClientRect().width || 760;
    const ro = new ResizeObserver(([e]) => (largura.current = e.contentRect.width || largura.current));
    ro.observe(el);
    let visivel = true; // fora da tela, o loop não calcula nada
    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting));
    io.observe(el);

    let giro = 0;
    let quadro = 0;
    let antes = performance.now();
    const loop = (agora: number) => {
      quadro = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min((agora - antes) / 1000, 0.05));
      antes = agora;
      if (!visivel) return;

      const W = largura.current;
      const p = pausa.current;
      const parado = reduzir || p.mouse || p.foco || p.arrasto;
      const suave = reduzir ? 1 : Math.min(1, dt * 1.6); // raio e velocidade deslizam até o da órbita
      const suaveAng = reduzir ? 1 : Math.min(1, dt * 3);
      if (!reduzir) {
        giro = (giro + (dt * 360) / VARREDURA) % 360;
        faixa.style.setProperty("--varredura", `${giro.toFixed(2)}deg`);
      }
      // a faixa é desenhada a partir do topo (conic-gradient); as pessoas contam o ângulo a partir da direita
      const frente = giro - 90;

      let trocou = false;
      corpos.current.forEach((c, i) => {
        if (!c.livre) {
          c.r += (RAIO[c.orbita] - c.r) * suave;
          c.vel += (velocidade(c.orbita) - c.vel) * suave;
          c.extra -= c.extra * suaveAng;
          if (!parado) {
            const passo = c.vel * dt;
            c.ang = (c.ang + passo) % 360;
            c.percorrido += passo;
            if (c.percorrido >= 90) {
              c.percorrido -= 90;
              if (Math.random() < CHANCE_TROCA && tentarTroca(corpos.current, i, W)) trocou = true;
            }
          }
        }

        const { r, a } = posicao(c);
        const planeta = planetas.current[i];
        const tr = translate(r, a);
        if (tr !== c.ultimoT) {
          c.ultimoT = tr;
          planeta?.style.setProperty("transform", tr);
          etiquetas.current[i]?.style.setProperty("transform", tr);
          raios.current[i]?.style.setProperty("transform", `rotate(${a.toFixed(2)}deg)`);
        }
        if (Math.abs(r - c.ultimoR) > 0.0005) {
          c.ultimoR = r;
          raios.current[i]?.style.setProperty("width", `${(r * 100).toFixed(2)}cqw`);
        }

        if (!reduzir && planeta) {
          // meia largura da foto, em graus: a luz acende assim que a faixa encosta na borda dela
          const meia = Math.asin(Math.min(1, fotoPx(c.orbita, W) / 2 / Math.max(1, r * W))) / RAD;
          const atras = (((frente - a) % 360) + 360) % 360; // quantos graus a faixa já passou da pessoa
          const aceso = atras < BRILHO || atras > 360 - meia;
          if (aceso !== c.brilho) {
            c.brilho = aceso;
            planeta.toggleAttribute("data-brilho", aceso);
          }
        }
      });
      if (trocou) setOrbitas(corpos.current.map((c) => c.orbita));
    };
    quadro = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(quadro);
      ro.disconnect();
      io.disconnect();
    };
  }, [inicial]);

  // Leva a pessoa i para a órbita "destino", no ângulo "lugar", deslizando de onde ela está agora.
  const mudar = (i: number, destino: Orbita, lugar: number) => {
    const c = corpos.current[i];
    const agora = posicao(c);
    c.livre = null;
    c.r = agora.r;
    c.orbita = destino;
    c.ang = lugar;
    c.extra = diferenca(agora.a, lugar);
    c.percorrido = 0;
    lerOrbitas();
  };

  // Ponteiro em relação ao centro do radar, em fração da largura.
  const ponteiro = (e: PointerEvent) => {
    const r = radar.current!.getBoundingClientRect();
    return { x: (e.clientX - (r.left + r.width / 2)) / r.width, y: (e.clientY - (r.top + r.height / 2)) / r.width };
  };

  const segurar = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId); // continua recebendo o movimento mesmo fora do botão
    arrasto.current = { i, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moveu: false };
    pausa.current.arrasto = true;
  };

  const arrastar = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    const a = arrasto.current;
    const c = corpos.current[i];
    if (!a || a.i !== i || !c) return;
    const p = ponteiro(e);
    if (!a.moveu) {
      // só vira arrasto depois de alguns pixels: um toque rápido continua sendo um clique
      if (Math.hypot(e.clientX - a.x, e.clientY - a.y) < 6) return;
      a.moveu = true;
      // guarda a distância entre o dedo e o centro da foto, para ela não pular para baixo do dedo
      const { r, a: ang } = posicao(c);
      a.dx = r * Math.cos(ang * RAD) - p.x;
      a.dy = r * Math.sin(ang * RAD) - p.y;
      setArrastando(i);
    }
    let x = p.x + a.dx;
    let y = p.y + a.dy;
    const r = Math.hypot(x, y) || 0.001;
    const limitado = Math.min(0.47, Math.max(0.13, r)); // nem em cima do olho, nem fora do radar
    x *= limitado / r;
    y *= limitado / r;
    c.livre = { x, y };
    setAlvo(maisProxima(limitado));
  };

  const soltar = (i: number) => () => {
    const a = arrasto.current;
    if (!a || a.i !== i) return;
    arrasto.current = null;
    pausa.current.arrasto = false;
    if (!a.moveu) return;
    // encaixa na órbita mais próxima, no lugar livre mais perto; se não couber, volta para a órbita de antes
    const c = corpos.current[i];
    const { r, a: ang } = posicao(c);
    const W = largura.current;
    let destino = maisProxima(r);
    let lugar = lugarLivre(corpos.current, destino, ang, i, W);
    if (lugar === null) {
      destino = c.orbita;
      lugar = lugarLivre(corpos.current, destino, ang, i, W) ?? ang;
    }
    mudar(i, destino, lugar);
    setAtivo(i);
    setArrastando(null);
    setAlvo(null);
  };

  const teclas = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const c = corpos.current[i];
    if (!c) return;
    const W = largura.current;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const sentido = e.key === "ArrowRight" ? 1 : -1;
      const lugar = lugarLivre(corpos.current, c.orbita, c.ang + sentido * PASSO_TECLADO, i, W, sentido);
      if (lugar !== null) mudar(i, c.orbita, lugar);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      // ↑ aproxima do centro, ↓ afasta
      const destino = ORBITAS[ORBITAS.indexOf(c.orbita) + (e.key === "ArrowUp" ? -1 : 1)];
      const lugar = destino ? lugarLivre(corpos.current, destino, c.ang, i, W) : null;
      if (destino && lugar !== null) mudar(i, destino, lugar);
    } else return;
    setAtivo(i);
  };

  const pausarMouse = (valor: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") pausa.current.mouse = valor;
  };

  return (
    <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div
        ref={radar}
        className="radar"
        data-arrastando={arrastando !== null ? "" : undefined}
        role="group"
        aria-label={d.rotulo}
        onFocus={(e) => (pausa.current.foco = e.target.matches(":focus-visible"))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pausa.current.foco = false;
        }}
      >
        {/* fundo: varredura do radar, ondas saindo do centro, as três órbitas e a borda */}
        <div ref={varredura} className="radar-varredura" aria-hidden />
        <span className="radar-pulso" aria-hidden />
        <span className="radar-pulso radar-pulso-2" aria-hidden />
        {ORBITAS.map((o) => (
          <span key={o} className={`radar-anel ${alvo === o ? "alvo" : ""}`} data-orbita={o} style={comRaio(`${RAIO[o] * 100}cqw`)} aria-hidden />
        ))}
        <span className="radar-anel" style={comRaio("48.5cqw")} aria-hidden />

        {/* pontinhos de luz em órbitas próprias, em velocidades diferentes */}
        <div className="radar-orbita radar-pontos-1" aria-hidden>
          {[20, 200].map((a) => (
            <span key={a} className="radar-ponto" style={{ ...comAngulo(a), ...comRaio("27cqw") }} />
          ))}
        </div>
        <div className="radar-orbita radar-pontos-2" aria-hidden>
          {[60, 170, 300].map((a) => (
            <span key={a} className="radar-ponto" style={{ ...comAngulo(a), ...comRaio("48.5cqw") }} />
          ))}
        </div>

        {/* a diretoria: primeiro as linhas até o centro, depois as fotos */}
        <div className="radar-orbita">
          {DIRETORIA.map((p, i) => (
            <span
              key={p.id}
              ref={(el) => {
                raios.current[i] = el;
              }}
              aria-hidden
              className={`radar-raio ${i === ativo ? "ativo" : ""}`}
              style={{ transform: `rotate(${inicial[i].ang}deg)`, width: `${inicial[i].r * 100}cqw` }}
            />
          ))}
          {DIRETORIA.map((p, i) => {
            const selecionado = i === ativo;
            return (
              <div
                key={p.id}
                ref={(el) => {
                  planetas.current[i] = el;
                }}
                className={`radar-planeta ${selecionado ? "ativo" : ""} ${arrastando === i ? "arrastando" : ""}`}
                data-orbita={orbitas[i]}
                style={{ transform: inicial[i].ultimoT }}
              >
                <button
                  type="button"
                  className="radar-rosto"
                  aria-pressed={selecionado}
                  aria-controls="painel-diretoria"
                  aria-label={`${p.nome}, ${p.sigla} · ${p.textos[idioma].cargo}`}
                  onClick={() => setAtivo(i)}
                  onPointerDown={segurar(i)}
                  onPointerMove={arrastar(i)}
                  onPointerUp={soltar(i)}
                  onPointerCancel={soltar(i)}
                  onPointerEnter={pausarMouse(true)}
                  onPointerLeave={pausarMouse(false)}
                  onKeyDown={teclas(i)}
                >
                  <span className="radar-avatar">
                    <Avatar pessoa={p} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* nomes numa camada própria, por cima das fotos: quando alguém passa por outra órbita, o nome continua legível */}
        <div className="radar-orbita radar-etiquetas" aria-hidden>
          {DIRETORIA.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => {
                etiquetas.current[i] = el;
              }}
              className={`radar-etiqueta ${arrastando === i ? "arrastando" : ""}`}
              data-orbita={orbitas[i]}
              style={{ transform: inicial[i].ultimoT }}
            >
              <span className="radar-legenda">
                <span className="font-mono text-[clamp(9px,1.5cqw,11px)] tracking-[0.16em] text-azul">{p.sigla}</span>
                <span className="text-[clamp(11px,1.8cqw,13px)] font-medium">{p.nome.split(" ")[0]}</span>
              </span>
            </div>
          ))}
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
          <span className="font-marca text-[2.9cqw] leading-none tracking-[0.18em] text-azul">MIRAV</span>
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
