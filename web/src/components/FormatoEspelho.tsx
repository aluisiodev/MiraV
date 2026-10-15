import type { Formato } from "@/lib/api";

export const FORMATOS: Formato[] = ["retangular", "oval", "arco", "redondo", "personalizado"];

// Contorno de cada modelo de espelho, desenhado em ouro.
export function IconeEspelho({ formato, className = "", ativo = false }: { formato: Formato; className?: string; ativo?: boolean }) {
  const cor = ativo ? "#E0B23B" : "#8A6A1F";
  const comum = { fill: "none", stroke: cor, strokeWidth: 2.5, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden="true">
      {formato === "retangular" && <rect x="12" y="4" width="56" height="92" rx="1" {...comum} />}
      {formato === "oval" && <ellipse cx="40" cy="50" rx="28" ry="46" {...comum} />}
      {formato === "arco" && <path d="M12 96V34a28 28 0 0 1 56 0v62Z" {...comum} />}
      {formato === "redondo" && <circle cx="40" cy="50" r="34" {...comum} />}
      {formato === "personalizado" && (
        <path d="M32 4h36v62c0 17-13 30-30 30H12V34C12 17 18 4 32 4Z" {...comum} strokeDasharray="5 4" />
      )}
      {ativo && formato !== "personalizado" && <circle cx="40" cy="50" r="2.5" fill={cor} />}
    </svg>
  );
}

// Moldura com o formato do espelho, usada para mostrar a foto na página /espelho.
export const estiloMoldura: Record<Formato, { aspecto: string; raio: string }> = {
  retangular: { aspecto: "3 / 4", raio: "2px" },
  oval: { aspecto: "3 / 4", raio: "50%" },
  arco: { aspecto: "3 / 4", raio: "999px 999px 2px 2px" },
  redondo: { aspecto: "1 / 1", raio: "50%" },
  personalizado: { aspecto: "3 / 4", raio: "38% 2px 38% 2px" },
};
