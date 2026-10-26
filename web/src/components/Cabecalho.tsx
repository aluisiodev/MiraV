"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IDIOMAS, useIdioma } from "@/lib/i18n";

export function SeletorIdioma({ className = "" }: { className?: string }) {
  const { idioma, mudarIdioma, t } = useIdioma();
  return (
    <div role="group" aria-label={t.menu.idioma} className={`flex gap-0.5 font-mono text-xs ${className}`}>
      {IDIOMAS.map((i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i === idioma}
          onClick={() => mudarIdioma(i)}
          className={`min-h-11 min-w-11 cursor-pointer uppercase transition-colors ${
            i === idioma ? "text-azul" : "text-apagado hover:text-texto"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

// Olho da logo nova (azul metálico, tirado dos slides de out/2026) no topo do site.
// O fundo é transparente, então funciona nos dois temas.
export function LogoOlho({ altura = 48 }: { altura?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/img/logo/olho-azul.png" alt="MiraV" style={{ height: altura, width: "auto" }} className="block max-w-none shrink-0 self-start" />
  );
}

const CHAVE_TEMA = "mirav-tema";
const COR_BARRA = { claro: "#FFFFFF", escuro: "#00102A" }; // cor da barra do navegador no celular

// Botão que alterna entre o tema claro (padrão) e o escuro (marinho).
// Ele só troca o atributo data-tema do <html>: as cores mudam sozinhas pelo CSS (globals.css).
// A escolha fica salva no navegador; o script em app/layout.tsx aplica antes da página aparecer.
export function BotaoTema({ className = "" }: { className?: string }) {
  const { t } = useIdioma();
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const atual = document.documentElement.dataset.tema === "escuro";
    setEscuro(atual);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", atual ? COR_BARRA.escuro : COR_BARRA.claro);
  }, []);

  const alternar = () => {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.dataset.tema = novo ? "escuro" : "claro";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", novo ? COR_BARRA.escuro : COR_BARRA.claro);
    try {
      localStorage.setItem(CHAVE_TEMA, novo ? "escuro" : "claro");
    } catch {
      // navegador sem armazenamento (aba anônima, por exemplo): o tema vale só nesta visita
    }
  };

  return (
    <button
      type="button"
      aria-pressed={escuro}
      aria-label={t.menu.temaEscuro}
      title={t.menu.temaEscuro}
      onClick={alternar}
      className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-apagado transition-colors hover:text-azul ${className}`}
    >
      {/* no claro mostra a lua (ir para o escuro); no escuro mostra o sol (voltar ao claro) */}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        {escuro ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </>
        ) : (
          <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
        )}
      </svg>
    </button>
  );
}

export function Cabecalho() {
  const { t } = useIdioma();
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => setAberto(false), [caminho]);
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const links = [
    { href: "/produtos/", nome: t.menu.produtos },
    { href: "/sobre/", nome: t.menu.sobre },
    { href: "/contato/", nome: t.menu.contato },
    { href: "/trabalhe-conosco/", nome: t.menu.trabalhe },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        rolou || aberto ? "border-b border-linha bg-fundo/90 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-3 sm:px-8">
        <Link href="/" aria-label={t.menu.inicio} className="flex min-h-11 items-center">
          <LogoOlho altura={44} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={caminho === l.href ? "page" : undefined}
              className={`py-2.5 transition-colors hover:text-azul ${caminho === l.href ? "text-azul" : ""}`}
            >
              {l.nome}
            </Link>
          ))}
          <div className="flex items-center gap-1">
            <BotaoTema />
            <SeletorIdioma />
          </div>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <BotaoTema />
          <button
            type="button"
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
            aria-expanded={aberto}
            aria-controls="menu-celular"
            aria-label={aberto ? t.menu.fechar : t.menu.abrir}
            onClick={() => setAberto((v) => !v)}
          >
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-[1.5px] w-6 bg-texto transition-all ${aberto ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-[1.5px] w-6 bg-texto transition-all ${aberto ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      {aberto && (
        <nav id="menu-celular" aria-label="Principal" className="flex h-[calc(100dvh-68px)] flex-col gap-1 px-4 pb-8 pt-4 lg:hidden">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-between border-b border-linha py-5 text-3xl font-medium tracking-tight"
            >
              {l.nome}
              <span className="font-mono text-xs text-apagado">0{i + 1}</span>
            </Link>
          ))}
          <SeletorIdioma className="mt-6" />
        </nav>
      )}
    </header>
  );
}
