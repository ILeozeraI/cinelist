"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/auth-actions";
import type { AuthFormState } from "@/lib/auth";

type Mode = "entrar" | "criar";

const tabClass =
  "flex-1 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor";
const inputClass =
  "w-full rounded-lg border border-white/10 bg-sala px-3 py-2.5 text-tela placeholder:text-penumbra focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor";

const initialState: AuthFormState = { error: null, email: "" };

export function AuthForm({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<Mode>("entrar");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["entrar", "criar"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`${tabClass} ${
              mode === value
                ? "border-projetor bg-projetor text-sala"
                : "border-white/10 bg-black/40 text-tela/85 hover:border-white/25 hover:text-tela"
            }`}
          >
            {value === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {/* key: cada modo tem o próprio estado; o erro de um não aparece no outro. */}
      <ModeForm key={mode} mode={mode} returnTo={returnTo} />
    </div>
  );
}

function ModeForm({ mode, returnTo }: { mode: Mode; returnTo: string }) {
  const [state, formAction, pending] = useActionState(
    mode === "entrar" ? signIn : signUp,
    initialState,
  );
  const creating = mode === "criar";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="voltar" value={returnTo} />

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-tela/90">
        E-mail
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          key={state.email}
          className={`${inputClass} font-normal`}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-tela/90">
          Senha
          <input
            type="password"
            name="senha"
            required
            minLength={creating ? 6 : undefined}
            maxLength={72}
            autoComplete={creating ? "new-password" : "current-password"}
            aria-describedby={creating ? "senha-regra" : undefined}
            className={`${inputClass} font-normal`}
          />
        </label>
        {creating && (
          <span id="senha-regra" className="text-xs text-penumbra">
            Mínimo de 6 caracteres
          </span>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-projetor px-5 py-2.5 font-semibold text-sala transition hover:bg-projetor-claro disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor"
      >
        {pending
          ? creating
            ? "Criando conta…"
            : "Entrando…"
          : creating
            ? "Criar conta"
            : "Entrar"}
      </button>
    </form>
  );
}
