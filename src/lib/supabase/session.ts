import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "./env";

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
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Se o Supabase estiver fora do ar, a navegação segue sem renovar.
  try {
    await supabase.auth.getClaims();
  } catch {}

  return response;
}
