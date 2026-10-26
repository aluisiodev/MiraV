"use client";

import { useEffect, useState } from "react";
import type { Formato } from "@/lib/api";
import { useIdioma } from "@/lib/i18n";
import { useFalas } from "@/lib/useFalas";
import { IconeEspelho } from "./FormatoEspelho";
import { RoboMirav } from "./RoboMirav";

// Palco de cada produto na página Produtos: o ícone do espelho e o Miro, o robozinho da MiraV.
// Quando o produto fica "ativo" (mouse em cima, foco do teclado ou, no celular, o produto no meio
// da tela), o Miro surge e vai digitando nos balões onde aquele espelho funciona melhor.

export function PalcoProduto({ formato, ativo }: { formato: Formato; ativo: boolean }) {
  const { t } = useIdioma();
  const a = t.produtos.assistente;
  const falas = a.falas[formato];
  const { texto, digitando } = useFalas(falas, ativo);

  return (
    <div className="palco relative flex h-64 items-center justify-center overflow-hidden border border-linha bg-superficie" data-ativo={ativo}>
      <IconeEspelho formato={formato} ativo className="palco-espelho h-40 w-auto" />

      {/* balão e robô são decorativos: o mesmo conteúdo está no texto escondido logo abaixo */}
      <div className="balao-pixel" aria-hidden>
        <span className="mb-1 block text-[10px] tracking-[0.2em] text-azul">{a.nome.toUpperCase()}</span>
        <span>{texto}</span>
        {digitando && <span className="balao-cursor">▌</span>}
      </div>
      <RoboMirav falando={digitando} className="palco-robo" />
      <p className="sr-only">
        {a.nome}: {falas.join(" ")}
      </p>
    </div>
  );
}

/**
 * Decide qual produto está ativo.
 * Com mouse: o que está debaixo do ponteiro (ou com foco do teclado).
 * No celular (sem hover): o produto que está passando pelo meio da tela.
 */
export function useProdutoAtivo() {
  const [ativo, setAtivo] = useState<Formato | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return;
    const linhas = document.querySelectorAll<HTMLElement>("[data-produto]");
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          const f = e.target.getAttribute("data-produto") as Formato;
          if (e.isIntersecting) setAtivo(f);
          else setAtivo((atual) => (atual === f ? null : atual));
        });
      },
      { rootMargin: "-38% 0px -38% 0px" }, // faixa no meio da tela
    );
    linhas.forEach((l) => io.observe(l));
    return () => io.disconnect();
  }, []);

  // props para colocar na linha de cada produto
  const props = (f: Formato) => ({
    "data-produto": f,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setAtivo(f),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && setAtivo((atual) => (atual === f ? null : atual)),
    onFocus: () => setAtivo(f),
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAtivo((atual) => (atual === f ? null : atual));
    },
  });

  return { ativo, props };
}
