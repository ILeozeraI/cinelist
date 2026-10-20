import Image from "next/image";
import { tmdbImage } from "@/lib/format";

type Props = { paths: (string | null)[]; active?: number };

/**
 * A luz da "tela" vazando pela sala: uma cópia minúscula e muito desfocada da foto em destaque,
 * atrás da página toda. O pai precisa de `relative isolate` para o brilho ficar atrás do conteúdo.
 */
export function AmbientLight({ paths, active = 0 }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[160svh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_25%,transparent)]"
    >
      {paths.map((path, i) => {
        const src = tmdbImage(path, "w300");
        if (!src) return null;
        return (
          <Image
            key={`${path}-${i}`}
            src={src}
            alt=""
            fill
            sizes="300px"
            className={`scale-110 object-cover blur-3xl saturate-150 transition-opacity duration-1000 ${i === active ? "opacity-45" : "opacity-0"}`}
          />
        );
      })}
    </div>
  );
}
