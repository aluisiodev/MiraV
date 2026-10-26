// Shaders: pequenos programas em GLSL que rodam na GPU, um para cada pixel, ao mesmo tempo.
// É por isso que o efeito fica fluido: o processador principal quase não trabalha.

/** Vértices: só estica um retângulo para cobrir o canvas inteiro. */
export const VERTICE = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Fragmentos: decide a cor de cada pixel. */
export const FRAGMENTO = /* glsl */ `
  uniform sampler2D uBase;    // foto "antes"
  uniform sampler2D uAntes;   // variação anterior (durante uma troca)
  uniform sampler2D uDepois;  // variação atual
  uniform sampler2D uRastro;  // máscara em tons de cinza: branco = revelar
  uniform float uTroca;       // 0 → 1 durante a troca de variação
  uniform float uTempo;       // segundos, para o ruído "respirar"
  uniform vec2 uCobrir;       // ajuste igual ao object-fit: cover
  uniform vec2 uPasso;        // tamanho de 1 pixel do rastro
  varying vec2 vUv;

  // Ruído simplex 2D (Ian McEwan e Stefan Gustavson, Ashima Arts, licença MIT).
  // Devolve um valor entre -1 e 1 que varia suavemente pelo espaço: é a "textura orgânica".
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uCobrir + 0.5;

    // 1. Quanto revelar aqui? Lê a máscara e mistura com ruído animado.
    float r = texture2D(uRastro, vUv).r;
    float n = snoise(vUv * vec2(3.0, 4.0) + uTempo * 0.18) * 0.65
            + snoise(vUv * vec2(8.0, 10.6) - uTempo * 0.32) * 0.35;
    // smoothstep = degrau macio: abaixo de 0.30 nada, acima de 0.58 tudo.
    // O ruído empurra esse limite para dentro e para fora: a borda fica viva, sem círculo.
    float m = smoothstep(0.30, 0.58, r + n * 0.2);

    // 2. Lente líquida: na borda, a imagem nova é levemente "empurrada"
    //    na direção em que a máscara cresce (o gradiente).
    float gx = texture2D(uRastro, vUv + vec2(uPasso.x * 2.0, 0.0)).r - texture2D(uRastro, vUv - vec2(uPasso.x * 2.0, 0.0)).r;
    float gy = texture2D(uRastro, vUv + vec2(0.0, uPasso.y * 2.0)).r - texture2D(uRastro, vUv - vec2(0.0, uPasso.y * 2.0)).r;
    vec2 uvNova = uv - vec2(gx, gy) * 0.035;

    // 3. Troca de variação: dissolve com ruído em vez de trocar de uma vez.
    float d = snoise(vUv * 3.2 + 7.0) * 0.5 + 0.5;
    float k = smoothstep(d - 0.12, d + 0.12, uTroca * 1.24 - 0.12);
    vec3 nova = mix(texture2D(uAntes, uvNova).rgb, texture2D(uDepois, uvNova).rgb, k);

    // 4. Junta "antes" e "depois". Sem contorno: a borda é só a transição macia.
    vec3 cor = mix(texture2D(uBase, uv).rgb, nova, m);

    gl_FragColor = vec4(cor, 1.0);
  }
`;
