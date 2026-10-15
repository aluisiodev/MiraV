import type { Metadata } from "next";
import { SobreConteudo } from "@/components/Paginas";

export const metadata: Metadata = { title: "Sobre" };

export default function Sobre() {
  return <SobreConteudo />;
}
