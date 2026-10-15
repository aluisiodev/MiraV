import { Casos, Chamada, Fluxo, Hero, Manifesto, Modelos, Publico, Resultados } from "@/components/home/Secoes";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Resultados />
      <Publico />
      <Fluxo />
      <Casos />
      <Modelos />
      <Chamada />
    </>
  );
}
