"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useIdioma } from "@/lib/i18n";
import { LogoOlho } from "./Cabecalho";

// Tela para o telão: QR code grande que leva à página inicial do site.
export function QrApresentacao() {
  const { t } = useIdioma();
  const [svg, setSvg] = useState("");
  const [endereco, setEndereco] = useState("");

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, "");
    const url = `${base}/`;
    setEndereco(url.replace(/^https?:\/\//, ""));
    QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#0A1D39", light: "#FFFFFF" } }).then(setSvg);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="flex justify-center">
        <LogoOlho altura={64} />
      </div>
      <div
        className="aspect-square w-[min(56vh,80vw)] border border-azul-escuro bg-white p-4"
        role="img"
        aria-label={endereco}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex flex-col gap-2">
        <p className="text-[clamp(28px,3.4vw,48px)] font-medium tracking-tight">{t.qr.titulo}</p>
        <p className="destaque !text-[clamp(26px,3vw,42px)]">{t.qr.texto}</p>
        <p className="mt-2 font-mono text-sm tracking-[0.1em] text-apagado">{endereco}</p>
      </div>
    </main>
  );
}
