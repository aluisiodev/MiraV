"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { analisarFoto, FalhaAPI, listarEspelhos, prepararFoto, type Espelho, type Formato, type Resultado } from "@/lib/api";
import { useIdioma } from "@/lib/i18n";
import { estiloMoldura, FORMATOS, IconeEspelho } from "../FormatoEspelho";
import { OlhoAnimado } from "../OlhoAnimado";

const LIMITE_BYTES = 8 * 1024 * 1024;

// Página secreta /espelho: escolher o modelo, enviar a foto e receber o nome do corte.
export function Analisador() {
  const { t, idioma } = useIdioma();
  const e = t.espelho;
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [espelhos, setEspelhos] = useState<Espelho[] | null>(null);
  const [escolhido, setEscolhido] = useState<string>("");
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const topo = useRef<HTMLDivElement>(null);

  // Modelos vêm do banco; se a API estiver fora do ar, a página usa a lista local.
  useEffect(() => {
    const ctrl = new AbortController();
    listarEspelhos(idioma, ctrl.signal)
      .then(setEspelhos)
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setEspelhos(
          FORMATOS.map((f) => ({
            slug: f,
            formato: f,
            nome: t.modelos.nomes[f],
            descricao: t.produtos.itens[f].descricao,
            indicado: t.produtos.itens[f].indicado,
            destaques: [],
          })),
        );
      });
    return () => ctrl.abort();
  }, [idioma, t]);

  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.url);
  }, [foto]);

  const espelho = espelhos?.find((x) => x.slug === escolhido);
  const formato: Formato = espelho?.formato ?? "retangular";

  function irPara(p: 1 | 2 | 3) {
    setPasso(p);
    setErro("");
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function receberArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro("");
    if (!arquivo.type.startsWith("image/") || arquivo.size > LIMITE_BYTES * 3) {
      setErro(e.erroImagem);
      return;
    }
    try {
      const blob = await prepararFoto(arquivo);
      if (foto) URL.revokeObjectURL(foto.url);
      setFoto({ blob, url: URL.createObjectURL(blob) });
      setResultado(null);
    } catch {
      setErro(e.erroImagem);
    }
  }

  async function analisar() {
    if (!foto || !escolhido) return;
    setAnalisando(true);
    setErro("");
    try {
      const r = await analisarFoto(foto.blob, escolhido, idioma);
      setResultado(r);
      irPara(3);
    } catch (err) {
      setErro(err instanceof FalhaAPI && err.dados ? err.dados.mensagem : e.erroRede);
    } finally {
      setAnalisando(false);
    }
  }

  function soltar(ev: DragEvent<HTMLLabelElement>) {
    ev.preventDefault();
    setArrastando(false);
    receberArquivo(ev.dataTransfer.files?.[0]);
  }

  return (
    <div ref={topo} className="mx-auto w-full max-w-[1100px] scroll-mt-24 px-4 pt-10 pb-20 sm:px-8 sm:pt-16">
      <header className="flex flex-col gap-5">
        <span className="rotulo">{e.rotulo}</span>
        <h1 className="text-[clamp(38px,5.6vw,72px)] leading-[1.02] font-medium tracking-[-0.03em]">
          {e.titulo} <span className="destaque">{e.destaque}</span>
        </h1>
        <p className="max-w-[58ch] text-[17px] leading-relaxed text-texto-2">{e.texto}</p>
      </header>

      <ol className="mt-10 grid grid-cols-3 gap-2" aria-label={e.passo}>
        {e.passos.map((nome, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <li key={nome} aria-current={passo === n ? "step" : undefined} className="flex flex-col gap-2">
              <span className={`h-[2px] transition-colors ${passo >= n ? "bg-ouro" : "bg-linha"}`} />
              <span className={`font-mono text-[11px] tracking-[0.14em] uppercase ${passo === n ? "text-ouro" : "text-apagado"}`}>
                0{n} <span className="hidden sm:inline">· {nome}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {passo === 1 && (
        <section className="mt-10" aria-labelledby="titulo-passo-1">
          <h2 id="titulo-passo-1" className="text-2xl font-medium tracking-tight">
            {e.escolha}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {(espelhos ?? FORMATOS.map((f) => ({ slug: f, formato: f, nome: t.modelos.nomes[f] }) as Espelho)).map((m) => (
              <button
                key={m.slug}
                type="button"
                disabled={!espelhos}
                aria-pressed={escolhido === m.slug}
                onClick={() => {
                  setEscolhido(m.slug);
                  irPara(2);
                }}
                className={`group flex cursor-pointer flex-col items-center gap-5 border p-5 text-left transition-colors hover:border-ouro-escuro hover:bg-superficie disabled:cursor-wait disabled:opacity-60 ${
                  escolhido === m.slug ? "border-ouro bg-superficie" : "border-linha"
                }`}
              >
                <IconeEspelho formato={m.formato} ativo={escolhido === m.slug} className="h-28 w-auto transition-transform duration-500 group-hover:scale-105" />
                <span className="flex w-full flex-col gap-1">
                  <span className="text-lg font-medium">{m.nome}</span>
                  {m.indicado && <span className="text-[13px] leading-snug text-apagado">{m.indicado}</span>}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {passo === 2 && (
        <section className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr] md:items-start" aria-labelledby="titulo-passo-2">
          <div className="flex flex-col gap-5">
            <h2 id="titulo-passo-2" className="text-2xl font-medium tracking-tight">
              {e.envie}
            </h2>
            {espelho && (
              <div className="flex items-start gap-3 text-sm">
                <IconeEspelho formato={espelho.formato} ativo className="h-9 w-auto shrink-0" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{espelho.nome}</span>
                  {espelho.destaques.length > 0 && <span className="text-apagado">{espelho.destaques.map((d) => d.nome).join(" · ")}</span>}
                </span>
              </div>
            )}
            <label
              onDragOver={(ev) => {
                ev.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={soltar}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-6 text-center transition-colors ${
                arrastando ? "border-ouro bg-superficie" : "border-linha-forte hover:border-ouro-escuro"
              }`}
            >
              <input type="file" accept="image/*" className="sr-only" onChange={(ev) => receberArquivo(ev.target.files?.[0])} />
              <span className="text-[17px] font-medium">{foto ? e.trocar : e.arraste}</span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-apagado uppercase">{e.formatos}</span>
            </label>
            <p className="text-[13px] leading-relaxed text-apagado">{e.privacidade}</p>
            {erro && (
              <p role="alert" className="border border-[#e5484d]/50 bg-[#e5484d]/10 px-4 py-3 text-sm text-[#ffb3b5]">
                {erro}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={analisar} disabled={!foto || analisando} className="btn-ouro cursor-pointer">
                {analisando ? e.analisando + "…" : e.analisar}
              </button>
              <button type="button" onClick={() => irPara(1)} className="btn-linha cursor-pointer">
                ← {e.voltar}
              </button>
            </div>
          </div>

          <Moldura formato={formato} url={foto?.url} analisando={analisando} rotulo={e.analisando} />
        </section>
      )}

      {passo === 3 && resultado && (
        <ResultadoCartao
          resultado={resultado}
          formato={formato}
          url={foto?.url}
          aoRecomecar={() => {
            setFoto(null);
            setResultado(null);
            irPara(2);
          }}
        />
      )}

      <div className="mt-16 border-t border-linha pt-6">
        <Link href="/" className="text-sm text-apagado transition-colors hover:text-ouro">
          {e.voltarSite} →
        </Link>
      </div>
    </div>
  );
}

function Moldura({ formato, url, analisando, rotulo }: { formato: Formato; url?: string; analisando?: boolean; rotulo?: string }) {
  const m = estiloMoldura[formato];
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="border border-ouro-escuro p-2.5" style={{ borderRadius: m.raio }}>
        <div
          className="relative w-full overflow-hidden border border-linha bg-superficie"
          style={{ aspectRatio: m.aspecto, borderRadius: m.raio }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <OlhoAnimado tamanho={90} />
            </div>
          )}
          {analisando && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-fundo/75 backdrop-blur-[2px]" role="status">
              <OlhoAnimado tamanho={110} />
              <span className="rotulo !text-[11px] !text-texto">{rotulo}</span>
              <div className="h-[2px] w-32 bg-linha">
                <div className="barra-carga h-[2px] bg-ouro" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultadoCartao({
  resultado: r,
  formato,
  url,
  aoRecomecar,
}: {
  resultado: Resultado;
  formato: Formato;
  url?: string;
  aoRecomecar: () => void;
}) {
  const { t } = useIdioma();
  const e = t.espelho;
  const [copiado, setCopiado] = useState(false);
  const pct = Math.round(r.confianca * 100);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      // área de transferência bloqueada: o texto continua visível para copiar à mão
    }
  }

  const titulo = !r.e_cabelo ? e.naoCabelo : r.corte ? r.corte.nome : e.naoIdentificado;

  return (
    <section className="mt-10 grid gap-10 md:grid-cols-[minmax(0,380px)_1fr] md:items-start" aria-live="polite">
      <Moldura formato={formato} url={url} />

      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rotulo">{e.resultado}</span>
          {r.demonstracao && <span className="selo-demo">{e.demonstracao}</span>}
        </div>
        <h2 className="text-[clamp(36px,5vw,60px)] leading-[1.02] font-medium tracking-[-0.025em] text-ouro">{titulo}</h2>

        {r.corte && (
          <>
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-texto-2">{r.corte.descricao}</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-mono text-[11px] tracking-[0.14em] text-apagado uppercase">
                <span>{e.confianca}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-[3px] bg-linha" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={e.confianca}>
                <div className="h-[3px] bg-ouro transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-6 text-sm text-texto-2">
                {r.corte.comprimento && <span>{e.comprimentos[r.corte.comprimento]}</span>}
                {r.corte.manutencao_semanas ? (
                  <span>
                    {e.manutencao} {r.corte.manutencao_semanas} {e.semanas}
                  </span>
                ) : null}
              </div>
            </div>
          </>
        )}

        {!r.corte && <p className="max-w-[56ch] text-[17px] leading-relaxed text-texto-2">{r.e_cabelo ? e.naoIdentificadoTexto : e.naoCabeloTexto}</p>}

        {r.explicacao && <p className="border-l-2 border-ouro-escuro pl-4 font-serif text-[22px] leading-snug italic">{r.explicacao}</p>}

        {r.caracteristicas.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="rotulo !text-[11px]">{e.caracteristicas}</span>
            <ul className="flex flex-wrap gap-2">
              {r.caracteristicas.map((c, i) => (
                <li key={i} className="rounded-full border border-linha-forte px-3.5 py-1.5 text-sm">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {r.corte?.como_pedir && (
          <div className="flex flex-col gap-3 border border-ouro-escuro bg-superficie p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="rotulo !text-[11px] !text-ouro">{e.comoPedir}</span>
              <button type="button" onClick={() => copiar(r.corte!.como_pedir!)} className="min-h-11 cursor-pointer px-2 font-mono text-xs tracking-[0.14em] uppercase hover:text-ouro">
                {copiado ? e.copiado : e.copiar}
              </button>
            </div>
            <p className="text-[17px] leading-relaxed">{r.corte.como_pedir}</p>
          </div>
        )}

        {r.alternativas.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="rotulo !text-[11px]">{e.alternativas}</span>
            <ul className="flex flex-col border-t border-linha">
              {r.alternativas.map((a) => (
                <li key={a.slug} className="flex flex-col gap-1 border-b border-linha py-3">
                  <span className="font-medium">{a.nome}</span>
                  {a.como_pedir && <span className="text-sm text-apagado">{a.como_pedir}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={aoRecomecar} className="btn-ouro cursor-pointer">
            {e.recomecar}
          </button>
          <span className="font-mono text-[11px] tracking-[0.12em] text-apagado">
            {e.respondidoPor} {r.provedor} · {r.modelo}
            {r.cache ? ` · ${e.emCache}` : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
