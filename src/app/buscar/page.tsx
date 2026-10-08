import type { Metadata } from "next";
import { loadMoreSearch } from "@/app/actions";
import { PaginatedMovieGrid } from "@/components/PaginatedMovieGrid";
import type { SearchParamsInput } from "@/lib/filters";
import { searchMovies } from "@/lib/tmdb/movies";

export const metadata: Metadata = { title: "Buscar" };

const MAX_QUERY_LENGTH = 100;

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function BuscarPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, MAX_QUERY_LENGTH);

  if (!q) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Buscar filme</h1>
        <p className="mt-2 text-zinc-400">Digite o nome de um filme no campo de busca lá em cima.</p>
      </div>
    );
  }

  const firstPage = await searchMovies(q, 1);
  const nothingAvailable = firstPage.items.length === 0 && firstPage.page >= firstPage.totalPages;

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Resultados para &quot;{q}&quot;</h1>
      {nothingAvailable ? (
        <p className="text-zinc-400">Nenhum filme com esse nome está disponível nos streamings agora.</p>
      ) : (
        <PaginatedMovieGrid key={q} initial={firstPage} loadPage={loadMoreSearch.bind(null, q)} />
      )}
    </section>
  );
}
