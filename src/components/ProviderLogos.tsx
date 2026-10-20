import Image from "next/image";
import { tmdbImage } from "@/lib/format";
import type { Provider } from "@/lib/tmdb/types";

type Props = { providers: Provider[]; size?: "sm" | "md"; max?: number; className?: string };

const PIXELS = { sm: 20, md: 44 } as const;

export function ProviderLogos({ providers, size = "sm", max = 4, className = "" }: Props) {
  if (providers.length === 0) return null;

  const shown = providers.slice(0, max);
  const extra = providers.length - shown.length;
  const px = PIXELS[size];

  return (
    <ul aria-label="Disponível em" className={`flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((p) => {
        const logo = tmdbImage(p.logoPath, "w92");
        return (
          <li key={p.id}>
            {logo ? (
              <Image src={logo} alt={p.name} title={p.name} width={px} height={px} className={size === "sm" ? "rounded shadow-sm shadow-black/60" : "rounded-lg ring-1 ring-white/10"} />
            ) : (
              <span className="rounded bg-poltrona px-1 text-[10px]">{p.name}</span>
            )}
          </li>
        );
      })}
      {extra > 0 && <li className="rounded bg-black/70 px-1 text-[10px] font-semibold">+{extra}</li>}
    </ul>
  );
}
