import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/cinzel/500.css";
import "./globals.css";
import { Carregamento } from "@/components/Carregamento";
import { IdiomaProvider } from "@/lib/i18n";
import { pt } from "@/i18n/pt";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: pt.meta.titulo, template: "%s · MiraV" },
  description: pt.meta.descricao,
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: { title: pt.meta.titulo, description: pt.meta.descricao, images: ["/icon-512.png"], locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", colorScheme: "light dark" };

// Roda antes de a página aparecer: se o visitante escolheu o tema escuro, aplica na hora.
// Sem isto, a página piscaria clara antes de ficar escura. O padrão é o tema claro.
const scriptTema = `(function(){try{if(localStorage.getItem("mirav-tema")==="escuro")document.documentElement.dataset.tema="escuro";}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script acima muda o data-tema antes do React, e isso é esperado
    <html lang="pt-BR" data-tema="claro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <IdiomaProvider>
          <Carregamento />
          {children}
        </IdiomaProvider>
      </body>
    </html>
  );
}
