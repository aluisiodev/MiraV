"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useIdioma } from "@/lib/i18n";
import { FORMATOS, IconeEspelho } from "./FormatoEspelho";
import { Formulario } from "./Formulario";
import { Revelar } from "./Revelar";

function Abertura({ rotulo, titulo, destaque, texto, children }: { rotulo: string; titulo: string; destaque: string; texto: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-14 pb-12 sm:px-8 sm:pt-24">
      <Revelar className="flex flex-col gap-6">
        <span className="rotulo">{rotulo}</span>
        <h1 className="max-w-[16ch] text-[clamp(42px,6.4vw,92px)] leading-[1] font-medium tracking-[-0.03em]">
          {titulo} <span className="destaque">{destaque}</span>
        </h1>
        <p className="max-w-[60ch] text-lg leading-relaxed text-texto-2">{texto}</p>
        {children}
      </Revelar>
    </section>
  );
}

export function ProdutosConteudo() {
  const { t } = useIdioma();
  const p = t.produtos;
  return (
    <>
      <Abertura rotulo={p.rotulo} titulo={p.titulo} destaque={p.destaque} texto={p.texto} />
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-8">
        <div className="flex flex-col border-t border-linha">
          {FORMATOS.map((f, i) => (
            <Revelar key={f} como="article">
              <div id={f} className="grid scroll-mt-24 gap-8 border-b border-linha py-12 md:grid-cols-[220px_1fr_auto] md:items-center">
                <div className="flex h-56 items-center justify-center border border-linha bg-superficie">
                  <IconeEspelho formato={f} ativo className="h-40 w-auto" />
                </div>
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-xs tracking-[0.16em] text-apagado">0{i + 1}</span>
                  <h2 className="text-4xl font-medium tracking-tight">{t.modelos.nomes[f]}</h2>
                  <p className="max-w-[52ch] text-[17px] leading-relaxed text-texto-2">{p.itens[f].descricao}</p>
                  <dl className="mt-2 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="rotulo !text-[11px]">{p.indicado}</dt>
                      <dd className="mt-1">{p.itens[f].indicado}</dd>
                    </div>
                    <div>
                      <dt className="rotulo !text-[11px]">{p.medidas}</dt>
                      <dd className="mt-1">{f === "personalizado" ? p.sobMedida : p.aDefinir}</dd>
                    </div>
                  </dl>
                </div>
                <Link href={`/contato/?modelo=${f}`} className="btn-linha self-start md:self-center">
                  {p.cta} →
                </Link>
              </div>
            </Revelar>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-8">
        <span className="rotulo">{p.recursosTitulo}</span>
        <div className="mt-8 grid gap-px border border-linha bg-linha sm:grid-cols-2 lg:grid-cols-4">
          {p.recursos.map((r, i) => (
            <Revelar key={i} atraso={i * 80} className="flex flex-col gap-3 bg-fundo p-6">
              <span className="font-serif text-4xl text-ouro italic">0{i + 1}</span>
              <span className="text-lg font-medium">{r.titulo}</span>
              <p className="text-[15px] leading-relaxed text-texto-2">{r.texto}</p>
            </Revelar>
          ))}
        </div>
      </section>
    </>
  );
}

const EQUIPE = ["Aluísio Alves", "Luan Sousa", "Luiz Felipe", "Caio", "Livia Felix", "Ryan"];

function iniciais(nome: string) {
  const partes = nome.split(" ");
  return (partes[0][0] + (partes[1]?.[0] ?? partes[0][1] ?? "")).toUpperCase();
}

export function SobreConteudo() {
  const { t } = useIdioma();
  const s = t.sobre;
  return (
    <>
      <Abertura rotulo={s.rotulo} titulo={s.titulo} destaque={s.destaque} texto={s.texto} />
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-8">
        <div className="grid gap-px border border-linha bg-linha md:grid-cols-3">
          {s.pilares.map((p, i) => (
            <Revelar key={i} atraso={i * 100} className="flex flex-col gap-4 bg-fundo p-8">
              <span className="rotulo">{p.titulo}</span>
              <p className="font-serif text-[28px] leading-snug italic">{p.texto}</p>
            </Revelar>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-8">
        <Revelar className="flex flex-col gap-3">
          <span className="rotulo">{s.equipeTitulo}</span>
          <h2 className="text-[clamp(32px,4vw,52px)] font-medium tracking-tight">{s.equipeTexto}</h2>
        </Revelar>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EQUIPE.map((nome, i) => (
            <Revelar como="li" key={nome} atraso={i * 70} className="flex flex-col gap-5 border border-linha p-5 sm:p-6">
              <span
                aria-hidden
                className="flex aspect-square w-full items-center justify-center border border-ouro-escuro bg-superficie font-serif text-[clamp(48px,7vw,88px)] text-ouro italic"
              >
                {iniciais(nome)}
              </span>
              <span className="text-lg font-medium">{nome}</span>
            </Revelar>
          ))}
        </ul>
      </section>
    </>
  );
}

function PaginaFormulario({ tipo, rotulo, titulo, destaque, texto, placeholder }: {
  tipo: "contato" | "candidaturas";
  rotulo: string;
  titulo: string;
  destaque: string;
  texto: string;
  placeholder: string;
}) {
  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-12 px-4 pt-14 pb-24 sm:px-8 sm:pt-24 lg:grid-cols-[1fr_1.15fr]">
      <Revelar className="flex flex-col gap-6">
        <span className="rotulo">{rotulo}</span>
        <h1 className="text-[clamp(40px,5.4vw,76px)] leading-[1] font-medium tracking-[-0.03em]">
          {titulo} <span className="destaque">{destaque}</span>
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-texto-2">{texto}</p>
      </Revelar>
      <Revelar atraso={120}>
        <Formulario tipo={tipo} placeholderMensagem={placeholder} />
      </Revelar>
    </section>
  );
}

export function ContatoConteudo() {
  const { t } = useIdioma();
  const c = t.contato;
  return <PaginaFormulario tipo="contato" rotulo={c.rotulo} titulo={c.titulo} destaque={c.destaque} texto={c.texto} placeholder={c.placeholderMensagem} />;
}

export function TrabalheConteudo() {
  const { t } = useIdioma();
  const c = t.trabalhe;
  return <PaginaFormulario tipo="candidaturas" rotulo={c.rotulo} titulo={c.titulo} destaque={c.destaque} texto={c.texto} placeholder={c.placeholderMensagem} />;
}

export function NaoEncontradaConteudo() {
  const { t } = useIdioma();
  return (
    <section className="mx-auto flex min-h-[60dvh] w-full max-w-[1280px] flex-col items-start justify-center gap-6 px-4 sm:px-8">
      <span className="rotulo">404</span>
      <h1 className="text-[clamp(40px,6vw,84px)] leading-none font-medium tracking-tight">{t.naoEncontrada.titulo}</h1>
      <p className="text-lg text-texto-2">{t.naoEncontrada.texto}</p>
      <Link href="/" className="btn-ouro">
        {t.naoEncontrada.voltar}
      </Link>
    </section>
  );
}
