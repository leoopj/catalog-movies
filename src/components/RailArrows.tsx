"use client";

import { useRef, type ReactNode } from "react";

type RailArrowsProps = {
  children: ReactNode;
};

export function RailArrows({ children }: RailArrowsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Rolar para a esquerda"
        onClick={() => scrollByPage(-1)}
        className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-[var(--background)] to-transparent text-[var(--foreground)] opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
      >
        ‹
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Rolar para a direita"
        onClick={() => scrollByPage(1)}
        className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-[var(--background)] to-transparent text-[var(--foreground)] opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
      >
        ›
      </button>
    </div>
  );
}
