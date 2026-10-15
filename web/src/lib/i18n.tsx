"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { pt, type Dicionario } from "@/i18n/pt";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

export type Idioma = "pt" | "en" | "es";
export const IDIOMAS: Idioma[] = ["pt", "en", "es"];
const dicionarios: Record<Idioma, Dicionario> = { pt, en, es };
const CHAVE = "mirav-idioma";

type Contexto = { idioma: Idioma; t: Dicionario; mudarIdioma: (i: Idioma) => void };

const IdiomaContext = createContext<Contexto>({ idioma: "pt", t: pt, mudarIdioma: () => {} });

function detectar(): Idioma {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "pt" || salvo === "en" || salvo === "es") return salvo;
  } catch {
    // navegação privada ou armazenamento bloqueado: segue para o idioma do navegador
  }
  const nav = (typeof navigator !== "undefined" ? navigator.language : "pt").slice(0, 2).toLowerCase();
  return nav === "en" || nav === "es" ? nav : "pt";
}

// O site é exportado em português; no navegador, troca para o idioma salvo ou do sistema.
export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("pt");

  useEffect(() => {
    setIdioma(detectar());
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma === "pt" ? "pt-BR" : idioma;
  }, [idioma]);

  const mudarIdioma = useCallback((i: Idioma) => {
    setIdioma(i);
    try {
      localStorage.setItem(CHAVE, i);
    } catch {
      // sem armazenamento: o idioma vale só nesta visita
    }
  }, []);

  return <IdiomaContext.Provider value={{ idioma, t: dicionarios[idioma], mudarIdioma }}>{children}</IdiomaContext.Provider>;
}

export const useIdioma = () => useContext(IdiomaContext);
