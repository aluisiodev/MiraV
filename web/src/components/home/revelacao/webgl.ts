// Revelação em WebGL com three.js.
//
// Como funciona, em 3 peças:
// 1. RASTRO: um canvas 2D pequeno e invisível. A cada quadro, pintamos um borrão
//    branco onde está o ponteiro e escurecemos tudo um pouquinho. Resultado: um
//    rastro que segue o dedo e some sozinho.
// 2. TEXTURAS: as fotos "antes" e "depois" vão para a GPU.
// 3. SHADER (shaders.ts): para cada pixel, lê o rastro e decide quanto mostrar
//    de cada foto, com ruído para a borda ficar orgânica.

import * as THREE from "three";
import { Movimento, observarVisibilidade, ouvirPonteiro } from "./movimento";
import { FRAGMENTO, VERTICE } from "./shaders";
import type { OpcoesRevelacao, Revelacao } from "./tipos";

/** Largura do rastro em pixels. Pequeno de propósito: é borrado mesmo, e fica leve. */
const RASTRO_LARGURA = 160;
/** Segundos para o rastro perder ~63% da força. Maior = rastro mais longo. */
const TAU = 0.45;
/** Raio do pincel, em fração da largura do espelho. */
const RAIO = 0.34;
/** Duração da troca entre variações, em segundos. */
const DURACAO_TROCA = 0.7;

