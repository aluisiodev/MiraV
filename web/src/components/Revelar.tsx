"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

// Faz o conteúdo surgir suavemente quando entra na tela.
export function Revelar({
  children,
  como: Tag = "div",
  atraso = 0,
  className = "",
}: {
  children: ReactNode;
  como?: ElementType;
  atraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const visivel = useVisivel(ref);
  return (
    <Tag ref={ref} className={`revelar ${visivel ? "visivel" : ""} ${className}`} style={{ transitionDelay: `${atraso}ms` }}>
      {children}
    </Tag>
  );
}

export function useVisivel(ref: React.RefObject<HTMLElement | null>, margem = "0px 0px -12% 0px") {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { rootMargin: margem },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, margem]);
  return visivel;
}
