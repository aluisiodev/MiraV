import type { Metadata } from "next";
import { ContatoConteudo } from "@/components/Paginas";

export const metadata: Metadata = { title: "Contato" };

export default function Contato() {
  return <ContatoConteudo />;
}
