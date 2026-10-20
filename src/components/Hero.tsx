"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { tmdbImage } from "@/lib/format";
import type { FeaturedMovie } from "@/lib/tmdb/types";
import { AmbientLight } from "./AmbientLight";
import { InfoIcon } from "./Icons";
import { MovieMeta } from "./MovieMeta";
import { ProviderLogos } from "./ProviderLogos";

/**
 * Destaque da Início: foto de ponta a ponta e, quando há mais de um filme, troca sozinho a cada 9s.
 * O tempo é a própria animação da barrinha de progresso: ela pausa com o mouse/foco em cima
 * e não roda com "reduzir movimento" ligado, e aí a troca fica só no clique.
 */
export function Hero({ movies }: { movies: FeaturedMovie[] }) {
  const [active, setActive] = useState(0);
  if (movies.length === 0) return null;

  const movie = movies[Math.min(active, movies.length - 1)];
  const next = () => setActive((i) => (i + 1) % movies.length);

  return (
    <>
      <AmbientLight paths={movies.map((m) => m.backdropPath)} active={active} />

      <section aria-label="Destaque" className="group/hero relative h-[80svh] min-h-[540px] md:h-[95svh] md:max-h-[1040px] md:min-h-[680px]">
        {/* A foto se dissolve embaixo no brilho da página, sem emenda. */}
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent_97%)]">
          {movies.map((m, i) => (
            <div
              key={m.id}
              aria-hidden
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${i === active ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={tmdbImage(m.backdropPath, "original")!}
                alt=""
                fill
                sizes="100vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`object-cover object-[65%_20%] ${i === active ? "motion-safe:animate-[slow-zoom_16s_ease-out_both]" : ""}`}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-linear-to-r from-sala/95 via-sala/60 to-transparent md:via-sala/45 md:via-35% md:to-70%" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,transparent_40%,rgb(6_7_11/0.55))]" />
        </div>

        <div className="shell relative flex h-full items-end justify-between gap-10 pb-20 md:pb-56">
          <div key={movie.id} className="max-w-2xl min-w-0 flex-1 motion-safe:animate-[hero-in_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both]">
            <p className="text-sm font-semibold text-projetor md:text-base">{movie.rank}º em alta nos streamings</p>
            <h1 className="mt-2 font-display text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.82] font-extrabold tracking-[-0.005em] text-balance uppercase drop-shadow-[0_4px_30px_rgb(0_0_0/0.5)]">
              {movie.title}
            </h1>
            <MovieMeta
              rating={movie.rating}
              year={movie.year}
              runtime={movie.runtime}
              genres={movie.genres}
              className="mt-5 text-sm md:text-base"
            />
            {movie.overview && (
              <p className="mt-4 line-clamp-3 max-w-xl text-base leading-relaxed text-tela/80 md:text-lg">{movie.overview}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href={`/filme/${movie.id}`}
                className="inline-flex items-center gap-2 rounded-md bg-projetor px-6 py-3 font-semibold text-sala shadow-[0_10px_40px_-12px_rgb(244_185_64/0.55)] transition hover:bg-projetor-claro focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-tela"
              >
                <InfoIcon />
                Ver detalhes
              </Link>
              {movie.providers.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-tela/70">
                  <span>Disponível em</span>
                  <ProviderLogos providers={movie.providers} size="md" max={3} />
                </div>
              )}
            </div>
          </div>

          {movies.length > 1 && (
            <ul aria-label="Outros destaques" className="absolute right-(--gutter) bottom-10 flex gap-2 md:bottom-44 xl:static xl:gap-2.5">
              {movies.map((m, i) => {
                const isActive = i === active;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Mostrar ${m.title}`}
                      aria-pressed={isActive}
                      className={`group/thumb relative block h-1 w-7 overflow-hidden rounded-full bg-tela/25 transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-projetor xl:aspect-video xl:h-auto xl:w-28 xl:rounded-md xl:bg-poltrona xl:ring-1 2xl:w-36 ${
                        isActive ? "xl:ring-tela/70" : "xl:opacity-50 xl:ring-white/10 xl:hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={tmdbImage(m.backdropPath, "w300")!}
                        alt=""
                        fill
                        sizes="180px"
                        className="hidden object-cover xl:block"
                      />
                      <span
                        className={`absolute inset-x-0 bottom-0 h-full origin-left bg-projetor xl:h-[3px] ${
                          isActive
                            ? "animate-[hero-progress_9s_linear_both] group-focus-within/hero:[animation-play-state:paused] group-hover/hero:[animation-play-state:paused] motion-reduce:animate-none"
                            : "scale-x-0"
                        }`}
                        onAnimationEnd={next}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
