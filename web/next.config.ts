import type { NextConfig } from "next";

// Exportação estática: o site vira HTML/CSS/JS puro e pode ser hospedado de graça
// (Cloudflare Pages, Vercel, GitHub Pages). A parte dinâmica fica na API em Go.
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default config;
