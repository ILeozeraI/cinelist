import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeReturnPath } from "@/lib/auth";
import {
  createSupabaseServerClient,
  getCurrentUserId,
} from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ voltar?: string | string[] }> };

export default async function EntrarPage({ searchParams }: Props) {
  const raw = (await searchParams).voltar;
  const voltar = safeReturnPath(Array.isArray(raw) ? raw[0] : raw);

  // Quem já está logado não precisa do formulário. Se o Supabase falhar, mostra o formulário
  // mesmo assim: o envio mostra a mensagem de indisponível.
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) userId = await getCurrentUserId(supabase);
  } catch {}
  if (userId) redirect(voltar);

  return (
    <div className="shell page-top pb-16">
      <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-poltrona p-6 md:p-8">
        <h1 className="mb-1 font-display text-4xl leading-none font-extrabold">
          Entrar
        </h1>
        <p className="mb-6 text-penumbra">
          Entre ou crie uma conta para marcar os filmes que você quer ver e os
          que já viu.
        </p>
        <AuthForm returnTo={voltar} />
      </div>
    </div>
  );
}
