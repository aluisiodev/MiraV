import type { Metadata } from "next";
import { VagaConteudo } from "@/components/Vagas";
import { buscarVaga, VAGAS } from "@/data/vagas";

// O site é exportado como arquivos estáticos: o Next gera uma página para cada vaga da lista
// (ex.: /trabalhe-conosco/analista-financeiro/). Endereços fora da lista dão 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return VAGAS.map((v) => ({ vaga: v.slug }));
}

type Props = { params: Promise<{ vaga: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vaga } = await params;
  const v = buscarVaga(vaga);
  return { title: v ? `${v.textos.pt.cargo} · Vagas` : "Vagas", description: v?.textos.pt.resumo };
}

export default async function PaginaVaga({ params }: Props) {
  const { vaga } = await params;
  return <VagaConteudo slug={vaga} />;
}
