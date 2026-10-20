"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DEFAULT_FILTERS, MIN_YEAR, serializeFilters, SORT_OPTIONS } from "@/lib/filters";
import { tmdbImage } from "@/lib/format";
import type { DiscoverFilters, Genre, Provider, SortOption } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; genres: Genre[]; filters: DiscoverFilters; currentYear: number };

const SORT_LABELS: Record<SortOption, string> = {
  popularidade: "Popularidade",
  nota: "Nota",
  lancamento: "Lançamento",
};

/** 0,5 a 9, de 0,5 em 0,5. */
const RATING_OPTIONS = Array.from({ length: 18 }, (_, i) => (i + 1) / 2);

const selectClass = "mt-1.5 w-full rounded-md border border-white/10 bg-poltrona px-3 py-2.5 text-sm transition hover:border-white/20 focus:border-projetor/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-projetor/40";
const labelClass = "block text-sm font-semibold text-tela/90";

const toNumberOrNull = (value: string) => (value === "" ? null : Number(value));

export function FiltersPanel({ providers, genres, filters: serverFilters, currentYear }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Cópia local: cada clique parte do que o usuário já escolheu, sem esperar o servidor responder.
  // Quando chegam filtros novos do servidor (ou o usuário volta no histórico), a cópia é refeita.
  const [filters, setFilters] = useState(serverFilters);
  const [lastServerFilters, setLastServerFilters] = useState(serverFilters);
  if (serverFilters !== lastServerFilters) {
    setLastServerFilters(serverFilters);
    setFilters(serverFilters);
  }
  const years = Array.from({ length: currentYear + 1 - MIN_YEAR + 1 }, (_, i) => currentYear + 1 - i);

  function apply(next: DiscoverFilters) {
    const query = serializeFilters(next);
    setFilters(next);
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function toggleProvider(id: number) {
    const selected = filters.providerIds.includes(id);
    apply({
      ...filters,
      providerIds: selected ? filters.providerIds.filter((p) => p !== id) : [...filters.providerIds, id],
    });
  }

  return (
    <aside aria-busy={isPending} className="md:sticky md:top-24 md:w-64 md:shrink-0 md:self-start md:rounded-xl md:bg-poltrona/70 md:p-5 md:ring-1 md:ring-white/5 md:backdrop-blur-md">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="painel-filtros"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold md:hidden"
      >
        Filtros
      </button>

      <div id="painel-filtros" className={`${open ? "block" : "hidden"} mt-4 space-y-6 md:mt-0 md:block`}>
        <fieldset>
          <legend className={labelClass}>Streamings</legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {providers.map((p) => {
              const active = filters.providerIds.includes(p.id);
              const logo = tmdbImage(p.logoPath, "w92");
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  title={p.name}
                  onClick={() => toggleProvider(p.id)}
                  className={`overflow-hidden rounded-lg transition ${active ? "ring-2 ring-projetor ring-offset-2 ring-offset-sala" : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"}`}
                >
                  {logo ? (
                    <Image src={logo} alt={p.name} width={48} height={48} className="h-auto w-full" />
                  ) : (
                    <span className="block p-1 text-[10px]">{p.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="filtro-genero" className={labelClass}>Gênero</label>
          <select
            id="filtro-genero"
            value={filters.genreId ?? ""}
            onChange={(e) => apply({ ...filters, genreId: toNumberOrNull(e.target.value) })}
            className={selectClass}
          >
            <option value="">Todos</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filtro-ano-de" className={labelClass}>Ano de</label>
            <select
              id="filtro-ano-de"
              value={filters.yearFrom ?? ""}
              onChange={(e) => apply({ ...filters, yearFrom: toNumberOrNull(e.target.value) })}
              className={selectClass}
            >
              <option value="">Qualquer</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-ano-ate" className={labelClass}>Ano até</label>
            <select
              id="filtro-ano-ate"
              value={filters.yearTo ?? ""}
              onChange={(e) => apply({ ...filters, yearTo: toNumberOrNull(e.target.value) })}
              className={selectClass}
            >
              <option value="">Qualquer</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="filtro-nota" className={labelClass}>Nota mínima</label>
          <select
            id="filtro-nota"
            value={filters.minRating ?? ""}
            onChange={(e) => apply({ ...filters, minRating: toNumberOrNull(e.target.value) })}
            className={selectClass}
          >
            <option value="">Qualquer</option>
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r}>★ {r.toFixed(1)}+</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-ordem" className={labelClass}>Ordenar por</label>
          <select
            id="filtro-ordem"
            value={filters.sort}
            onChange={(e) => apply({ ...filters, sort: e.target.value as SortOption })}
            className={selectClass}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o}>{SORT_LABELS[o]}</option>
            ))}
          </select>
        </div>

        {isPending && (
          <p role="status" className="text-xs text-penumbra">
            Atualizando…
          </p>
        )}

        <button type="button" onClick={() => apply(DEFAULT_FILTERS)} className="text-sm text-penumbra underline underline-offset-4 hover:text-tela">
          Limpar filtros
        </button>
      </div>
    </aside>
  );
}
