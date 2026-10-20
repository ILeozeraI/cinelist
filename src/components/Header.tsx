"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { APP_NAME } from "@/lib/site";
import { AccountMenu } from "./AccountMenu";
import { SearchIcon } from "./Icons";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/explorar", label: "Explorar" },
];

// O Início também fica ativo nas listas pessoais (abas ao lado da Descobrir).
const HOME_PATHS = ["/", "/quero-assistir", "/ja-assisti"];

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function Header() {
  const pathname = usePathname();
  // Transparente sobre a foto do topo; ganha fundo assim que a página rola.
  const scrolled = useSyncExternalStore(subscribeToScroll, () => window.scrollY > 24, () => false);

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <div aria-hidden className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-transparent" />
      <div
        aria-hidden
        className={`absolute inset-0 border-b border-white/5 bg-sala/85 backdrop-blur-xl transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
      <div className="shell relative flex flex-wrap items-center gap-x-8 gap-y-2 py-3 md:h-[72px] md:flex-nowrap md:py-0">
        <Link
          href="/"
          className="font-display text-[1.75rem] leading-none font-extrabold tracking-[0.02em] text-projetor focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-projetor md:text-[2rem]"
        >
          {APP_NAME}
        </Link>
        <nav aria-label="Principal" className="flex gap-6 text-sm md:text-[0.95rem]">
          {LINKS.map((link) => {
            const active = link.href === "/" ? HOME_PATHS.includes(pathname) : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 transition-colors focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor ${
                  active
                    ? "font-semibold text-tela after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-projetor"
                    : "text-tela/70 hover:text-tela"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/buscar" method="get" role="search" className="relative order-last w-full md:order-none md:ml-auto md:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-tela/50" />
          <input
            type="search"
            name="q"
            required
            aria-label="Buscar filme"
            placeholder="Buscar filme"
            className="w-full rounded-full border border-white/10 bg-black/40 py-2 pr-4 pl-10 text-sm backdrop-blur-md transition placeholder:text-tela/45 focus:border-projetor/60 focus:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-projetor/40"
          />
        </form>
        <div className="ml-auto md:ml-0">
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
