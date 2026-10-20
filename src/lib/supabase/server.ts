import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv, supabaseFetch, withTimeout } from "./env";

// Devolve null quando o Supabase não está configurado (o site público segue funcionando).
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components não podem gravar cookies; o proxy renova a sessão nesse caso.
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {}
      },
    },
  });
}

// Id do usuário logado (token validado) ou null se for anônimo.
// Lança erro se o Supabase não responder (nem a tempo), para não confundir "anônimo" com "fora do ar".
export async function getCurrentUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await withTimeout(supabase.auth.getClaims());
  if (error) {
    // Cookie estragado ou vencido (JWT inválido, refresh token velho) vale como anônimo.
    // Só o que indica Supabase fora do ar (rede, status 0 ou 5xx) é relançado.
    const status = (error as { status?: number }).status;
    const foraDoAr = error.name === "AuthRetryableFetchError" || status === 0 || (status !== undefined && status >= 500);
    if (foraDoAr) throw error;
    return null;
  }
  return data?.claims.sub ?? null;
}
