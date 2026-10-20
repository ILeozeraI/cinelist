"use client";

import { useRef } from "react";
import { ChevronIcon } from "./Icons";

type Props = { label: string; children: React.ReactNode; as?: "ul" | "ol" };

const arrowClass =
  "absolute inset-y-0 z-10 hidden w-(--gutter) items-center justify-center text-tela opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-none md:flex [&>svg]:transition-transform hover:[&>svg]:scale-125";

/** Fileira que rola de lado, de ponta a ponta da tela, com setas no computador. */
export function RowScroller({ label, children, as: List = "ul" }: Props) {
  const ref = useRef<HTMLUListElement & HTMLOListElement>(null);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85 });
  }

  return (
    <div className="relative">
      <List
        ref={ref}
        className="no-scrollbar flex snap-x gap-3 overflow-x-auto overscroll-x-contain scroll-px-(--gutter) px-(--gutter) pt-2 pb-5 motion-safe:scroll-smooth md:gap-4"
      >
        {children}
      </List>
      <button type="button" aria-label={`Voltar em ${label}`} onClick={() => scroll(-1)} className={`${arrowClass} left-0 bg-linear-to-r from-sala to-transparent`}>
        <ChevronIcon direction="left" className="size-8" />
      </button>
      <button type="button" aria-label={`Avançar em ${label}`} onClick={() => scroll(1)} className={`${arrowClass} right-0 bg-linear-to-l from-sala to-transparent`}>
        <ChevronIcon direction="right" className="size-8" />
      </button>
    </div>
  );
}
