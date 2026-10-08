import Image from "next/image";
import { TMDB_DISCLAIMER } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800 py-8 text-sm text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 md:flex-row md:items-center md:gap-6">
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={120} height={16} unoptimized />
        </a>
        <p>{TMDB_DISCLAIMER}</p>
        <p>
          Dados de streaming:{" "}
          <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            JustWatch
          </a>
        </p>
      </div>
    </footer>
  );
}
