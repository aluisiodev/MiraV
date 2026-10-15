// Logo simplificada em duas camadas: os raios apagam e o olho pisca.
// Usada nas etapas de carregamento, onde a marca se mexe.

export function OlhoAnimado({ tamanho = 168, rotulo }: { tamanho?: number; rotulo?: string }) {
  return (
    <div
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      className="relative shrink-0"
      style={{ width: tamanho, height: tamanho * (230 / 224) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo/simbolo-raios.svg" alt="" className="raios-pisca absolute inset-0 h-full w-full" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo/simbolo-olho.svg" alt="" className="olho-pisca absolute inset-0 h-full w-full" />
    </div>
  );
}
