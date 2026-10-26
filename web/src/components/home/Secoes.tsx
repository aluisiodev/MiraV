"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n";
import { FORMATOS, IconeEspelho } from "../FormatoEspelho";
import { MiroGuia } from "../MiroGuia";
import { Revelar, useVisivel } from "../Revelar";
import { EspelhoInterativo } from "./EspelhoInterativo";

function Titulo({ rotulo, numero, titulo, destaque }: { rotulo: string; numero: string; titulo: string; destaque: string }) {
  return (
    <Revelar className="flex flex-col gap-4">
      <span className="rotulo">
        {numero} · {rotulo}
      </span>
      <h2 className="max-w-[18ch] text-[clamp(34px,4.6vw,60px)] leading-[1.04] font-medium tracking-[-0.025em]">
        {titulo} <span className="destaque">{destaque}</span>
      </h2>
    </Revelar>
  );
}

const secao = "mx-auto w-full max-w-[1280px] px-4 sm:px-8";
// seções com o Miro: "relative" para posicioná-lo e "overflow-x-clip" para ele entrar
// voando ou espiando sem criar rolagem lateral
const comMiro = "relative overflow-x-clip";

/* 01 · Hero com o espelho interativo */
export function Hero() {
  const { t } = useIdioma();
  return (
    <section className={`${secao} flex min-h-[calc(100dvh-68px)] flex-col justify-center gap-10 pt-6 pb-8`}>
      <div className="flex flex-wrap items-center gap-x-14 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-7">
          <span className="rotulo">{t.hero.rotulo}</span>
          <h1 className="text-[clamp(40px,5.2vw,76px)] leading-[1.02] font-medium tracking-[-0.025em]">
            {t.hero.titulo1} <span className="destaque">{t.hero.destaque}</span> {t.hero.titulo2}
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-texto-2">{t.hero.texto}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contato/" className="btn-azul">
              {t.hero.ctaPrincipal}
            </Link>
            <Link href="/produtos/" className="btn-linha">
              {t.hero.ctaSecundario}
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] justify-center">
          <EspelhoInterativo />
        </div>
      </div>
      <div className="hidden justify-between font-mono text-xs tracking-[0.14em] text-apagado uppercase md:flex">
        <span>{t.hero.role}</span>
        <span>01 / 08</span>
      </div>
    </section>
  );
}

/* 02 · Manifesto: as palavras acendem conforme a rolagem */
export function Manifesto() {
  const { t } = useIdioma();
  const ref = useRef<HTMLElement>(null);
  const [progresso, setProgresso] = useState(0);
  const palavras = t.manifesto.frase.split(" ");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgresso(1);
      return;
    }
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgresso(Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height * 0.6))));
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <section ref={ref} className={`${secao} ${comMiro} py-28 sm:py-40`} aria-label={t.manifesto.rotulo}>
      <MiroGuia falas={t.miro.falas.manifesto} lado="direita" efeito="espiar" className="miro-topo-dentro" />
      <span className="rotulo">02 · {t.manifesto.rotulo}</span>
      <p className="mt-8 font-serif text-[clamp(44px,7.4vw,112px)] leading-[1.02] font-normal tracking-[-0.01em] italic">
        {palavras.map((p, i) => {
          const aceso = progresso * palavras.length > i;
          return (
            <span key={i} className="transition-colors duration-300" style={{ color: aceso ? "var(--color-azul)" : "var(--color-linha-forte)" }}>
              {p}{" "}
            </span>
          );
        })}
      </p>
      <Revelar className="mt-12 ml-auto max-w-[560px] text-lg leading-relaxed text-texto-2">
        <p>{t.manifesto.texto}</p>
      </Revelar>
    </section>
  );
}

