// Verifica na prática as suposições da spec (seção 5) sobre a API do TMDB.
// Uso: node --env-file=.env.local scripts/verificar-tmdb.mjs
const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
if (!token) {
  console.error("Defina TMDB_API_READ_ACCESS_TOKEN no .env.local");
  process.exit(1);
}

const BASE = "https://api.themoviedb.org/3";

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries({ language: "pt-BR", ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} em ${path}: ${await res.text()}`);
  return res.json();
}

const providers = await get("/watch/providers/movie", { watch_region: "BR" });
const sorted = providers.results
  .map((p) => ({ id: p.provider_id, nome: p.provider_name, prioridadeBR: p.display_priorities?.BR ?? p.display_priority }))
  .sort((a, b) => a.prioridadeBR - b.prioridadeBR);
console.log("\n1) Provedores no Brasil (40 primeiros por prioridade):");
console.table(sorted.slice(0, 40));

const discover = await get("/discover/movie", {
  watch_region: "BR",
  with_watch_monetization_types: "flatrate",
  with_watch_providers: "8|119",
  sort_by: "popularity.desc",
});
console.log(`\n2) Discover Netflix|Prime por assinatura: ${discover.total_results} filmes`);
for (const m of discover.results.slice(0, 5)) console.log(`   - ${m.title} (${m.id})`);

const first = discover.results[0];
const wp = await get(`/movie/${first.id}/watch/providers`);
const flat = wp.results?.BR?.flatrate ?? [];
console.log(`\n3) Assinaturas de "${first.title}": ${flat.map((p) => `${p.provider_name} (${p.provider_id})`).join(", ") || "(nenhuma)"}`);
console.log(`   Contém Netflix (8) ou Prime (119)? ${flat.some((p) => [8, 119].includes(p.provider_id)) ? "SIM ✅" : "NÃO ❌"}`);

const det = await get(`/movie/${first.id}`, {
  append_to_response: "videos,watch/providers",
  include_video_language: "pt,en",
});
console.log(`\n4) Detalhes: runtime=${det.runtime}, vídeos=${det.videos?.results?.length ?? 0}, chave "watch/providers"? ${"watch/providers" in det ? "SIM ✅" : "NÃO ❌"}`);
const trailers = (det.videos?.results ?? []).filter((v) => v.site === "YouTube" && v.type === "Trailer");
console.log(`   Trailers YouTube (idioma, *=oficial): ${trailers.map((v) => `${v.iso_639_1}${v.official ? "*" : ""}`).join(", ") || "(nenhum)"}`);
