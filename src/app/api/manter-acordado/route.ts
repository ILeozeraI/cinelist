import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

// Compara os dois lados pelo hash (tamanho fixo), sem vazar o tamanho do segredo.
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

// Chamada uma vez por dia pelo Vercel Cron: uma consulta leve para o Supabase gratuito não pausar.
export async function GET(request: Request): Promise<Response> {
  const segredo = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!segredo || !auth.startsWith("Bearer ") || !segredoConfere(auth.slice(7), segredo)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const env = getSupabaseEnv();
  if (!env) return Response.json({ ok: false }, { status: 503 });

  const supabase = createClient(env.url, env.key, { auth: { persistSession: false } });
  // A RLS devolve 0 linhas para anon, mas a consulta chega ao banco.
  const { error } = await supabase.from("movie_marks").select("movie_id", { count: "exact", head: true });
  if (error) {
    console.error("manter-acordado: consulta ao Supabase falhou", error);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true });
}