/* 03 · Resultados com números animados */
function Contador({ valor, prefixo, sufixo, ativo }: { valor: number; prefixo: string; sufixo: string; ativo: boolean }) {
  const { idioma } = useIdioma();
  const [atual, setAtual] = useState(0);
  const decimais = Number.isInteger(valor) ? 0 : 1;
  useEffect(() => {
    if (!ativo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAtual(valor);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / 1600);
      setAtual(valor * (1 - Math.pow(1 - p, 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ativo, valor]);
  const texto = atual.toLocaleString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
  return (
    <span className="tabular-nums">
      {prefixo}
      {texto}
      {sufixo}
    </span>
  );
}

export function Resultados() {
  const { t } = useIdioma();
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useVisivel(ref);
  return (
    <section className={`${secao} ${comMiro} py-24`}>
      <MiroGuia falas={t.miro.falas.resultados} lado="esquerda" efeito="teletransporte" />
      <Titulo numero="03" rotulo={t.resultados.rotulo} titulo={t.resultados.titulo} destaque={t.resultados.destaque} />
      <div ref={ref} className="mt-14 grid grid-cols-1 gap-px border border-linha bg-linha sm:grid-cols-2 lg:grid-cols-4">
        {t.resultados.itens.map((item, i) => (
          <div key={i} className="flex flex-col gap-3 bg-fundo p-6 sm:p-8">
            <span className="text-[clamp(52px,6vw,80px)] leading-none font-medium tracking-[-0.03em] text-azul">
              <Contador valor={item.valor} prefixo={item.prefixo} sufixo={item.sufixo} ativo={visivel} />
            </span>
            <span className="max-w-[24ch] text-[15px] leading-snug text-texto-2">{item.texto}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-apagado">{t.resultados.nota}</p>
    </section>
  );
}

/* 04 · Para quem: cartões que se expandem */
export function Publico() {
  const { t } = useIdioma();
  const [ativo, setAtivo] = useState(0);
  return (
    <section className={`${secao} ${comMiro} py-24`}>
      <MiroGuia falas={t.miro.falas.publico} lado="direita" efeito="voar" />
      <Titulo numero="04" rotulo={t.publico.rotulo} titulo={t.publico.titulo} destaque={t.publico.destaque} />
      <div className="mt-14 flex flex-col gap-3 lg:h-[440px] lg:flex-row">
        {t.publico.itens.map((item, i) => {
          const aberto = i === ativo;
          return (
            <div
              key={i}
              onMouseEnter={() => setAtivo(i)}
              className={`group relative flex min-w-0 flex-col overflow-hidden border transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
                aberto ? "border-azul-escuro bg-superficie lg:flex-[2.6]" : "border-linha bg-fundo lg:flex-1"
              }`}
            >
              <button
                type="button"
                aria-expanded={aberto}
                aria-controls={`publico-${i}`}
                onClick={() => setAtivo(i)}
                className="flex w-full cursor-pointer items-start justify-between gap-4 p-6 text-left lg:h-full lg:flex-col"
              >
                <span className="font-mono text-xs tracking-[0.16em] text-apagado">0{i + 1}</span>
                <span className="flex flex-col gap-2 lg:mt-auto">
                  <span className={`text-2xl font-medium tracking-tight ${aberto ? "text-azul" : ""}`}>{item.nome}</span>
                  <span className={`text-[15px] text-texto-2 ${aberto ? "" : "lg:hidden"}`}>{item.resumo}</span>
                </span>
                <span aria-hidden className={`text-2xl text-azul transition-transform lg:hidden ${aberto ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              <div
                id={`publico-${i}`}
                className={`grid transition-[grid-template-rows] duration-500 ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <p className="overflow-hidden px-6 text-[15px] leading-relaxed text-texto-2">
                  <span className="block max-w-[46ch] pb-6">{item.detalhe}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 05 · Fluxograma interativo */
export function Fluxo() {
  const { t } = useIdioma();
  const [ativo, setAtivo] = useState(0);
  const [automatico, setAutomatico] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useVisivel(ref);
  const etapas = t.fluxo.etapas;

  useEffect(() => {
    if (!automatico || !visivel) return;
    const id = window.setInterval(() => setAtivo((a) => (a + 1) % etapas.length), 3200);
    return () => window.clearInterval(id);
  }, [automatico, visivel, etapas.length]);

  return (
    <section className={`${secao} ${comMiro} py-24`}>
      <MiroGuia falas={t.miro.falas.fluxo} lado="esquerda" efeito="surgir" />
      <Titulo numero="05" rotulo={t.fluxo.rotulo} titulo={t.fluxo.titulo} destaque={t.fluxo.destaque} />
      <div ref={ref} className="mt-12">
        <ol className="relative grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-0">
          <div aria-hidden className="absolute top-7 right-[10%] left-[10%] hidden h-px bg-linha-forte md:block">
            <div className="h-px bg-azul transition-all duration-700" style={{ width: `${(ativo / (etapas.length - 1)) * 100}%` }} />
          </div>
          {etapas.map((e, i) => {
            const feito = i <= ativo;
            return (
              <li key={i} className="relative flex md:justify-center">
                <button
                  type="button"
                  aria-pressed={i === ativo}
                  onClick={() => {
                    setAutomatico(false);
                    setAtivo(i);
                  }}
                  className="flex w-full cursor-pointer items-center gap-4 text-left md:flex-col md:text-center"
                >
                  <span
                    className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border font-mono text-sm transition-colors duration-500 ${
                      i === ativo ? "border-azul bg-azul text-sobre-azul" : feito ? "border-azul bg-fundo text-azul" : "border-linha-forte bg-fundo text-apagado"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span className={`text-lg font-medium transition-colors ${i === ativo ? "text-azul" : ""}`}>{e.nome}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 grid gap-6 border border-linha bg-superficie p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center" aria-live="polite">
          <span className="font-serif text-[88px] leading-none text-azul italic">0{ativo + 1}</span>
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-medium tracking-tight">{etapas[ativo].nome}</span>
            <p className="max-w-[60ch] text-[17px] leading-relaxed text-texto-2">{etapas[ativo].texto}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 06 · Casos (exemplos de uso) e uma conversa de atendimento */
export function Casos() {
  const { t } = useIdioma();
  const [caso, setCaso] = useState(0);
  const itens = t.casos.itens;
  const atual = itens[caso];
  return (
    <section className={`${secao} ${comMiro} py-24`}>
      <MiroGuia falas={t.miro.falas.casos} lado="direita" efeito="pousar" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Titulo numero="06" rotulo={t.casos.rotulo} titulo={t.casos.titulo} destaque={t.casos.destaque} />
        <span className="rotulo">{t.casos.nota}</span>
      </div>
      <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <article className="flex flex-col justify-between gap-10 border border-linha bg-superficie p-6 sm:p-10" aria-live="polite">
          <div key={caso} className="flex flex-col gap-5">
            <span className="rotulo">{atual.local}</span>
            <h3 className="text-[clamp(26px,3vw,38px)] leading-tight font-medium tracking-tight">{atual.titulo}</h3>
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-texto-2">{atual.texto}</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[56px] leading-none font-medium tracking-[-0.03em] text-azul">{atual.numero}</span>
              <span className="text-sm text-apagado">{atual.numeroTexto}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 font-mono text-xs text-apagado">
                0{caso + 1} / 0{itens.length}
              </span>
              <button
                type="button"
                aria-label={t.casos.anterior}
                onClick={() => setCaso((c) => (c - 1 + itens.length) % itens.length)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center border border-linha-forte transition-colors hover:border-azul hover:text-azul"
              >
                ←
              </button>
              <button
                type="button"
                aria-label={t.casos.proximo}
                onClick={() => setCaso((c) => (c + 1) % itens.length)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center border border-linha-forte transition-colors hover:border-azul hover:text-azul"
              >
                →
              </button>
            </div>
          </div>
        </article>
        <Conversa />
      </div>
    </section>
  );
}

function Conversa() {
  const { t } = useIdioma();
  const msgs = t.casos.conversa.mensagens;
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useVisivel(ref);
  const [mostradas, setMostradas] = useState(0);

  useEffect(() => {
    if (!visivel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMostradas(msgs.length);
      return;
    }
    setMostradas(0);
    const ids = msgs.map((_, i) => window.setTimeout(() => setMostradas(i + 1), 700 + i * 1400));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [visivel, msgs]);

  const estilo: Record<string, string> = {
    cliente: "self-end bg-superficie-2 border-linha-forte",
    espelho: "self-start border-azul-escuro bg-fundo",
    profissional: "self-start border-linha bg-superficie",
  };
  const quem: Record<string, string> = { cliente: "Cliente", espelho: "VisaVision", profissional: "Pro" };

  return (
    <div ref={ref} className="flex min-h-[440px] flex-col gap-3 border border-linha p-5 sm:p-6">
      <span className="rotulo">{t.casos.conversa.titulo}</span>
      <div className="mt-2 flex flex-1 flex-col gap-3" aria-live="polite">
        {msgs.slice(0, mostradas).map((m, i) => (
          <div key={i} className={`max-w-[85%] border px-4 py-3 text-[15px] leading-snug ${estilo[m.de]}`}>
            <span className={`mb-1 block font-mono text-[10px] tracking-[0.16em] uppercase ${m.de === "espelho" ? "text-azul" : "text-apagado"}`}>
              {quem[m.de]}
            </span>
            {m.texto}
          </div>
        ))}
        {mostradas < msgs.length && (
          <div className="digitando flex gap-1 self-start px-2 py-3" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-azul" />
            <span className="h-1.5 w-1.5 rounded-full bg-azul" />
            <span className="h-1.5 w-1.5 rounded-full bg-azul" />
          </div>
        )}
      </div>
    </div>
  );
}

/* 07 · Modelos */
export function Modelos() {
  const { t } = useIdioma();
  return (
    <section className={`${secao} ${comMiro} py-24`}>
      <MiroGuia falas={t.miro.falas.modelos} lado="esquerda" efeito="voar" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Titulo numero="07" rotulo={t.modelos.rotulo} titulo={t.modelos.titulo} destaque={t.modelos.destaque} />
        <Link href="/produtos/" className="btn-linha">
          {t.modelos.cta} →
        </Link>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {FORMATOS.map((f, i) => (
          <Revelar key={f} atraso={i * 80}>
            <Link
              href={`/produtos/#${f}`}
              className="group flex h-full flex-col items-center gap-6 border border-linha p-6 transition-colors hover:border-azul-escuro hover:bg-superficie"
            >
              <IconeEspelho formato={f} className="h-36 w-auto transition-transform duration-500 group-hover:scale-105" />
              <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-lg font-medium">{t.modelos.nomes[f]}</span>
                <span className="font-mono text-xs text-apagado">0{i + 1}</span>
              </span>
            </Link>
          </Revelar>
        ))}
      </div>
    </section>
  );
}

/* 08 · Chamada final */
export function Chamada() {
  const { t } = useIdioma();
  return (
    <section className={`${secao} ${comMiro} py-28 sm:py-40`}>
      <MiroGuia falas={t.miro.falas.chamada} lado="direita" efeito="surgir" />
      <Revelar className="flex flex-col items-start gap-8 border-t border-azul-escuro pt-12">
        <span className="rotulo">08</span>
        <h2 className="text-[clamp(48px,8vw,128px)] leading-[0.98] font-medium tracking-[-0.035em]">
          {t.chamada.titulo} <span className="destaque">{t.chamada.destaque}</span>
        </h2>
        <div className="flex w-full flex-wrap items-center justify-between gap-6">
          <p className="text-lg text-texto-2">{t.chamada.texto}</p>
          <Link href="/contato/" className="btn-azul">
            {t.chamada.cta} →
          </Link>
        </div>
      </Revelar>
    </section>
  );
}
