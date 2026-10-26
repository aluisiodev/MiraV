"use client";

import { useEffect, useState } from "react";

// "Digita" as falas do Miro, uma de cada vez, letra por letra.
// Usado na página de Produtos (em ciclo) e na home (uma vez, e de novo quando clicam nele).

/** Milissegundos por letra. */
const VELOCIDADE = 26;
/** Quanto tempo cada fala fica na tela depois de digitada. */
const PAUSA = 2600;

type Opcoes = {
  /** true: volta para a primeira fala no fim. false: para na última e marca "terminou". */
  ciclo?: boolean;
  /** Espera antes da primeira letra (ms), para o robô terminar de entrar. */
  espera?: number;
  /** Mude este número para recomeçar do início (ex.: quando clicam no Miro). */
  rodada?: number;
};

export function useFalas(falas: string[], ativo: boolean, { ciclo = true, espera = 380, rodada = 0 }: Opcoes = {}) {
  const [indice, setIndice] = useState(0);
  const [letras, setLetras] = useState(0);
  const [terminou, setTerminou] = useState(false);

  useEffect(() => {
    setIndice(0);
    setLetras(0);
    setTerminou(false);
    if (!ativo) return;

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let n = 0;
    let timer = 0;
    const passo = () => {
      const texto = falas[i];
      if (reduzir) {
        n = texto.length; // sem animação: a frase aparece inteira
      } else if (n < texto.length) {
        n++;
        setLetras(n);
        timer = window.setTimeout(passo, VELOCIDADE);
        return;
      }
      setLetras(n);
      // frase completa: espera e passa para a próxima (ou termina)
      timer = window.setTimeout(
        () => {
          if (!ciclo && i === falas.length - 1) {
            setTerminou(true);
            return;
          }
          i = (i + 1) % falas.length;
          n = 0;
          setIndice(i);
          setLetras(0);
          passo();
        },
        reduzir ? PAUSA * 1.6 : PAUSA,
      );
    };
    timer = window.setTimeout(passo, reduzir ? 0 : espera);
    return () => window.clearTimeout(timer);
  }, [ativo, falas, ciclo, espera, rodada]);

  const texto = falas[indice] ?? "";
  return { texto: texto.slice(0, letras), digitando: ativo && !terminou && letras < texto.length, terminou };
}
