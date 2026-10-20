import Image from "next/image";
import { APP_NAME, TMDB_DISCLAIMER } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-black/30 py-10 text-sm text-penumbra">
      <div className="shell flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
        <p className="font-display text-2xl leading-none font-extrabold text-tela/80">{APP_NAME}</p>
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-80 transition hover:opacity-100">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={120} height={16} unoptimized />
        </a>
        <p className="max-w-md">{TMDB_DISCLAIMER}</p>
        <p className="md:ml-auto">
          Dados de streaming:{" "}
          <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-tela">
            JustWatch
          </a>
        </p>
      </div>
    </footer>
  );
}
