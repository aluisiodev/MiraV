"use client";

import { useEffect, useState } from "react";
import { useIdioma } from "@/lib/i18n";
import { OlhoAnimado } from "./OlhoAnimado";

const CHAVE = "mirav-carregou";

// Tela de abertura com o olho piscando. Aparece uma vez por visita e some sozinha.
export function Carregamento() {
  const { t } = useIdioma();
  const [fase, setFase] = useState<"visivel" | "saindo" | "fim">("visivel");

  useEffect(() => {
    let jaViu = false;
    try {
      jaViu = sessionStorage.getItem(CHAVE) === "1";
      sessionStorage.setItem(CHAVE, "1");
    } catch {
      // sem armazenamento: mostra a abertura normalmente
    }
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duracao = jaViu ? 0 : reduzido ? 500 : 1900;
    const a = window.setTimeout(() => {
      setFase("saindo");
      // avisa quem espera a abertura sair (o Miro do topo da home, por exemplo)
      document.documentElement.dataset.pronto = "1";
      window.dispatchEvent(new Event("mirav:pronto"));
    }, duracao);
    const b = window.setTimeout(() => setFase("fim"), duracao + 600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (fase === "fim") return null;

  return (
    <div
      aria-hidden={fase === "saindo"}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-fundo transition-opacity duration-500 ${
        fase === "saindo" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <OlhoAnimado tamanho={150} rotulo={t.carregando} />
      <span className="font-marca text-[30px] font-medium tracking-[0.12em] text-azul">MIRAV</span>
      <div className="h-[2px] w-[200px] bg-linha">
        <div className="barra-carga h-[2px] bg-azul" />
      </div>
      <span className="rotulo !text-[11px] !tracking-[0.2em]">{t.carregando}</span>
    </div>
  );
}
