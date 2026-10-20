// Lê as variáveis públicas do Supabase. Elas precisam ser escritas por extenso:
// o Next só embute no navegador as NEXT_PUBLIC_* citadas literalmente.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}
