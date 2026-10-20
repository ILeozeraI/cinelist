"use client";

import { useRouter } from "next/navigation";
import { ChevronIcon } from "./Icons";

export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 py-1.5 pr-4 pl-2.5 text-sm text-tela/85 backdrop-blur-md transition hover:border-white/25 hover:text-tela focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor"
    >
      <ChevronIcon direction="left" />
      Voltar
    </button>
  );
}
