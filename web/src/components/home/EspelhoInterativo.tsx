"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n";
import { MiroGuia } from "../MiroGuia";
import { criarRevelacaoCSS } from "./revelacao/css";
import type { OpcoesRevelacao, Revelacao } from "./revelacao/tipos";

type Opcao = "corte" | "cor" | "barba" | "estetica";
type Tom = "platinado" | "mel" | "violeta";

const BASE = "/img/espelho/espelho-base.jpg";
const IMAGENS: Record<string, string> = {
  corte: "/img/espelho/espelho-corte-curto.jpg",
  platinado: "/img/espelho/espelho-cor-platinado.jpg",
  mel: "/img/espelho/espelho-cor-mel.jpg",
  violeta: "/img/espelho/espelho-cor-violeta.jpg",
  barba: "/img/espelho/espelho-barba.jpg",
  estetica: "/img/espelho/espelho-estetica.jpg",
};
const PONTOS: Record<Tom, string> = { platinado: "#E6E2D8", mel: "#C9974A", violeta: "#6A3FC4" };

// Espelho do hero: o novo visual "vaza" em volta do cursor ou do dedo, como no site do Lando Norris.
//
// Divisão de tarefas:
// - Este componente (React) cuida só dos botões e dos textos. Ele muda de estado
//   apenas quando alguém clica numa opção.
// - A animação roda FORA do React, em revelacao/: WebGL (three.js) quando o aparelho
//   tem, e CSS como reserva. Assim o React não redesenha a tela 60 vezes por segundo.
export function EspelhoInterativo() {
  const { t } = useIdioma();
  const [opcao, setOpcao] = useState<Opcao>("corte");
  const [tom, setTom] = useState<Tom>("platinado");
  const [modo, setModo] = useState<"webgl" | "css">("webgl");
  const area = useRef<HTMLDivElement>(null);
  const camada = useRef<HTMLDivElement>(null);
  const motor = useRef<Revelacao | null>(null);

  const imagem = opcao === "cor" ? IMAGENS[tom] : IMAGENS[opcao];
  const imagemAtual = useRef(imagem);

  useEffect(() => {
    // ?espelho=css no endereço força a reserva, para testar como ela fica
    if (new URLSearchParams(window.location.search).get("espelho") === "css") setModo("css");
  }, []);

  // Cria a revelação (e a recria se cair para o modo CSS).
  useEffect(() => {
    const el = area.current;
    const cam = camada.current;
    if (!el || !cam) return;
    let cancelado = false;
    const opcoes = (): OpcoesRevelacao => ({
      area: el,
      camada: cam,
      base: BASE,
      imagem: imagemAtual.current,
      preCarregar: Object.values(IMAGENS),
      reduzir: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      aoFalhar: () => setModo("css"),
    });

    if (modo === "css") {
      motor.current = criarRevelacaoCSS(opcoes());
    } else {
      // o three.js só é baixado aqui, depois que a página já apareceu
      import("./revelacao/webgl")
        .then(({ criarRevelacaoWebGL }) => {
          if (cancelado) return;
          const m = criarRevelacaoWebGL(opcoes());
          if (m) motor.current = m;
          else setModo("css"); // sem WebGL neste aparelho
        })
        .catch(() => {
          if (!cancelado) setModo("css");
        });
    }

    return () => {
      cancelado = true;
      motor.current?.destruir();
      motor.current = null;
    };
  }, [modo]);

  // Clicou numa opção: avisa a revelação.
  useEffect(() => {
    imagemAtual.current = imagem;
    motor.current?.trocar(imagem);
  }, [imagem]);

  const nome = opcao === "cor" ? `${t.hero.nomes.cor} · ${t.hero.tons[tom]}` : t.hero.nomes[opcao];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-[440px] border border-azul-escuro p-2.5">
        <div
          ref={area}
          data-modo={modo}
          className="relative aspect-[3/4] w-full cursor-crosshair touch-none overflow-hidden border border-linha bg-[#0F0F11] select-none"
        >
          {/* foto "antes": aparece na hora, antes mesmo do WebGL carregar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BASE} alt={t.hero.altAntes} draggable={false} className="absolute inset-0 h-full w-full object-cover" />

          {/* a revelação desenha aqui dentro (canvas do WebGL ou imagens do CSS) */}
          <div ref={camada} aria-hidden className="absolute inset-0" />

          <span className="pointer-events-none absolute top-3.5 left-3.5 bg-fundo/60 px-2 py-1 font-mono text-[11px] tracking-[0.16em]">VISAVISION</span>
          <div className="pointer-events-none absolute bottom-3.5 left-3.5 flex flex-col gap-1 bg-fundo/70 px-3 py-2" aria-live="polite">
            <span className="font-mono text-[11px] tracking-[0.16em] text-azul uppercase">{t.hero.simulacao}</span>
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
              o === opcao ? "border-azul bg-azul text-sobre-azul" : "border-linha-forte hover:border-azul"
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
                c === tom ? "border-azul" : "border-linha-forte hover:border-azul-escuro"
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: PONTOS[c] }} />
              {t.hero.tons[c]}
            </button>
          ))}
        </div>
      )}

      {/* o Miro pousa aqui e explica como usar o espelho (no lugar da antiga dica em texto) */}
      <MiroGuia falas={t.miro.falas.hero} lado="esquerda" efeito="pousar" modo="linha" className="w-full max-w-[440px]" />
      <p className="text-center text-[12px] text-apagado">{t.hero.aviso}</p>
    </div>
  );
}

// Contorno do novo corte com as medidas, desenhado sobre a foto.
{/*function MarcasCorte({ marcas }: { marcas: string[] }) {
  // a largura da caixa acompanha o texto, que muda com o idioma
  const largura = (i: number) => 32 + (marcas[i]?.length ?? 0) * 15.2;
  const caixas = [
    { x: 820 - largura(0), y: 92, w: largura(0) },
    { x: 434 - largura(1) / 2, y: 150, w: largura(1) },
    { x: 20, y: 520, w: largura(2) },
  ];
  return (
    <svg viewBox="0 0 840 1120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
      <rect width="840" height="1120" fill="#00102A" opacity="0.3" />
      <path
        d="M163 482C150 430 148 320 170 248C190 182 222 118 286 78C350 38 470 26 560 50C640 72 676 160 662 246C652 320 652 420 637 486"
        stroke="#4D97FF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M176 262C250 214 330 200 410 204C490 208 580 222 650 258" stroke="#4D97FF" strokeWidth="3" strokeDasharray="12 10" strokeLinecap="round" />
      <path d="M112 392H156M112 424H154M112 456H156M664 392H712M664 424H712M664 456H712" stroke="#4D97FF" strokeWidth="3" strokeDasharray="8 7" />
      {caixas.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height="42" fill="#00102A" opacity="0.78" />
          <text x={c.x + 16} y={c.y + 28} fill="#4D97FF" fontFamily="JetBrains Mono, monospace" fontSize="22" letterSpacing="2">
            {marcas[i]?.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}*/}
