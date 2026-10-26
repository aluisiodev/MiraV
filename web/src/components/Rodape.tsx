"use client";

import Link from "next/link";
import { useIdioma } from "@/lib/i18n";
import { LogoOlho, SeletorIdioma } from "./Cabecalho";

// Crédito de quem desenvolveu o site, com link para o LinkedIn.
const LINKEDIN_AUTOR = "https://www.linkedin.com/in/aluisio-alves/";

export function Rodape() {
  const { t } = useIdioma();
  return (
    <footer className="border-t border-linha">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <LogoOlho altura={56} />
          <p className="destaque !text-[28px] leading-tight sm:!text-[34px]">{t.assinatura}</p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="rotulo">{t.rodape.navegacao}</span>
          <nav aria-label={t.rodape.navegacao} className="flex flex-col gap-1 text-[15px]">
            <Link className="py-1.5 hover:text-azul" href="/produtos/">{t.menu.produtos}</Link>
            <Link className="py-1.5 hover:text-azul" href="/sobre/">{t.menu.sobre}</Link>
            <Link className="py-1.5 hover:text-azul" href="/contato/">{t.menu.contato}</Link>
            <Link className="py-1.5 hover:text-azul" href="/trabalhe-conosco/">{t.menu.trabalhe}</Link>
          </nav>
          <SeletorIdioma className="-ml-3" />
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-2 px-4 pb-8 font-mono text-[11px] tracking-[0.14em] text-apagado uppercase sm:px-8">
        <span>
          © 2026 MiraV · VisaVision · {t.rodape.projeto}
        </span>
        <span>
          {t.rodape.desenvolvido}{" "}
          <a href={LINKEDIN_AUTOR} target="_blank" rel="noopener noreferrer" className="text-texto-2 transition-colors hover:text-azul">
            Aluísio Alves
          </a>{" "}
          · {t.rodape.direitos}
        </span>
      </div>
    </footer>
  );
}
