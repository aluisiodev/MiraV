import type { Metadata } from "next";
import { QrApresentacao } from "@/components/QrApresentacao";

// Tela do QR code para o telão. Também fora do menu e sem indexação.
export const metadata: Metadata = {
  title: "QR code",
  robots: { index: false, follow: false },
};

export default function QrPage() {
  return <QrApresentacao />;
}
