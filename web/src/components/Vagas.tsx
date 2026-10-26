"use client";

import Link from "next/link";
import { useState } from "react";
import { buscarVaga, VAGAS, type AreaVaga, type Vaga } from "@/data/vagas";
import { useIdioma } from "@/lib/i18n";
import { Revelar } from "./Revelar";

// "1 vaga" ou "3 vagas", no idioma atual.
function useQuantidade() {
  const { t } = useIdioma();
  return (n: number) => (n === 1 ? t.vagas.umaVaga : t.vagas.variasVagas.replace("{n}", String(n)));
}

// Áreas na ordem em que aparecem na lista, sem repetir.
const AREAS = [...new Set(VAGAS.map((v) => v.area))];

/** Lista de vagas da página Trabalhe Conosco, com filtro por área. */
export function ListaVagas() {
  const { t, idioma } = useIdioma();
  const v = t.vagas;
  const quantidade = useQuantidade();
  const [area, setArea] = useState<AreaVaga | "todas">("todas");
  const lista = area === "todas" ? VAGAS : VAGAS.filter((vaga) => vaga.area === area);

  return (
    <section id="vagas" className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-4 pb-24 sm:px-8" aria-labelledby="titulo-vagas">
      <Revelar className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="titulo-vagas" className="text-[clamp(30px,3.6vw,48px)] font-medium tracking-tight">
            {v.titulo}
          </h2>
          <span className="selo-demo">{v.aviso}</span>
        </div>
        <p className="max-w-[60ch] text-[17px] leading-relaxed text-texto-2">{v.texto.replace("{n}", String(VAGAS.length))}</p>
      </Revelar>

      <div role="group" aria-label={v.filtro} className="mt-8 flex flex-wrap gap-2">
        {(["todas", ...AREAS] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={a === area}
            onClick={() => setArea(a)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors ${
              a === area ? "border-azul bg-azul text-sobre-azul" : "border-linha-forte hover:border-azul"
            }`}
          >
            {a === "todas" ? v.todas : v.areas[a]}
          </button>
        ))}
      </div>

      <ul className="mt-8 border-t border-linha">
        {lista.map((vaga) => {
          const tx = vaga.textos[idioma];
          return (
            <li key={vaga.slug} className="border-b border-linha">
              <Link
                href={`/trabalhe-conosco/${vaga.slug}/`}
                className="group grid gap-2 py-6 transition-colors hover:bg-superficie sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:px-4"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="rotulo !text-[11px]">{v.areas[vaga.area]}</span>
                  <span className="text-xl font-medium tracking-tight transition-colors group-hover:text-azul sm:text-2xl">{tx.cargo}</span>
                  <span className="text-[15px] text-texto-2">{tx.resumo}</span>
                </span>
                <span className="flex items-center gap-4 font-mono text-xs tracking-[0.12em] text-apagado uppercase">
                  <span>{quantidade(vaga.quantidade)}</span>
                  <span>{v.regimeValor.split(" ")[0]}</span>
                  <span className="text-azul transition-transform group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">{v.verDetalhes}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <Revelar como="section" className="flex flex-col gap-4 border-t border-linha pt-6">
      <h2 className="rotulo">{titulo}</h2>
      <ul className="flex flex-col gap-3">
        {itens.map((item, i) => (
          <li key={i} className="flex gap-3 text-[16px] leading-relaxed">
            <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-azul" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Revelar>
  );
}

/** Página de uma vaga: requisitos, atribuições, responsabilidades, benefícios e o botão de candidatura. */
export function VagaConteudo({ slug }: { slug: string }) {
  const { t, idioma } = useIdioma();
  const v = t.vagas;
  const quantidade = useQuantidade();
  const vaga = buscarVaga(slug) as Vaga; // a rota só gera páginas para slugs que existem
  const tx = vaga.textos[idioma];
  const candidatar = `/trabalhe-conosco/?vaga=${vaga.slug}#candidatura`;

  const ficha = [
    { rotulo: v.regime, valor: v.regimeValor },
    { rotulo: v.escala, valor: v.escalaValor },
    { rotulo: v.horario, valor: v.horarioValor },
    { rotulo: v.salario, valor: v.salarioValor },
  ];

  return (
    <article className="mx-auto w-full max-w-[1280px] px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <Link href="/trabalhe-conosco/#vagas" className="inline-flex min-h-11 items-center gap-2 text-sm text-apagado transition-colors hover:text-azul">
        <span aria-hidden>←</span> {v.voltar}
      </Link>

      <Revelar className="mt-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rotulo">{v.areas[vaga.area]}</span>
          <span className="rotulo">·</span>
          <span className="rotulo">{quantidade(vaga.quantidade)}</span>
        </div>
        <h1 className="max-w-[20ch] text-[clamp(38px,5.4vw,76px)] leading-[1.02] font-medium tracking-[-0.03em]">{tx.cargo}</h1>
        <p className="max-w-[60ch] text-lg leading-relaxed text-texto-2">{tx.resumo}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={candidatar} className="btn-azul">
            {v.candidatar}
          </Link>
          <span className="selo-demo">{v.aviso}</span>
        </div>
      </Revelar>

      <dl className="mt-12 grid gap-px border border-linha bg-linha sm:grid-cols-2 lg:grid-cols-4">
        {ficha.map((item) => (
          <div key={item.rotulo} className="flex flex-col gap-2 bg-fundo p-5">
            <dt className="rotulo !text-[11px]">{item.rotulo}</dt>
            <dd className="text-[17px] font-medium">{item.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <Lista titulo={v.requisitos} itens={tx.requisitos} />
        <Lista titulo={v.atribuicoes} itens={tx.atribuicoes} />
        <Lista titulo={v.responsabilidades} itens={tx.responsabilidades} />
        <Revelar como="section" className="flex flex-col gap-4 border-t border-linha pt-6">
          <h2 className="rotulo">{v.beneficios}</h2>
          <ul className="flex flex-col gap-3">
            {v.beneficiosLista.map((item, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed">
                <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-ciano" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-apagado">{v.direitos}</p>
        </Revelar>
      </div>

      <div className="mt-16 flex flex-col items-start gap-4 border border-azul-escuro bg-superficie p-8 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-2xl font-medium tracking-tight">{tx.cargo}</span>
        <Link href={candidatar} className="btn-azul">
          {v.candidatar}
        </Link>
      </div>
    </article>
  );
}
