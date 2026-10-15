// Chamadas à API em Go.

import type { Idioma } from "./i18n";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export type Corte = {
  slug: string;
  nome: string;
  descricao?: string;
  como_pedir?: string;
  comprimento?: "curto" | "medio" | "longo";
  manutencao_semanas?: number;
};

export type Formato = "retangular" | "oval" | "arco" | "redondo" | "personalizado";

export type Espelho = {
  slug: string;
  formato: Formato;
  nome: string;
  descricao: string;
  indicado: string;
  medidas?: string;
  destaques: Corte[];
};

export type Resultado = {
  id?: number;
  e_cabelo: boolean;
  corte: Corte | null;
  confianca: number;
  alternativas: Corte[];
  caracteristicas: string[];
  explicacao: string;
  espelho: { slug: string; nome: string; formato: Formato };
  provedor: string;
  modelo: string;
  demonstracao: boolean;
  cache: boolean;
  duracao_ms: number;
};

export type ErroAPI = { erro: string; mensagem: string; campos?: Record<string, string> };

export class FalhaAPI extends Error {
  constructor(
    public status: number,
    public dados: ErroAPI | null,
  ) {
    super(dados?.mensagem ?? `HTTP ${status}`);
  }
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + caminho, init);
  } catch {
    throw new FalhaAPI(0, null); // sem rede ou API fora do ar
  }
  const corpo = await res.json().catch(() => null);
  if (!res.ok) throw new FalhaAPI(res.status, corpo as ErroAPI | null);
  return corpo as T;
}

export function listarEspelhos(idioma: Idioma, sinal?: AbortSignal) {
  return pedir<{ espelhos: Espelho[] }>(`/v1/espelhos?idioma=${idioma}`, { signal: sinal }).then((r) => r.espelhos);
}

export function analisarFoto(foto: Blob, espelho: string, idioma: Idioma) {
  const dados = new FormData();
  dados.append("foto", foto, "foto.jpg");
  dados.append("espelho", espelho);
  dados.append("idioma", idioma);
  return pedir<Resultado>("/v1/analises", { method: "POST", body: dados });
}

export function enviarFormulario(tipo: "contato" | "candidaturas", dados: Record<string, unknown>) {
  return pedir<{ ok: boolean; id?: number }>(`/v1/${tipo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

// Reduz a foto no próprio aparelho antes do envio: arquivo menor, upload mais rápido
// e sem metadados (o canvas descarta EXIF e localização).
export async function prepararFoto(arquivo: File, lado = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * escala));
  const h = Math.max(1, Math.round(bitmap.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("falha ao converter"))), "image/jpeg", 0.88),
  );
}
