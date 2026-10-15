"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n";

type Opcao = "corte" | "cor" | "barba" | "estetica";
type Tom = "platinado" | "mel" | "violeta";

const BASE = "/img/espelho/espelho-base.jpg";
const IMAGENS: Record<string, string> = {
  platinado: "/img/espelho/espelho-cor-platinado.jpg",
  mel: "/img/espelho/espelho-cor-mel.jpg",
  violeta: "/img/espelho/espelho-cor-violeta.jpg",
  barba: "/img/espelho/espelho-barba.jpg",
  estetica: "/img/espelho/espelho-estetica.jpg",
};
const PONTOS: Record<Tom, string> = { platinado: "#E6E2D8", mel: "#C9974A", violeta: "#6A3FC4" };

// Lente que revela o novo visual sobre o rosto, como o capacete do site do Lando Norris.
// Funciona com cursor e com o dedo; parada, ela passeia sozinha pelo rosto.
export function EspelhoInterativo() {
  const { t } = useIdioma();
  const [opcao, setOpcao] = useState<Opcao>("corte");
  const [tom, setTom] = useState<Tom>("platinado");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [raio, setRaio] = useState(108);
  const [tocou, setTocou] = useState(false);
  const [toque, setToque] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const interagiu = useRef(false);

  useEffect(() => {
    setToque(window.matchMedia("(hover: none)").matches);
    // pré-carrega as variações para a troca ser instantânea
    Object.values(IMAGENS).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // raio proporcional ao tamanho do espelho
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRaio(Math.round(Math.max(70, Math.min(130, el.clientWidth * 0.27)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // enquanto ninguém mexe, a lente passeia devagar (chama atenção no telão)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const el = area.current;
      if (!el || interagiu.current) return;
      const s = (agora - inicio) / 1000;
      const w = el.clientWidth;
      const h = el.clientHeight;
      setPos({ x: w * (0.5 + 0.2 * Math.sin(s * 0.7)), y: h * (0.3 + 0.12 * Math.sin(s * 1.1 + 1)) });
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, []);

  const mover = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    interagiu.current = true;
    setTocou(true);
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const imagem = opcao === "cor" ? IMAGENS[tom] : opcao === "corte" ? BASE : IMAGENS[opcao];
  const nome = opcao === "cor" ? `${t.hero.nomes.cor} · ${t.hero.tons[tom]}` : t.hero.nomes[opcao];
  const cx = pos ? `${pos.x}px` : "50%";
  const cy = pos ? `${pos.y}px` : "28%";
  const lente = { width: raio * 2, height: raio * 2, left: `calc(${cx} - ${raio}px)`, top: `calc(${cy} - ${raio}px)` };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-[440px] border border-ouro-escuro p-2.5">
        <div
          ref={area}
          onPointerMove={mover}
          onPointerDown={mover}
          className="relative aspect-[3/4] w-full cursor-crosshair touch-none overflow-hidden border border-linha bg-[#0F0F11] select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BASE} alt={t.hero.altAntes} draggable={false} className="absolute inset-0 h-full w-full object-cover" />

          <div className="absolute inset-0" style={{ clipPath: `circle(${raio}px at ${cx} ${cy})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagem} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            {opcao === "corte" && <MarcasCorte marcas={t.hero.marcas} />}
          </div>

          <div aria-hidden className={`pointer-events-none absolute rounded-full border-[1.5px] border-ouro ${tocou ? "opacity-0" : "pulso"}`} style={lente} />
          <div aria-hidden className="pointer-events-none absolute rounded-full border-[1.5px] border-texto" style={lente} />

          <span className="pointer-events-none absolute top-3.5 left-3.5 bg-fundo/60 px-2 py-1 font-mono text-[11px] tracking-[0.16em]">VISAVISION</span>
          <div className="pointer-events-none absolute bottom-3.5 left-3.5 flex flex-col gap-1 bg-fundo/70 px-3 py-2" aria-live="polite">
            <span className="font-mono text-[11px] tracking-[0.16em] text-ouro uppercase">{t.hero.simulacao}</span>
            <span className="text-[17px] font-medium">{nome}</span>
          </div>
        </div>
      </div>

      <div role="group" aria-label={t.hero.grupoAlteracao} className="flex flex-wrap justify-center gap-2">
        {(Object.keys(t.hero.opcoes) as Opcao[]).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === opcao}
            onClick={() => setOpcao(o)}
            className={`min-h-11 cursor-pointer rounded-full border px-[18px] text-sm font-medium transition-colors ${
              o === opcao ? "border-ouro bg-ouro text-fundo" : "border-linha-forte hover:border-ouro"
            }`}
          >
            {t.hero.opcoes[o]}
          </button>
        ))}
      </div>

      {opcao === "cor" && (
        <div role="group" aria-label={t.hero.grupoTom} className="flex flex-wrap justify-center gap-2">
          {(Object.keys(PONTOS) as Tom[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={c === tom}
              onClick={() => setTom(c)}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                c === tom ? "border-ouro" : "border-linha-forte hover:border-ouro-escuro"
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: PONTOS[c] }} />
              {t.hero.tons[c]}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-[13px] text-apagado">
        {toque ? t.hero.dicaToque : t.hero.dicaCursor} {t.hero.aviso}
      </p>
    </div>
  );
}

// Contorno do novo corte com as medidas, desenhado sobre a foto.
function MarcasCorte({ marcas }: { marcas: string[] }) {
  // a largura da caixa acompanha o texto, que muda com o idioma
  const largura = (i: number) => 32 + (marcas[i]?.length ?? 0) * 15.2;
  const caixas = [
    { x: 820 - largura(0), y: 92, w: largura(0) },
    { x: 434 - largura(1) / 2, y: 150, w: largura(1) },
    { x: 20, y: 520, w: largura(2) },
  ];
  return (
    <svg viewBox="0 0 840 1120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
      <rect width="840" height="1120" fill="#0B0B0C" opacity="0.3" />
      <path
        d="M163 482C150 430 148 320 170 248C190 182 222 118 286 78C350 38 470 26 560 50C640 72 676 160 662 246C652 320 652 420 637 486"
        stroke="#E0B23B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M176 262C250 214 330 200 410 204C490 208 580 222 650 258" stroke="#E0B23B" strokeWidth="3" strokeDasharray="12 10" strokeLinecap="round" />
      <path d="M112 392H156M112 424H154M112 456H156M664 392H712M664 424H712M664 456H712" stroke="#E0B23B" strokeWidth="3" strokeDasharray="8 7" />
      {caixas.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height="42" fill="#0B0B0C" opacity="0.78" />
          <text x={c.x + 16} y={c.y + 28} fill="#E0B23B" fontFamily="JetBrains Mono, monospace" fontSize="22" letterSpacing="2">
            {marcas[i]?.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}
