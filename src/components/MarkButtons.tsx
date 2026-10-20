"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadMark, setMark } from "@/app/mark-actions";
import type { MarkResult } from "@/app/mark-actions";
import { loginHref, UNAVAILABLE_MESSAGE } from "@/lib/auth";
import type { MarkStatus } from "@/lib/marks";
import { CheckIcon } from "./Icons";

const pillClass =
  "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor disabled:cursor-default disabled:opacity-60";

const OPTIONS: { status: MarkStatus; label: string }[] = [
  { status: "quero_assistir", label: "Quero assistir" },
  { status: "ja_assisti", label: "Já assisti" },
];

/** Botões "Quero assistir" / "Já assisti". O estado vem do servidor depois que a página abre (a página em si é a mesma para todos). */
export function MarkButtons({ movieId }: { movieId: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<MarkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = `/filme/${movieId}`;

  useEffect(() => {
    let current = true;
    loadMark(movieId).then(
      (result) => {
        if (!current) return;
        if (result.state === "ok") setStatus(result.status);
        else if (result.state === "anonimo") setAnonymous(true);
        setLoading(false);
      },
      () => current && setLoading(false),
    );
    return () => {
      current = false;
    };
  }, [movieId]);

  async function toggle(clicked: MarkStatus) {
    if (anonymous) {
      router.push(loginHref(returnTo));
      return;
    }
    const previous = status;
    setError(null);
    setStatus(previous === clicked ? null : clicked);
    setSaving(true);
    let result: MarkResult;
    try {
      result = await setMark(movieId, previous === clicked ? null : clicked);
    } catch {
      result = { state: "indisponivel" };
    } finally {
      setSaving(false);
    }
    if (result.state === "ok") {
      setStatus(result.status);
      return;
    }
    setStatus(previous);
    if (result.state === "anonimo") {
      setAnonymous(true);
      router.push(loginHref(returnTo));
    } else {
      setError(UNAVAILABLE_MESSAGE);
    }
  }

  const busy = loading || saving;

  return (
    <div className="space-y-2">
      <div role="group" aria-label="Sua lista" className="flex flex-wrap gap-2">
        {OPTIONS.map(({ status: option, label }) => {
          const active = status === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => toggle(option)}
              className={`${pillClass} ${
                active
                  ? "border-projetor bg-projetor text-sala"
                  : "border-white/10 bg-black/40 text-tela/85 backdrop-blur-md hover:border-white/25 hover:text-tela"
              }`}
            >
              {active && <CheckIcon className="size-3.5" />}
              {label}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-penumbra">
          {error}
        </p>
      )}
    </div>
  );
}
