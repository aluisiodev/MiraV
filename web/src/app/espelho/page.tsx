import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Analisador } from "@/components/espelho/Analisador";

// Página secreta: fora do menu, sem indexação. Acesso só pela URL ou pelo QR code.
export const metadata: Metadata = {
  title: "Como funciona",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function EspelhoPage() {
  return (
    <>
      <Cabecalho minimo />
      <main id="conteudo">
        <Analisador />
      </main>
    </>
  );
}
