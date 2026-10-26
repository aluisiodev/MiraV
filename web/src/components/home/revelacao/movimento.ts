// Movimento da revelação, igual para as versões WebGL e CSS.
//
// Ideia principal: o ponteiro define um ALVO, e a posição desenhada anda só
// uma fração do caminho até ele a cada quadro (interpolação, ou "lerp").
// É isso que dá a sensação de inércia, de algo líquido seguindo o dedo.

/** Segundos parados até o passeio automático voltar (chama atenção no telão). */
const OCIOSO_APOS = 3;

export class Movimento {
  /** Posição desenhada, de 0 a 1 (0 = esquerda/topo, 1 = direita/base). */
  x = 0.5;
  y = 0.3;
  /** Velocidade, em larguras da área por segundo. */
  vel = 0;

  private alvoX = 0.5;
  private alvoY = 0.3;
  private relogio = 0;
  private ultimoToque = -Infinity;
  private dentro = false;

  constructor(private readonly reduzir: boolean) {}

  apontar(x: number, y: number) {
    this.alvoX = x;
    this.alvoY = y;
    this.dentro = true;
    this.ultimoToque = this.relogio;
  }

  sair() {
    this.dentro = false;
  }

  /** Ninguém mexe há alguns segundos? */
  get ocioso() {
    return !this.dentro && this.relogio - this.ultimoToque > OCIOSO_APOS;
  }

  /** Deve revelar agora? Sim com o ponteiro em cima, ou no passeio automático. */
  get pintando() {
    return this.dentro || this.ocioso || this.reduzir;
  }

  /** Avança um quadro. dt = segundos desde o quadro anterior. */
  passo(dt: number) {
    this.relogio += dt;

    if (this.ocioso && !this.reduzir) {
      // passeio em "oito" pela região do cabelo e do rosto
      const s = this.relogio;
      this.alvoX = 0.5 + 0.22 * Math.sin(s * 0.7);
      this.alvoY = 0.32 + 0.13 * Math.sin(s * 1.1 + 1);
    }

    // lerp que não depende da taxa de quadros (60 Hz ou 120 Hz andam igual)
    const f = 1 - Math.exp(-dt * (this.reduzir ? 20 : 7));
    const nx = this.x + (this.alvoX - this.x) * f;
    const ny = this.y + (this.alvoY - this.y) * f;
    const v = Math.hypot(nx - this.x, ny - this.y) / Math.max(dt, 1e-3);
    this.vel += (v - this.vel) * Math.min(1, dt * 10); // suaviza a velocidade
    this.x = nx;
    this.y = ny;
  }
}

/** Liga cursor e dedo ao Movimento. Devolve a função que desliga tudo. */
export function ouvirPonteiro(area: HTMLElement, mov: Movimento) {
  const mover = (e: PointerEvent) => {
    const r = area.getBoundingClientRect();
    mov.apontar((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const sair = () => mov.sair();
  const soltar = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") mov.sair(); // dedo levantado
  };
  area.addEventListener("pointermove", mover);
  area.addEventListener("pointerdown", mover);
  area.addEventListener("pointerleave", sair);
  area.addEventListener("pointercancel", sair);
  area.addEventListener("pointerup", soltar);
  return () => {
    area.removeEventListener("pointermove", mover);
    area.removeEventListener("pointerdown", mover);
    area.removeEventListener("pointerleave", sair);
    area.removeEventListener("pointercancel", sair);
    area.removeEventListener("pointerup", soltar);
  };
}

/**
 * Avisa quando a área entra ou sai da tela, ou quando a aba é escondida.
 * Fora da tela, a animação para e não gasta bateria nem GPU.
 */
export function observarVisibilidade(area: HTMLElement, aoMudar: (visivel: boolean) => void) {
  let naTela = true;
  const avisar = () => aoMudar(naTela && document.visibilityState === "visible");
  const io = new IntersectionObserver(([entrada]) => {
    naTela = entrada.isIntersecting;
    avisar();
  });
  io.observe(area);
  document.addEventListener("visibilitychange", avisar);
  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", avisar);
  };
}
