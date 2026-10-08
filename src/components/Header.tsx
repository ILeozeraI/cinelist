"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/explorar", label: "Explorar" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-wide text-yellow-400">
          {APP_NAME}
        </Link>
        <nav aria-label="Principal" className="flex gap-4 text-sm">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={active ? "font-semibold text-white" : "text-zinc-400 hover:text-white"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/buscar" method="get" role="search" className="order-last w-full md:order-none md:ml-auto md:w-72">
          <input
            type="search"
            name="q"
            required
            aria-label="Buscar filme"
            placeholder="🔍 Buscar filme…"
            className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </form>
      </div>
    </header>
  );
}
