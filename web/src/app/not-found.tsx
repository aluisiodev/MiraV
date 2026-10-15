import { Cabecalho } from "@/components/Cabecalho";
import { NaoEncontradaConteudo } from "@/components/Paginas";
import { Rodape } from "@/components/Rodape";

export default function NaoEncontrada() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo">
        <NaoEncontradaConteudo />
      </main>
      <Rodape />
    </>
  );
}
