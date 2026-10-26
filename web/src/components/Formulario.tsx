"use client";

import { cloneElement, isValidElement, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { acordarAPI, enviarFormulario, FalhaAPI } from "@/lib/api";
import { buscarVaga } from "@/data/vagas";
import { useIdioma } from "@/lib/i18n";

type Tipo = "contato" | "candidaturas";

// Formulário de Contato ou Trabalhe Conosco, gravado no PostgreSQL pela API.
export function Formulario({ tipo, placeholderMensagem }: { tipo: Tipo; placeholderMensagem: string }) {
  const { t, idioma } = useIdioma();
  const f = t.form;
  const [estado, setEstado] = useState<"livre" | "enviando" | "ok">("livre");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [mensagemInicial, setMensagemInicial] = useState("");

  const [areaInicial, setAreaInicial] = useState("");

  // acorda a API (Render grátis) enquanto a pessoa preenche
  useEffect(() => acordarAPI(), []);

  // /contato/?modelo=oval já começa a mensagem com o modelo escolhido em Produtos.
  // /trabalhe-conosco/?vaga=analista-financeiro já começa com a vaga e escolhe a área.
  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);
    if (tipo === "contato") {
      const modelo = busca.get("modelo") as keyof typeof t.modelos.nomes | null;
      if (modelo && modelo in t.modelos.nomes) setMensagemInicial(f.interesseModelo.replace("{modelo}", t.modelos.nomes[modelo]));
      return;
    }
    const vaga = buscarVaga(busca.get("vaga") ?? "");
    if (vaga) {
      setMensagemInicial(f.interesseVaga.replace("{vaga}", vaga.textos[idioma].cargo));
      setAreaInicial(vaga.areaFormulario);
    }
  }, [tipo, t, f.interesseModelo, f.interesseVaga, idioma]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const corpo = { ...dados, consentimento: dados.consentimento === "on", idioma };

    // validação rápida no navegador; a API valida de novo
    const local: Record<string, string> = {};
    if ((dados.nome ?? "").trim().length < 2) local.nome = "tamanho";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((dados.email ?? "").trim())) local.email = "formato";
    if ((dados.mensagem ?? "").trim().length < 10) local.mensagem = "tamanho";
    if (tipo === "candidaturas" && !dados.area) local.area = "opcao";
    if (!corpo.consentimento) local.consentimento = "obrigatorio";
    setErros(local);
    setErroGeral("");
    if (Object.keys(local).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(local)[0]}"]`)?.focus();
      return;
    }

    setEstado("enviando");
    try {
      await enviarFormulario(tipo, corpo);
      setEstado("ok");
      form.reset();
    } catch (err) {
      setEstado("livre");
      if (err instanceof FalhaAPI && err.dados) {
        setErros(err.dados.campos ?? {});
        setErroGeral(err.dados.mensagem);
      } else {
        setErroGeral(f.erros.rede);
      }
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex flex-col items-start gap-4 border border-azul-escuro bg-superficie p-8" role="status">
        <span className="text-3xl font-medium tracking-tight">{f.sucessoTitulo}</span>
        <p className="text-texto-2">{f.sucessoTexto}</p>
        <button type="button" className="btn-linha mt-2 cursor-pointer" onClick={() => setEstado("livre")}>
          {f.novo}
        </button>
      </div>
    );
  }

  const msgErro = (campo: string) => (erros[campo] ? f.erros[erros[campo] as keyof typeof f.erros] ?? f.erros.formato : "");

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      {/* campo-isca contra robôs: invisível para pessoas */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo nome="nome" rotulo={f.nome} erro={msgErro("nome")}>
          <input name="nome" autoComplete="name" required maxLength={120} className="campo" />
        </Campo>
        <Campo nome="email" rotulo={f.email} erro={msgErro("email")}>
          <input name="email" type="email" autoComplete="email" required maxLength={200} className="campo" />
        </Campo>
        <Campo nome="telefone" rotulo={f.telefone} opcional={f.opcional} erro={msgErro("telefone")}>
          <input name="telefone" type="tel" autoComplete="tel" maxLength={30} className="campo" />
        </Campo>

        {tipo === "contato" ? (
          <>
            <Campo nome="empresa" rotulo={f.empresa} opcional={f.opcional} erro={msgErro("empresa")}>
              <input name="empresa" autoComplete="organization" maxLength={160} className="campo" />
            </Campo>
            <Campo nome="tipo_negocio" rotulo={f.tipoNegocio} opcional={f.opcional} erro={msgErro("tipo_negocio")} largo>
              <select name="tipo_negocio" className="campo cursor-pointer" defaultValue="">
                <option value="">{f.selecione}</option>
                {Object.entries(f.tiposNegocio).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        ) : (
          <>
            <Campo nome="area" rotulo={f.area} erro={msgErro("area")}>
              <select key={areaInicial} name="area" className="campo cursor-pointer" defaultValue={areaInicial} required>
                <option value="">{f.selecione}</option>
                {Object.entries(f.areas).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo nome="link" rotulo={f.link} opcional={f.opcional} erro={msgErro("link")} largo>
              <input name="link" type="url" inputMode="url" placeholder="https://" maxLength={300} className="campo" />
            </Campo>
          </>
        )}
      </div>

      <Campo nome="mensagem" rotulo={f.mensagem} erro={msgErro("mensagem")}>
        <textarea key={mensagemInicial} defaultValue={mensagemInicial} name="mensagem" rows={5} required maxLength={4000} placeholder={placeholderMensagem} className="campo resize-y" />
      </Campo>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-texto-2">
        <input
          type="checkbox"
          name="consentimento"
          aria-invalid={!!erros.consentimento}
          aria-describedby={erros.consentimento ? "erro-consentimento" : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-azul"
        />
        <span>
          {f.consentimento}
          {erros.consentimento && (
            <span id="erro-consentimento" className="mt-1 block text-erro-texto">
              {msgErro("consentimento")}
            </span>
          )}
        </span>
      </label>

      {erroGeral && (
        <p role="alert" className="border border-erro/50 bg-erro/10 px-4 py-3 text-sm text-erro-texto">
          {erroGeral}
        </p>
      )}

      <button type="submit" disabled={estado === "enviando"} className="btn-azul self-start cursor-pointer">
        {estado === "enviando" ? f.enviando : f.enviar}
      </button>
    </form>
  );
}

function Campo({
  nome,
  rotulo,
  opcional,
  erro,
  largo,
  children,
}: {
  nome: string;
  rotulo: string;
  opcional?: string;
  erro?: string;
  largo?: boolean;
  children: ReactNode;
}) {
  const id = `campo-${nome}`;
  return (
    <div className={`flex flex-col gap-2 ${largo ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo} {opcional && <span className="font-normal text-apagado">({opcional})</span>}
      </label>
      <ComId id={id} invalido={!!erro} descricao={erro ? `${id}-erro` : undefined}>
        {children}
      </ComId>
      {erro && (
        <span id={`${id}-erro`} className="text-sm text-erro-texto">
          {erro}
        </span>
      )}
    </div>
  );
}

// Injeta id e atributos de acessibilidade no campo filho.
function ComId({ id, invalido, descricao, children }: { id: string; invalido: boolean; descricao?: string; children: ReactNode }) {
  if (!isValidElement(children)) return <>{children}</>;
  return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    id,
    "aria-invalid": invalido,
    "aria-describedby": descricao,
  });
}
