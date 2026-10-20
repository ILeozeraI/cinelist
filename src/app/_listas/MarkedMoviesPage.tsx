import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { HomeTabs } from "@/components/HomeTabs";
import { MovieGrid } from "@/components/MovieGrid";
import { loginHref, UNAVAILABLE_MESSAGE } from "@/lib/auth";
import { listMarkedMovieIds, type MarkStatus } from "@/lib/marks";
import { createSupabaseServerClient, getCurrentUserId } from "@/lib/supabase/server";
import { getMovieDetails } from "@/lib/tmdb/movies";
import type { Movie } from "@/lib/tmdb/types";

const PAGES: Record<MarkStatus, { path: string; title: string }> = {
  quero_assistir: { path: "/quero-assistir", title: "Quero assistir" },
  ja_assisti: { path: "/ja-assisti", title: "Já assisti" },
};

// Devolve os ids marcados, ou null se o Supabase não respondeu. O redirect fica fora do try/catch.
async function loadIds(status: MarkStatus, path: string): Promise<number[] | null | "anonimo"> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const userId = await getCurrentUserId(supabase);
    if (!userId) return "anonimo";
    return await listMarkedMovieIds(supabase, userId, status);
  } catch (error) {
    console.error(`Falha ao carregar ${path}`, error);
    return null;
  }
}

export async function MarkedMoviesPage({ status }: { status: MarkStatus }) {
  const { path, title } = PAGES[status];
  // Página por usuário: sempre renderizada no pedido (evita o build tentar gerar estática).
  await connection();
  const ids = await loadIds(status, path);
  if (ids === "anonimo") redirect(loginHref(path));

  let body;
  if (ids === null) {
    body = <p className="text-penumbra">{UNAVAILABLE_MESSAGE}</p>;
  } else if (ids.length === 0) {
    body = (
      <div className="space-y-4">
        <p className="text-penumbra">Você ainda não marcou nenhum filme. Abra um filme e toque em &quot;{title}&quot;.</p>
        <Link href="/" className="inline-block rounded-full border border-white/15 px-4 py-2 text-sm transition hover:border-projetor/60 hover:text-projetor-claro">
          Descobrir filmes
        </Link>
      </div>
    );
  } else {
    // Filmes que o TMDB não devolve são pulados; a ordem salva é mantida.
    const results = await Promise.allSettled(ids.map((id) => getMovieDetails(id)));
    const movies: Movie[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) movies.push(result.value);
    }
    body = <MovieGrid movies={movies} />;
  }

  return (
    <div className="shell page-top pb-16">
      <HomeTabs />
      <h1 className="mt-6 mb-6 font-display text-[2.25rem] leading-none font-extrabold md:text-5xl">{title}</h1>
      {body}
    </div>
  );
}
