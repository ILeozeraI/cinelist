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

// Chamada uma vez por dia pelo Vercel Cron para o Supabase gratuito não pausar.
// Só uma contagem (HEAD) que voltava 0 linhas não bastou: agora grava no banco e ainda faz uma leitura.
export async function GET(request: Request): Promise<Response> {
  const segredo = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!segredo || !auth.startsWith("Bearer ") || !segredoConfere(auth.slice(7), segredo)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const env = getSupabaseEnv();
  if (!env) return Response.json({ ok: false }, { status: 503 });

  const supabase = createClient(env.url, env.key, { auth: { persistSession: false } });
  // Escrita: atualiza a tabela keepalive (supabase/migrations/20261110_manter_acordado.sql).
  const escrita = await supabase.rpc("manter_acordado");
  if (escrita.error) {
    console.error("manter-acordado: gravação no Supabase falhou", escrita.error);
    return Response.json({ ok: false }, { status: 503 });
  }
  // Leitura: a RLS devolve 0 linhas para anon, mas a consulta chega ao banco.
  const leitura = await supabase.from("movie_marks").select("movie_id", { count: "exact", head: true });
  if (leitura.error) {
    console.error("manter-acordado: consulta ao Supabase falhou", leitura.error);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true });
}
