"use client";

import { useRouter } from "next/navigation";

export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="text-sm text-zinc-400 hover:text-white"
    >
      ← Voltar
    </button>
  );
}
