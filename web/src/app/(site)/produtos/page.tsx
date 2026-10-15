import type { Metadata } from "next";
import { ProdutosConteudo } from "@/components/Paginas";

export const metadata: Metadata = { title: "Produtos" };

export default function Produtos() {
  return <ProdutosConteudo />;
}
