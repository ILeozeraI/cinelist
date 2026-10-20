import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AmbientLight } from "@/components/AmbientLight";
import { BackLink } from "@/components/BackLink";
import { MovieMeta } from "@/components/MovieMeta";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { parseMovieId } from "@/lib/filters";
import { tmdbImage } from "@/lib/format";
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
  const backdrop = tmdbImage(movie.backdropPath, "original");

  return (
    <article className="relative isolate overflow-x-clip">
      <AmbientLight paths={[movie.backdropPath ?? movie.posterPath]} />

      <div className="relative h-[46svh] min-h-[320px] md:h-[70svh] md:max-h-[820px]">
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent)]">
          {backdrop && (
            <Image src={backdrop} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover object-[60%_20%]" />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-sala/80 via-sala/20 to-transparent" />
        </div>
        <div className="shell page-top relative">
          <BackLink />
        </div>
      </div>

      <div className="shell relative -mt-28 grid gap-8 md:-mt-[30svh] md:grid-cols-[240px_1fr] md:items-end md:gap-12 lg:grid-cols-[300px_1fr]">
        <div className="relative hidden aspect-[2/3] overflow-hidden rounded-lg bg-poltrona shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 md:block">
          {poster ? (
            <Image src={poster} alt={`Pôster de ${movie.title}`} fill loading="eager" sizes="300px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center font-display text-2xl font-bold text-tela/80">{movie.title}</div>
          )}
        </div>

        <div className="space-y-6 md:pb-2">
          <header>
            <h1 className="font-display text-[clamp(2.75rem,6.5vw,6rem)] leading-[0.85] font-extrabold text-balance uppercase drop-shadow-[0_4px_30px_rgb(0_0_0/0.5)]">
              {movie.title}
            </h1>
            <MovieMeta
              rating={movie.rating}
              year={movie.year}
              runtime={movie.runtime}
              genres={movie.genres}
              className="mt-4 text-sm md:text-base"
            />
          </header>

          <p className="max-w-[62ch] text-base leading-relaxed text-tela/85 md:text-lg">
            {movie.overview || "Sinopse não disponível em português."}
          </p>

          <section aria-labelledby="onde-assistir" className="space-y-3">
            <h2 id="onde-assistir" className="font-display text-2xl font-bold tracking-[0.01em]">
              Onde assistir
            </h2>
            {movie.providers.length > 0 ? (
              <>
                <ul aria-label="Disponível em" className="flex flex-wrap gap-2.5">
                  {movie.providers.map((p) => {
                    const logo = tmdbImage(p.logoPath, "w92");
                    return (
                      <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white/5 py-1.5 pr-4 pl-1.5 ring-1 ring-white/10 backdrop-blur-sm">
                        {logo && <Image src={logo} alt="" width={36} height={36} className="rounded-md" />}
                        <span className="text-sm font-medium">{p.name}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-penumbra">Assinatura no Brasil. Dados: JustWatch</p>
              </>
            ) : (
              <p className="text-penumbra">Não está disponível por assinatura no Brasil no momento.</p>
            )}
          </section>
        </div>
      </div>

      {movie.trailer && (
        <section aria-labelledby="trailer" className="shell mt-16 md:mt-20">
          <h2 id="trailer" className="mb-4 font-display text-2xl font-bold tracking-[0.01em] md:text-[2rem]">
            Trailer
          </h2>
          <div className="max-w-5xl">
            <TrailerPlayer trailer={movie.trailer} title={movie.title} />
          </div>
        </section>
      )}
    </article>
  );
}
