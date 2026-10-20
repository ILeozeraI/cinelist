import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

// Uma única instância no navegador. Devolve null sem as variáveis.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client) return client;
  const env = getSupabaseEnv();
  if (!env) return null;
  client = createBrowserClient(env.url, env.key);
  return client;
}
