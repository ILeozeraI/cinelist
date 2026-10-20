// Lê as variáveis públicas do Supabase. Elas precisam ser escritas por extenso:
// o Next só embute no navegador as NEXT_PUBLIC_* citadas literalmente.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Quanto o servidor espera o Supabase antes de desistir (cada pedido e o getClaims inteiro).
export const SUPABASE_TIMEOUT_MS = 3000;

// fetch com tempo limite para os clientes do servidor; sem ele um Supabase fora do ar trava a página.
export const supabaseFetch: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

// Rejeita se a promessa não terminar a tempo (o getClaims repete a renovação por até ~30 s).
export function withTimeout<T>(promise: Promise<T>, ms = SUPABASE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Supabase não respondeu em ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
