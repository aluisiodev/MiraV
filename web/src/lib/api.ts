// Chamadas à API em Go: só os formulários de Contato e Trabalhe Conosco.
//
// Versão acadêmica: sem NEXT_PUBLIC_API_URL, os formulários não enviam nada. Eles validam os campos
// e mostram um agradecimento avisando que a mensagem não foi enviada (Formulario.tsx).
// Para ligar o envio de verdade, publique a API e defina NEXT_PUBLIC_API_URL com o endereço dela.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
/** true quando existe uma API configurada para receber os formulários. */
export const ENVIO_LIGADO = API_URL !== "";

/** Os cinco formatos de espelho do VisaVision. */
export type Formato = "retangular" | "oval" | "arco" | "redondo" | "personalizado";

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

// A API grátis do Render "dorme" depois de 15 min sem uso e leva cerca de 1 min para acordar.
// As páginas com formulário chamam isto ao abrir: quando a pessoa termina de digitar, a API já acordou.
export function acordarAPI() {
  if (!ENVIO_LIGADO) return;
  fetch(`${API_URL}/vivo`, { cache: "no-store" }).catch(() => {
    // sem rede ou API fora do ar: o envio do formulário vai mostrar o erro, se for o caso
  });
}

export function enviarFormulario(tipo: "contato" | "candidaturas", dados: Record<string, unknown>) {
  return pedir<{ ok: boolean; id?: number }>(`/v1/${tipo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}
