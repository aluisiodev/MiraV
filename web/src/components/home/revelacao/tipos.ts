// O "contrato" que as duas versões da revelação cumprem (WebGL e CSS).
// O componente React só conhece isto; não importa qual versão está rodando.

export interface Revelacao {
  /** Troca a imagem revelada (ex.: de "corte" para "barba"), com transição. */
  trocar(src: string): void;
  /** Para a animação e libera memória, ouvintes e GPU. */
  destruir(): void;
}

export interface OpcoesRevelacao {
  /** Área que recebe o cursor e o dedo. */
  area: HTMLElement;
  /** Div vazia onde a revelação desenha (canvas ou imagens). */
  camada: HTMLElement;
  /** Foto "antes". */
  base: string;
  /** Foto "depois" que aparece primeiro. */
  imagem: string;
  /** Imagens para carregar em segundo plano, para a troca ser instantânea. */
  preCarregar: string[];
  /** true quando o visitante pediu menos movimento no sistema. */
  reduzir: boolean;
  /** Chamado se a GPU falhar no meio do caminho: o componente cai para o CSS. */
  aoFalhar: () => void;
}
