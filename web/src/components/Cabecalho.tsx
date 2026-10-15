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
            i === idioma ? "text-ouro" : "text-apagado hover:text-texto"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

// Logo original (só o olho, metal dourado) no topo do site.
export function LogoOlho({ altura = 48 }: { altura?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/img/logo/olho-original.png" alt="MiraV" style={{ height: altura, width: "auto" }} className="block max-w-none shrink-0 self-start" />
  );
}

export function Cabecalho({ minimo = false }: { minimo?: boolean }) {
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

        {minimo ? (
          <SeletorIdioma />
        ) : (
          <>
            <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={caminho === l.href ? "page" : undefined}
                  className={`py-2.5 transition-colors hover:text-ouro ${caminho === l.href ? "text-ouro" : ""}`}
                >
                  {l.nome}
                </Link>
              ))}
              <SeletorIdioma />
            </nav>

            <button
              type="button"
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center lg:hidden"
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
          </>
        )}
      </div>

      {!minimo && aberto && (
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
