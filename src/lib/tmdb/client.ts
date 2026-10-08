import "server-only";

const BASE_URL = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 8000;

export const REVALIDATE = { short: 60 * 60 * 6, long: 60 * 60 * 24 } as const;
export const MAX_CONCURRENT = 10;

export type TmdbParams = Record<string, string | number | undefined>;

export class TmdbError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

function getToken(): string {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) throw new Error("Defina TMDB_API_READ_ACCESS_TOKEN no .env.local");
  return token;
}

export function buildUrl(path: string, params: TmdbParams = {}): string {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function retryDelayMs(retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  return retryAfter && Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 5) * 1000 : 500;
}

// Limite de pedidos simultâneos: quem termina passa a vaga direto para o próximo da fila.
let active = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}

function release(): void {
  const next = waiting.shift();
  if (next) next();
  else active--;
}

async function limited<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function tmdbFetch<T>(path: string, params: TmdbParams = {}, revalidate: number = REVALIDATE.short): Promise<T> {
  const url = buildUrl(path, { language: "pt-BR", ...params });
  const headers = { Authorization: `Bearer ${getToken()}`, accept: "application/json" };

  for (let attempt = 0; ; attempt++) {
    const res = await limited(() =>
      fetch(url, { headers, next: { revalidate }, signal: AbortSignal.timeout(TIMEOUT_MS) }),
    );
    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt === 0) {
      await sleep(retryDelayMs(res.headers.get("retry-after")));
      continue;
    }
    throw new TmdbError(res.status, `TMDB respondeu ${res.status} em ${path}`);
  }
}
