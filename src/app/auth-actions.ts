"use server";

import { redirect } from "next/navigation";
import {
  type AuthFormState,
  authErrorMessage,
  safeReturnPath,
  UNAVAILABLE_MESSAGE,
} from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIN_PASSWORD = 6;
const INVALID_EMAIL = "Digite um e-mail válido.";

// Server Actions são endpoints públicos: valide tudo o que chega.
function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isEmail(email: string): boolean {
  const at = email.indexOf("@");
  return at > 0 && at < email.length - 1;
}

async function authenticate(
  mode: "signIn" | "signUp",
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email").trim().toLowerCase();
  const password = readText(formData, "senha");
  const returnTo = safeReturnPath(readText(formData, "voltar"));

  if (!isEmail(email)) return { error: INVALID_EMAIL, email };
  if (mode === "signUp" && password.length < MIN_PASSWORD) {
    return { error: authErrorMessage({ code: "weak_password" }), email };
  }
  if (mode === "signIn" && !password)
    return { error: "Digite a senha.", email };

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { error: UNAVAILABLE_MESSAGE, email };

    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: authErrorMessage(error), email };
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: authErrorMessage(error), email };
      if (!data.session) {
        // Sem sessão = "Confirm email" ligado por engano no projeto do Supabase.
        console.error(
          "signUp não devolveu sessão: confira se 'Confirm email' está desligado.",
        );
        return { error: UNAVAILABLE_MESSAGE, email };
      }
    }
  } catch (error) {
    console.error("Falha ao falar com o Supabase", error);
    return { error: UNAVAILABLE_MESSAGE, email };
  }

  // redirect() lança um erro especial: precisa ficar fora do try/catch.
  redirect(returnTo);
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  return authenticate("signIn", formData);
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  return authenticate("signUp", formData);
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  } catch {
    // Os cookies são limpos de qualquer forma.
  }
  redirect("/");
}
