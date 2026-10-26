"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n";
import { useFalas } from "@/lib/useFalas";
import { RoboMirav } from "./RoboMirav";

// O Miro como guia da home: em cada seção ele aparece num ponto diferente (esquerda ou direita),
// entra com um efeito (pousando, voando, espiando...) e explica o que a pessoa está vendo.
//
// Como funciona:
// - Fica escondido até a seção entrar na tela (IntersectionObserver).
// - Então faz a entrada (classes .miro-* em globals.css; cada efeito é uma animação CSS).
// - Depois digita as falas uma vez. O balão some alguns segundos depois da última.
// - Clicar nele repete as falas.
// - Com "reduzir movimento" ligado, ele já aparece parado e o texto vem inteiro.

export type EfeitoMiro = "pousar" | "voar" | "surgir" | "espiar" | "teletransporte";

/** Duração de cada entrada, em ms. Precisa bater com as animações em globals.css. */
const DURACAO: Record<EfeitoMiro, number> = { pousar: 1200, voar: 1300, surgir: 450, espiar: 1500, teletransporte: 800 };
/** Quanto tempo o balão fica depois da última fala. */
const BALAO_FICA = 4000;

/** Espera a tela de carregamento sair (Carregamento.tsx avisa com o evento "mirav:pronto"). */
function quandoSitePronto(fn: () => void) {
  if (document.documentElement.dataset.pronto === "1") {
    fn();
    return () => {};
  }
  window.addEventListener("mirav:pronto", fn, { once: true });
  return () => window.removeEventListener("mirav:pronto", fn);
}

export function MiroGuia({
  falas,
  lado = "esquerda",
  efeito = "surgir",
  modo = "canto",
  className = "",
}: {
  falas: string[];
  /** De que lado ele fica; o balão abre para o lado de dentro. */
  lado?: "esquerda" | "direita";
  efeito?: EfeitoMiro;
  /** "canto": solto no espaço entre as seções. "linha": dentro do conteúdo, ocupando espaço. */
  modo?: "canto" | "linha";
  className?: string;
}) {
  const { t } = useIdioma();
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"escondido" | "entrando" | "pronto">("escondido");
  const [rodada, setRodada] = useState(0);
  const [balaoAberto, setBalaoAberto] = useState(true);
  const { texto, digitando, terminou } = useFalas(falas, estado === "pronto", { ciclo: false, espera: 200, rodada });

  // 1. aparece quando a seção dele entra na tela
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const alvo = modo === "canto" ? (el.parentElement ?? el) : el;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    let pararEspera = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        pararEspera = quandoSitePronto(() => {
          if (reduzir) {
            setEstado("pronto");
            return;
          }
          setEstado("entrando");
          timer = window.setTimeout(() => setEstado("pronto"), DURACAO[efeito]);
        });
      },
      { threshold: 0.3 },
    );
    io.observe(alvo);
    return () => {
      io.disconnect();
      pararEspera();
      window.clearTimeout(timer);
    };
  }, [efeito, modo]);

  // 2. o balão fecha um tempo depois da última fala
  useEffect(() => {
    if (!terminou) return;
    const id = window.setTimeout(() => setBalaoAberto(false), BALAO_FICA);
    return () => window.clearTimeout(id);
  }, [terminou]);

  const repetir = () => {
    if (estado !== "pronto") return;
    setBalaoAberto(true);
    setRodada((r) => r + 1);
  };

  const voando = estado === "entrando" && (efeito === "voar" || efeito === "pousar");

  return (
    <div ref={ref} className={`miro-guia miro-${modo} miro-${lado} ${className}`} data-efeito={efeito} data-estado={estado}>
      <button type="button" className="miro-botao" onClick={repetir} aria-label={t.miro.repetir} tabIndex={estado === "pronto" ? 0 : -1}>
        <RoboMirav propulsor falando={digitando} className={`miro-robo ${voando ? "voando" : ""}`} />
      </button>
      {/* o balão é decorativo: as falas explicam o que já está visível na seção */}
      <div className="balao-guia" data-visivel={estado === "pronto" && balaoAberto} aria-hidden>
        <span className="mb-1 block text-[10px] tracking-[0.2em] text-azul">MIRO</span>
        <span>{texto}</span>
        {digitando && <span className="balao-cursor">▌</span>}
      </div>
    </div>
  );
}
