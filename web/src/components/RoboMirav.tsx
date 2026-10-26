// Miro, o robozinho da MiraV, em pixel art.
//
// O desenho é um "mapa" de letras: cada letra é um pixel e cada cor tem uma letra (veja CORES).
// Para mudar o desenho, troque as letras e salve: o SVG é montado a partir do mapa.
// O rosto é o olho da MiraV (amêndoa, íris e pupila), e os "raios" da logo viram as antenas.
//
// Partes animadas (CSS em globals.css, classes .robo-*):
// - olho aberto / olho fechado: alternam para piscar;
// - pontas: as pontas das antenas acendem e apagam;
// - peito: a telinha do peito pisca enquanto ele "fala";
// - fogo: as chamas do propulsor, que só aparecem quando ele voa ou pousa (home).

const CORES: Record<string, string> = {
  K: "#0A1D39", // contorno marinho
  W: "#F4F8FF", // corpo branco
  G: "#C3CEE0", // sombra do corpo
  V: "#0B1A36", // visor e telas
  B: "#0C67F1", // azul da marca
  D: "#0846A4", // azul escuro
  C: "#37C9EF", // ciano (brilho)
  L: "#EAF6FF", // reflexo
};

// 24 × 36 pixels. "." é transparente. As linhas 9 a 15 do visor ficam vazias (V) aqui:
// o olho é desenhado por cima, em camadas separadas, para poder piscar.
const CORPO = [
  "...........CC...........",
  "....C......BB......C....",
  ".....B.....BB.....B.....",
  "......B....BB....B......",
  ".......B...KK...B.......",
  "......KKKKKKKKKKKK......",
  "....KKWWWWWWWWWWWWKK....",
  "...KWWWWWWWWWWWWWWWWK...",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "..KWVVVVVVVVVVVVVVVVWK..",
  "...KWWWWWWWWWWWWWWWWK...",
  "....KKGGGGGGGGGGGGKK....",
  "......KKKKKKKKKKKK......",
  "..........KDDK..........",
  "......KKKKKKKKKKKK......",
  "..KK.KWWWWWWWWWWWWK.KK..",
  ".KDDKWWKKKKKKKKKKWWKDDK.",
  ".KDDKWWKVVVVVVVVKWWKDDK.",
  ".KDDKWWKVVCCCCVVKWWKDDK.",
  ".KDDKWWKVCVVVVCVKWWKDDK.",
  ".KDDKWWKVVCCCCVVKWWKDDK.",
  ".KDDKWWKKKKKKKKKKWWKDDK.",
  "..KK.KWWWWWWWWWWWWK.KK..",
  "..BB.KWGGWWWWWWGGWK.BB..",
  ".....KWWGGGGGGGGWWK.....",
  "......KKKKKKKKKKKK......",
  "......KDDDK..KDDDK......",
  ".....KBBBBK..KBBBBK.....",
  ".....KKKKKK..KKKKKK.....",
];

// O olho da MiraV, 16 × 7, desenhado a partir da coluna 4 e da linha 9.
const OLHO_ABERTO = [
  ".....CCCCCC.....",
  "...CC.BBBB.CC...",
  ".CC..BDDDDB..CC.",
  "C...BDLDDDDB...C",
  ".CC..BDDDDB..CC.",
  "...CC.BBBB.CC...",
  ".....CCCCCC.....",
];
const OLHO_FECHADO = ["", "", "", ".CCCCCCCCCCCCCC.", "", "", ""];

// pontas das antenas (acendem e apagam) e o centro da tela do peito (pisca enquanto ele fala)
const PONTAS = ["...........CC...........", "....C..............C...."];
const PEITO = ["BB"]; // desenhado na coluna 11, linha 26

// chamas do propulsor, embaixo dos pés (linhas 36 a 39, só quando propulsor=true)
const FOGO = [
  "......CLLC....CLLC......",
  "......CLLC....CLLC......",
  ".......CC......CC.......",
  ".......B........B.......",
];

type Pixel = { x: number; y: number; w: number; cor: string };

// Junta pixels vizinhos da mesma cor numa só tira: o SVG fica bem menor.
function tiras(mapa: string[], dx = 0, dy = 0): Pixel[] {
  const lista: Pixel[] = [];
  mapa.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const c = linha[x];
      if (c === "." || !CORES[c]) {
        x++;
        continue;
      }
      let w = 1;
      while (linha[x + w] === c) w++;
      lista.push({ x: x + dx, y: y + dy, w, cor: CORES[c] });
      x += w;
    }
  });
  return lista;
}

const desenho = {
  corpo: tiras(CORPO),
  aberto: tiras(OLHO_ABERTO, 4, 9),
  fechado: tiras(OLHO_FECHADO, 4, 9),
  pontas: tiras(PONTAS),
  peito: tiras(PEITO, 11, 26),
  fogo: tiras(FOGO, 0, 36),
};

function Camada({ pixels, className }: { pixels: Pixel[]; className?: string }) {
  return (
    <g className={className}>
      {pixels.map((p, i) =>
        // o contorno usa uma variável CSS: marinho no tema claro, azul-claro no escuro (globals.css)
        p.cor === CORES.K ? (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={1} className="robo-contorno" />
        ) : (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={1} fill={p.cor} />
        ),
      )}
    </g>
  );
}

export function RoboMirav({ falando = false, propulsor = false, className = "" }: { falando?: boolean; propulsor?: boolean; className?: string }) {
  // com propulsor, o desenho ganha 4 linhas embaixo para as chamas
  return (
    <svg viewBox={`0 0 24 ${propulsor ? 40 : 36}`} shapeRendering="crispEdges" className={`robo ${falando ? "falando" : ""} ${className}`} aria-hidden>
      {propulsor && <Camada pixels={desenho.fogo} className="robo-fogo" />}
      <Camada pixels={desenho.corpo} />
      <Camada pixels={desenho.pontas} className="robo-pontas" />
      <Camada pixels={desenho.aberto} className="robo-olho-aberto" />
      <Camada pixels={desenho.fechado} className="robo-olho-fechado" />
      <Camada pixels={desenho.peito} className="robo-peito" />
    </svg>
  );
}
