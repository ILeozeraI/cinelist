"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Descobrir" },
  { href: "/quero-assistir", label: "Quero assistir" },
  { href: "/ja-assisti", label: "Já assisti" },
];

export function HomeTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Suas listas" className="flex gap-6 text-sm md:text-[0.95rem]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative py-1 transition-colors focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor ${
              active
                ? "font-semibold text-tela after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-projetor"
                : "text-tela/70 hover:text-tela"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
