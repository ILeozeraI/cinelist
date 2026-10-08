import type { Metadata } from "next";
import { loadMoreDiscover } from "@/app/actions";
import { FiltersPanel } from "@/components/FiltersPanel";
import { PaginatedMovieGrid } from "@/components/PaginatedMovieGrid";
import { parseFilters, serializeFilters, type SearchParamsInput } from "@/lib/filters";
import { ALL_GENRES } from "@/lib/genres";
import { discoverMovies, getProviderOptions } from "@/lib/tmdb/movies";

export const metadata: Metadata = { title: "Explorar" };

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function ExplorarPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const query = serializeFilters(filters);
  const [providers, firstPage] = await Promise.all([getProviderOptions(), discoverMovies(filters, 1)]);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-10">
      <FiltersPanel providers={providers} genres={ALL_GENRES} filters={filters} currentYear={new Date().getFullYear()} />
      <section className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold">Explorar</h1>
        {firstPage.items.length === 0 ? (
          <p className="text-zinc-400">Nenhum filme encontrado com esses filtros.</p>
        ) : (
          <PaginatedMovieGrid key={query} initial={firstPage} loadPage={loadMoreDiscover.bind(null, query)} />
        )}
      </section>
    </div>
  );
}