export function criarRevelacaoWebGL(op: OpcoesRevelacao): Revelacao | null {
  // Sem WebGL (aparelho antigo ou aceleração desligada), o three.js lança um erro.
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }

  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    opacity: "0",
    transition: "opacity 0.6s ease",
  });
  op.camada.appendChild(canvas);

  // ---------- 1. Rastro ----------
  const rastro = document.createElement("canvas");
  const ctx = rastro.getContext("2d")!;
  const texRastro = new THREE.CanvasTexture(rastro);
  texRastro.minFilter = texRastro.magFilter = THREE.LinearFilter;
  texRastro.generateMipmaps = false;

  // ---------- 2. Cena: um retângulo que cobre a tela, pintado pelo shader ----------
  const uniforms = {
    uBase: { value: null as THREE.Texture | null },
    uAntes: { value: null as THREE.Texture | null },
    uDepois: { value: null as THREE.Texture | null },
    uRastro: { value: texRastro },
    uTroca: { value: 1 },
    uTempo: { value: 0 },
    uCobrir: { value: new THREE.Vector2(1, 1) },
    uPasso: { value: new THREE.Vector2(1, 1) },
  };
  const geometria = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({ vertexShader: VERTICE, fragmentShader: FRAGMENTO, uniforms });
  const cena = new THREE.Scene();
  cena.add(new THREE.Mesh(geometria, material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---------- Texturas, com cache: cada foto sobe para a GPU uma vez só ----------
  const carregador = new THREE.TextureLoader();
  const cache = new Map<string, Promise<THREE.Texture>>();
  const texturas: THREE.Texture[] = [];
  const carregar = (src: string) => {
    let p = cache.get(src);
    if (!p) {
      p = carregador.loadAsync(src).then((t) => {
        t.minFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
        texturas.push(t);
        return t;
      });
      cache.set(src, p);
    }
    return p;
  };

  // ---------- Tamanho: acompanha o espelho e limita a densidade de pixels ----------
  const ASPECTO_FOTO = 840 / 1120;
  let largura = 1;
  let altura = 1;
  const redimensionar = () => {
    largura = Math.max(1, op.area.clientWidth);
    altura = Math.max(1, op.area.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(largura, altura, false);
    const aspecto = largura / altura;
    uniforms.uCobrir.value.set(aspecto > ASPECTO_FOTO ? 1 : aspecto / ASPECTO_FOTO, aspecto > ASPECTO_FOTO ? ASPECTO_FOTO / aspecto : 1);
    rastro.width = RASTRO_LARGURA;
    rastro.height = Math.round((RASTRO_LARGURA * altura) / largura);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, rastro.width, rastro.height);
    uniforms.uPasso.value.set(1 / rastro.width, 1 / rastro.height);
    ultimo = null;
    if (pronto) desenhar(0);
  };
  const ro = new ResizeObserver(redimensionar);

  // ---------- Pincel ----------
  const mov = new Movimento(op.reduzir);
  let ultimo: { x: number; y: number } | null = null;
  let onda = Infinity; // segundos desde o início da "onda" (Infinity = sem onda)

  const carimbo = (x: number, y: number, raio: number, suave: boolean) => {
    if (!(raio > 0.5)) return; // raio zero ou inválido: nada a pintar
    const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, "rgba(255,255,255,1)");
    if (!suave) g.addColorStop(0.45, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  };

  const pintar = (dt: number) => {
    const w = rastro.width;
    const h = rastro.height;

    // escurece tudo um pouco: é o que faz o rastro sumir
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt / TAU)})`;
    ctx.fillRect(0, 0, w, h);

    // "lighten" guarda o mais claro: borrões sobrepostos não estouram
    ctx.globalCompositeOperation = "lighten";

    if (mov.pintando) {
      const raio = w * RAIO * (1 + Math.min(mov.vel, 2) * 0.12); // mais rápido = pincel maior
      const atual = { x: mov.x * w, y: mov.y * h };
      // carimba vários borrões entre o quadro anterior e este, para o rastro não ficar pontilhado
      const de = ultimo ?? atual;
      const passos = Math.max(1, Math.ceil(Math.hypot(atual.x - de.x, atual.y - de.y) / (raio * 0.3)));
      for (let i = 1; i <= passos; i++) {
        carimbo(de.x + ((atual.x - de.x) * i) / passos, de.y + ((atual.y - de.y) * i) / passos, raio, false);
      }
      ultimo = atual;
    } else {
      ultimo = null;
    }

    // onda: ao trocar de opção, a novidade se espalha pelo rosto todo e depois recua
    if (onda < 1.1) {
      const p = Math.min(onda / 0.6, 1);
      carimbo(w * 0.5, h * 0.36, h * 1.25 * (1 - Math.pow(1 - p, 3)), true);
    }
    texRastro.needsUpdate = true;
  };

  // ---------- Loop: um quadro por atualização da tela ----------
  let quadro = 0;
  let antes = 0;
  let pronto = false;
  let visivel = true;
  let destruido = false;

  const desenhar = (dt: number) => {
    mov.passo(dt);
    pintar(dt);
    onda += dt;
    uniforms.uTempo.value += dt;
    uniforms.uTroca.value = Math.min(1, uniforms.uTroca.value + dt / DURACAO_TROCA);
    renderer.render(cena, camera);
  };

  const loop = (agora: number) => {
    quadro = requestAnimationFrame(loop);
    // o primeiro carimbo de tempo do quadro pode vir um tiquinho antes de "antes": por isso o max(0, ...)
    const dt = Math.max(0, Math.min((agora - antes) / 1000, 0.05)); // e o min evita saltos depois de travadas
    antes = agora;
    desenhar(dt);
  };
  const rodar = () => {
    if (quadro || !pronto || !visivel || destruido) return;
    antes = performance.now();
    quadro = requestAnimationFrame(loop);
  };
  const parar = () => {
    cancelAnimationFrame(quadro);
    quadro = 0;
  };

  // ---------- Ligar tudo ----------
  const pararPonteiro = ouvirPonteiro(op.area, mov);
  const pararVisibilidade = observarVisibilidade(op.area, (v) => {
    visivel = v;
    if (v) rodar();
    else parar();
  });

  // Se a GPU "perder o contexto" (driver reiniciou, memória acabou), avisamos o componente.
  const perdeuContexto = (e: Event) => {
    e.preventDefault();
    parar();
    op.aoFalhar();
  };
  canvas.addEventListener("webglcontextlost", perdeuContexto);

  let alvo = op.imagem;
  let carregada = "";
  let pedido = 0;

  const aplicar = (src: string, t: THREE.Texture, comTransicao: boolean) => {
    carregada = src;
    uniforms.uAntes.value = comTransicao ? uniforms.uDepois.value : t;
    uniforms.uDepois.value = t;
    uniforms.uTroca.value = comTransicao ? 0 : 1;
    if (!op.reduzir) onda = 0;
  };

  Promise.all([carregar(op.base), carregar(alvo)])
    .then(([base, primeira]) => {
      if (destruido) return;
      uniforms.uBase.value = base;
      aplicar(alvo, primeira, false);
      pronto = true;
      ro.observe(op.area);
      redimensionar();
      canvas.style.opacity = "1";
      rodar();
      if (alvo !== carregada) revelacao.trocar(alvo);
      // carrega as outras variações em segundo plano e já sobe para a GPU
      op.preCarregar.forEach((src) => carregar(src).then((t) => !destruido && renderer.initTexture(t)).catch(() => {}));
    })
    .catch(() => {
      if (!destruido) op.aoFalhar();
    });

  const revelacao: Revelacao = {
    trocar(src) {
      alvo = src;
      if (!pronto || src === carregada) return;
      const meu = ++pedido;
      carregar(src)
        .then((t) => {
          if (!destruido && meu === pedido) aplicar(src, t, true);
        })
        .catch(() => {});
    },
    destruir() {
      destruido = true;
      parar();
      ro.disconnect();
      pararPonteiro();
      pararVisibilidade();
      canvas.removeEventListener("webglcontextlost", perdeuContexto);
      texturas.forEach((t) => t.dispose());
      texRastro.dispose();
      geometria.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
  return revelacao;
}
