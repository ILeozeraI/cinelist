import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { ProviderLogos } from "@/components/ProviderLogos";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { parseMovieId } from "@/lib/filters";
import { formatRating, formatRuntime, tmdbImage } from "@/lib/format";
import { getMovieDetails } from "@/lib/tmdb/movies";

type Props = { params: Promise<{ id: string }> };

async function loadMovie(params: Props["params"]) {
  const id = parseMovieId((await params).id);
  return id ? getMovieDetails(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await loadMovie(params);
  return { title: movie ? movie.title : "Filme não encontrado" };
}

export default async function MoviePage({ params }: Props) {
  const movie = await loadMovie(params);
  if (!movie) notFound();

  const poster = tmdbImage(movie.posterPath, "w500");
  const runtime = formatRuntime(movie.runtime);

  return (
    <article className="space-y-10">
      <BackLink />

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <div className="relative aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-xl bg-zinc-800">
          {poster ? (
            <Image src={poster} alt={`Pôster de ${movie.title}`} fill loading="eager" sizes="300px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-zinc-300">{movie.title}</div>
          )}
        </div>

        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold md:text-4xl">
              {movie.title} {movie.year && <span className="font-normal text-zinc-400">({movie.year})</span>}
            </h1>
            <p className="mt-2 flex gap-4 text-sm text-zinc-300">
              {movie.rating > 0 && <span>★ {formatRating(movie.rating)}</span>}
              {runtime && <span>{runtime}</span>}
            </p>
          </header>

          <p className="max-w-prose leading-relaxed text-zinc-200">
            {movie.overview || "Sinopse não disponível em português."}
          </p>

          <section aria-labelledby="onde-assistir" className="space-y-3">
            <h2 id="onde-assistir" className="text-lg font-semibold">
              Onde assistir
            </h2>
            {movie.providers.length > 0 ? (
              <>
                <ProviderLogos providers={movie.providers} size="md" max={20} />
                <p className="text-xs text-zinc-500">Dados: JustWatch</p>
              </>
            ) : (
              <p className="text-zinc-400">Não está disponível por assinatura no Brasil no momento.</p>
            )}
          </section>
        </div>
      </div>

      {movie.trailer && (
        <section aria-labelledby="trailer" className="max-w-4xl space-y-3">
          <h2 id="trailer" className="text-lg font-semibold">
            Trailer
          </h2>
          <TrailerPlayer trailer={movie.trailer} title={movie.title} />
        </section>
      )}
    </article>
  );
}
