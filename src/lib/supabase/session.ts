import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, supabaseFetch, withTimeout } from "./env";

// Visitante anônimo não tem cookie sb-; para ele o proxy não chama o Supabase.
export function hasSupabaseCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
}

// Renova o token da sessão e regrava os cookies na requisição e na resposta.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env || !hasSupabaseCookie(request)) return response;

  const supabase = createServerClient(env.url, env.key, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // Cache-Control no-store etc.: resposta com cookie de sessão não pode ir para o cache.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Se o Supabase estiver fora do ar ou lento, a navegação segue sem renovar.
  try {
    await withTimeout(supabase.auth.getClaims());
  } catch {}

  return response;
}
