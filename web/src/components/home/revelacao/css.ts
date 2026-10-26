// Reserva em CSS, para os poucos aparelhos sem WebGL.
// Mesmo movimento (movimento.ts), mas a máscara é um gradiente radial do CSS:
// borda macia, sem ruído e sem rastro. Quase igual, e funciona em qualquer navegador.

import { Movimento, observarVisibilidade, ouvirPonteiro } from "./movimento";
import type { OpcoesRevelacao, Revelacao } from "./tipos";

/** Raio da máscara, em fração da largura do espelho. */
const RAIO = 0.3;

export function criarRevelacaoCSS(op: OpcoesRevelacao): Revelacao {
  // a máscara (classe .revelacao-css em globals.css) recorta duas fotos empilhadas;
  // duas para poder fazer a troca com transição suave entre elas
  const mascara = document.createElement("div");
  mascara.className = "revelacao-css";
  const fotos = [document.createElement("img"), document.createElement("img")];
  fotos.forEach((f) => {
    f.alt = "";
    f.draggable = false;
    mascara.appendChild(f);
  });
  let frente = 0;
  fotos[0].src = op.imagem;
  fotos[1].style.opacity = "0";
  op.camada.appendChild(mascara);

  const mov = new Movimento(op.reduzir);
  let raio = 0;
  let onda = Infinity;
  let quadro = 0;
  let antes = 0;

  const loop = (agora: number) => {
    quadro = requestAnimationFrame(loop);
    const dt = Math.max(0, Math.min((agora - antes) / 1000, 0.05));
    antes = agora;
    mov.passo(dt);
    onda += dt;

    const largura = op.area.clientWidth;
    // o raio cresce e encolhe suavemente, em vez de aparecer e sumir de uma vez
    const alvo = mov.pintando ? largura * RAIO * (1 + Math.min(mov.vel, 2) * 0.12) : 0;
    raio += (alvo - raio) * (1 - Math.exp(-dt * 8));
    let r = raio;
    if (onda < 1.1) r = Math.max(r, op.area.clientHeight * 0.9 * Math.sin((Math.min(onda, 1.1) / 1.1) * Math.PI));

    // só variáveis CSS mudam: nada de React, nada de re-render
    mascara.style.setProperty("--x", `${(mov.x * 100).toFixed(2)}%`);
    mascara.style.setProperty("--y", `${(mov.y * 100).toFixed(2)}%`);
    mascara.style.setProperty("--r", `${Math.max(1, r).toFixed(1)}px`);
  };
  const rodar = () => {
    if (quadro) return;
    antes = performance.now();
    quadro = requestAnimationFrame(loop);
  };
  const parar = () => {
    cancelAnimationFrame(quadro);
    quadro = 0;
  };

  const pararPonteiro = ouvirPonteiro(op.area, mov);
  const pararVisibilidade = observarVisibilidade(op.area, (v) => (v ? rodar() : parar()));
  rodar();

  // pré-carrega as outras fotos no cache do navegador
  op.preCarregar.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let atual = op.imagem;
  return {
    trocar(src) {
      if (src === atual) return;
      atual = src;
      const tras = 1 - frente;
      const nova = fotos[tras];
      nova.src = src;
      const mostrar = () => {
        if (atual !== src) return;
        nova.style.opacity = "1";
        fotos[frente].style.opacity = "0";
        frente = tras;
        if (!op.reduzir) onda = 0;
      };
      nova.decode().then(mostrar, mostrar);
    },
    destruir() {
      parar();
      pararPonteiro();
      pararVisibilidade();
      mascara.remove();
    },
  };
}
