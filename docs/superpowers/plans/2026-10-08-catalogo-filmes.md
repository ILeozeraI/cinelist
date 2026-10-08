# Catálogo de Filmes nos Streamings: Plano de Implementação

> **Para quem vai executar (agente):** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** construir o CineList, um site em Next.js para descobrir os filmes disponíveis agora nos streamings por assinatura no Brasil. Ele usa a API do TMDB, tem tema escuro, a Início em vitrine por gênero, a tela Explorar com filtros, busca e uma página de detalhes com trailer.

**Arquitetura:** o servidor monta as páginas (Server Components do App Router), e as respostas do TMDB ficam em cache por tempo (6 h ou 24 h). Só `src/lib/tmdb/client.ts` conhece o token e a URL do TMDB. `src/lib/tmdb/movies.ts` expõe funções prontas que devolvem os tipos do app, e os componentes recebem esses tipos sem saber que o TMDB existe. A única interação que busca dados no navegador é o "Carregar mais", feita por Server Actions.

**Stack:** Next.js (App Router, versão estável mais recente via `create-next-app@latest`), React, TypeScript, Tailwind CSS v4, Vitest + Testing Library, Playwright e Vercel.

**Spec:** `docs/superpowers/specs/2026-10-08-catalogo-filmes-design.md` (leia junto com este plano)

## Restrições globais

- Todo texto visível ao usuário fica em **pt-BR**. Todos os pedidos ao TMDB usam `language=pt-BR`, e os de disponibilidade usam `watch_region=BR`.
- "Disponível" significa só **assinatura**: `with_watch_monetization_types=flatrate` e `results.BR.flatrate`.
- **Só tema escuro**, sem alternância para claro.
- O token fica em `TMDB_API_READ_ACCESS_TOKEN` no `.env.local`. **Nunca** use o prefixo `NEXT_PUBLIC_`, nunca imprima o token no terminal e nunca peça ao usuário que cole o token no chat.
- **Cache:** 6 horas (`21600` s) para discover, busca e streamings por filme. 24 horas (`86400` s) para detalhes e lista de provedores.
- **Pedidos ao TMDB:** no máximo **10** simultâneos. Em HTTP 429 ou 5xx, **1** nova tentativa, respeitando `Retry-After` (limitado a 5 s; sem o cabeçalho, 500 ms).
- **Aviso do TMDB, texto exato:** "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB." **Crédito, texto exato:** "Dados de streaming: JustWatch".
- **Fronteiras:** `src/lib/` não importa nada de `src/components/` nem de `src/app/`. Os componentes importam de `src/lib/` apenas tipos, `format`, `filters`, `genres` e `site`, **nunca** `tmdb/client` ou `tmdb/movies`.
- **Estilos:** só classes do Tailwind. A cor de destaque é `yellow-400` e o fundo é `zinc-950`.
- **Ambiente:** Windows 11, Node.js v24 e Git Bash. Python, se for necessário, é chamado com `py`. Os comandos deste plano são para **bash** e rodam na raiz do projeto (`/c/Users/thuna/Downloads/curso-claude-code`), exceto quando indicado.
- **Commits:** o autor já está configurado no repositório (Leonardo Silva). Todo commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, passada como segundo `-m`.
- O dono do projeto é **leigo em programação**. Toda ação que dependa dele (contas, token, publicação) deve ser explicada passo a passo, em linguagem simples.

## Foco da revisão

1. **Busca com acentos e símbolos** (ex.: "Pânico & Cia"): o texto tem que chegar intacto ao TMDB. *Teste: Tarefa 6, "codifica acentos e & na busca".*
2. **Link do Explorar editado à mão com lixo** (`?streaming=abc,8&nota=9.7&de=1800&ordem=x`): a página normaliza e não quebra. *Teste: Tarefa 4, "descarta valores inválidos".*
3. **"Carregar mais" clicado várias vezes, ou páginas do TMDB que repetem filmes**: um pedido por vez e nenhum card duplicado. *Testes: Tarefa 12, "faz um pedido por vez…" e "não repete filmes…".*
4. **`/filme/abc`, `/filme/0` ou um ID que não existe**: aparece a página amigável "Filme não encontrado", nunca um erro 500. *Testes: Tarefa 4 (`parseMovieId`), Tarefa 7 ("404 vira null") e Tarefa 15 (E2E).*
5. **Busca cujos primeiros resultados não estão em nenhum streaming**: a busca procura nas páginas seguintes (até 3 por vez) antes de mostrar "nenhum resultado". *Testes: Tarefa 7, "procura na página seguinte…" e "desiste após 3 páginas…".*

## Mapa de arquivos

```
.env.example                          modelo do arquivo de token (versionado)
.gitignore                            (já existe; ganha entradas na Tarefa 1)
next.config.ts                        domínios de imagem permitidos
vitest.config.mts                     configuração dos testes de unidade/componentes
playwright.config.ts                  configuração dos testes de ponta a ponta
scripts/verificar-tmdb.mjs            verificação prática das suposições sobre a API
docs/superpowers/notes/2026-10-08-verificacao-tmdb.md   resultado da verificação
e2e/catalogo.spec.ts                  testes de ponta a ponta
public/tmdb-logo.svg                  logo oficial do TMDB (rodapé)
src/
  test/setup.ts                       jest-dom + limpeza entre testes
  test/stubs/empty.ts                 substituto do pacote "server-only" nos testes
  test/toolchain.test.tsx             confirma que a ferramenta de testes funciona
  test/fixtures/tmdb.ts               respostas-exemplo cruas do TMDB
  test/fixtures/movies.ts             filmes no formato do app para testes de componentes
  lib/site.ts                         nome do app, descrição, aviso do TMDB
  lib/format.ts                       duração, nota, URL de imagem
  lib/genres.ts                       10 gêneros da Início e 19 gêneros com nomes pt-BR
  lib/filters.ts                      filtros ⇄ URL, validação de id e página
  lib/trailer.ts                      regra de escolha do trailer
  lib/tmdb/types.ts                   tipos crus do TMDB e tipos do app
  lib/tmdb/mappers.ts                 resposta crua → tipos do app
  lib/tmdb/client.ts                  única peça que chama o TMDB
  lib/tmdb/movies.ts                  funções de dados usadas pelas telas
  components/Header.tsx               cabeçalho (cliente: link ativo)
  components/Footer.tsx               rodapé com créditos
  components/Skeletons.tsx            pôsteres "fantasma"
  components/ProviderLogos.tsx        logos dos streamings
  components/MovieCard.tsx            card de filme
  components/MovieRow.tsx             fileira horizontal
  components/Hero.tsx                 filme em destaque
  components/MovieGrid.tsx            grade de cards
  components/PaginatedMovieGrid.tsx   grade + "Carregar mais" (cliente)
  components/FiltersPanel.tsx         filtros do Explorar (cliente)
  components/TrailerPlayer.tsx        capa + ▶, carrega o YouTube no clique (cliente)
  components/BackLink.tsx             "← Voltar" (cliente)
  app/globals.css                     Tailwind + tema escuro
  app/layout.tsx                      moldura: cabeçalho, conteúdo, rodapé
  app/page.tsx                        Início
  app/loading.tsx | error.tsx | not-found.tsx
  app/actions.ts                      Server Actions de "carregar mais"
  app/explorar/page.tsx
  app/buscar/page.tsx
  app/filme/[id]/page.tsx
  app/filme/[id]/not-found.tsx
```

---

### Tarefa 1: Criar o projeto e a ferramenta de testes

**Arquivos:**
- Criar (pelo gerador): `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/*`, `README.md`
- Criar: `vitest.config.mts`, `src/test/setup.ts`, `src/test/stubs/empty.ts`, `src/test/toolchain.test.tsx`, `.env.example`
- Modificar: `.gitignore`, `src/app/page.tsx`, `next.config.ts`

**Interfaces:**
- Consome: nada.
- Produz: os scripts `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`; o alias `@/*` → `src/*`; o pacote `server-only`, que nos testes é substituído por um módulo vazio.

- [ ] **Passo 1: gerar o projeto Next.js numa pasta temporária**

A pasta do projeto já tem `docs/` e `.superpowers/`, e o gerador recusa pastas com arquivos desconhecidos. Por isso, gere fora e copie depois.

```bash
cd /c/Users/thuna/Downloads
npx --yes create-next-app@latest catalogo-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --yes
```

Esperado: a pasta `catalogo-tmp` é criada, com `package.json` e `src/app/page.tsx`.

- [ ] **Passo 2: copiar para o projeto sem sobrescrever o que já existe**

```bash
cd /c/Users/thuna/Downloads
rm -f catalogo-tmp/.gitignore
cp -rn catalogo-tmp/. curso-claude-code/
rm -rf catalogo-tmp
cd curso-claude-code && ls
```

Esperado: aparecem `package.json`, `next.config.ts`, `tsconfig.json`, `src/`, `public/` e `README.md`. As pastas `docs/` e `.git/` continuam intactas.

- [ ] **Passo 3: completar o `.gitignore`**

Substitua todo o conteúdo de `.gitignore` por:

```gitignore
node_modules/
.next/
out/
.env*.local
.vercel/
.superpowers/
coverage/
playwright-report/
test-results/
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Passo 4: instalar as dependências e os scripts**

```bash
npm install
npm install server-only
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
npm pkg set "scripts.test=vitest run" "scripts.test:watch=vitest" "scripts.typecheck=tsc --noEmit"
```

Esperado: a instalação termina sem `ERR!`, e o `package.json` passa a ter os scripts `test`, `test:watch` e `typecheck`.

- [ ] **Passo 5: configurar o Vitest**

Crie `vitest.config.mts`:

```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // "server-only" lança erro fora do servidor do Next; nos testes vira um módulo vazio.
      "server-only": fileURLToPath(new URL("./src/test/stubs/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

Crie `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

Crie `src/test/stubs/empty.ts`:

```ts
export {};
```

- [ ] **Passo 6: escrever o teste que confirma a ferramenta**

Crie `src/test/toolchain.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("renderiza React e usa os matchers do jest-dom", () => {
  render(<p>ok</p>);
  expect(screen.getByText("ok")).toBeInTheDocument();
});
```

- [ ] **Passo 7: rodar os testes**

Rode: `npm test`
Esperado: PASS, 1 teste.

- [ ] **Passo 8: limpar o modelo gerado e configurar imagens e o `.env.example`**

```bash
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

Substitua `src/app/page.tsx` por:

```tsx
export default function HomePage() {
  return <p>CineList em construção</p>;
}
```

Substitua `next.config.ts` por:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
```

Crie `.env.example`:

```
# Copie este arquivo para .env.local e cole o seu "API Read Access Token" do TMDB.
TMDB_API_READ_ACCESS_TOKEN=cole_aqui_o_seu_token
```

- [ ] **Passo 9: verificar o build, os tipos e o lint**

Rode: `npm run build && npm run typecheck && npm run lint && npm test`
Esperado: tudo termina com código 0. O build cria o `next-env.d.ts`, que o `typecheck` usa.

- [ ] **Passo 10: commit**

```bash
git status --short   # conferir: nada de .env.local, node_modules ou .superpowers
git add -A
git commit -m "chore: cria projeto Next.js com Tailwind, Vitest e Testing Library" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 2: Token do TMDB (guiado) e verificação prática da API

**Arquivos:**
- Criar: `scripts/verificar-tmdb.mjs`, `docs/superpowers/notes/2026-10-08-verificacao-tmdb.md`
- O dono do projeto cria `.env.local`, que não é versionado.

**Interfaces:**
- Consome: `.env.example` (Tarefa 1).
- Produz: um `.env.local` com o token válido e a **lista verificada de IDs de streamings por assinatura no Brasil**, que a Tarefa 7 usa em `SUBSCRIPTION_PROVIDER_IDS`.

- [ ] **Passo 1: guiar o dono do projeto na criação do token**

Envie ao usuário estas instruções, exatamente nesta ordem, e espere a confirmação de que terminou:

> 1. Acesse https://www.themoviedb.org/signup e crie sua conta. Confirme o e-mail que o TMDB enviar.
> 2. Entrando na conta, abra https://www.themoviedb.org/settings/api e clique em **Create** (ou "Request an API Key").
> 3. Escolha o tipo **Developer**, aceite os termos e preencha o formulário. Sugestões: *Application Name* "CineList"; *Application URL* `http://localhost:3000`; *Application Summary* "Projeto pessoal de portfólio: catálogo de filmes disponíveis nos streamings no Brasil".
> 4. Na mesma página aparece o campo **API Read Access Token**, um texto bem longo que começa com `eyJ`. **Não cole esse token aqui no chat.**
> 5. No VS Code, abra o arquivo `.env.local` que eu criei, troque `cole_aqui_o_seu_token` pelo seu token, salve e me avise.

Antes de enviar o passo 5, crie o arquivo para o usuário só ter que colar o token:

```bash
cp -n .env.example .env.local
```

- [ ] **Passo 2: conferir que o token está no arquivo, sem mostrá-lo**

Rode: `grep -c "^TMDB_API_READ_ACCESS_TOKEN=eyJ" .env.local`
Esperado: `1`. Se aparecer `0`, peça ao usuário que confira se colou o token **API Read Access Token** (e não a "API Key" curta) logo depois do `=`, sem espaços.

- [ ] **Passo 3: escrever o script de verificação**

Crie `scripts/verificar-tmdb.mjs`:

```js
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
```

- [ ] **Passo 4: rodar a verificação**

Rode: `node --env-file=.env.local scripts/verificar-tmdb.mjs`

Esperado:
- a seção 1 lista dezenas de provedores;
- a seção 2 mostra **mais de 0** filmes;
- a seção 3 diz **SIM ✅**;
- a seção 4 diz **SIM ✅** para `watch/providers`.

**Se a seção 2 der 0 filmes ou a seção 3/4 der NÃO:** a suposição da spec falhou. **PARE** e relate ao usuário o resultado do terminal antes de qualquer outra tarefa. Não improvise outra consulta.

- [ ] **Passo 5: registrar os streamings por assinatura verificados**

Na tabela da seção 1, identifique os serviços de **assinatura**: Netflix, Amazon Prime Video, Disney Plus, Max/HBO Max, Globoplay, Apple TV+ ("Apple TV Plus"), Paramount Plus, Crunchyroll, MUBI, Telecine, Claro video, Looke e outros do mesmo tipo. **Ignore as lojas de aluguel e compra**: "Apple TV" (sem Plus), "Google Play Movies", "Amazon Video", "Microsoft Store" e semelhantes. Ignore também as variantes "with Ads" ou "Channel".

Crie `docs/superpowers/notes/2026-10-08-verificacao-tmdb.md` copiando os valores **reais** da saída:

```markdown
# Verificação da API do TMDB — 2026-10-08

- Discover com `with_watch_monetization_types=flatrate` + `with_watch_providers=8|119`: <N> filmes (funciona).
- `/movie/{id}/watch/providers` → `results.BR.flatrate`: funciona (exemplo: <título> → <serviços>).
- `append_to_response=videos,watch/providers`: chave `watch/providers` presente.

## Streamings por assinatura no Brasil (para `SUBSCRIPTION_PROVIDER_IDS`)

| ID | Nome | Prioridade BR |
|---|---|---|
| 8 | Netflix | … |
| … | … | … |
```

- [ ] **Passo 6: commit**

```bash
git add scripts/verificar-tmdb.mjs docs/superpowers/notes/2026-10-08-verificacao-tmdb.md
git commit -m "chore: verifica na prática as consultas do TMDB usadas pelo app" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 3: Tipos, formatação e gêneros

**Arquivos:**
- Criar: `src/lib/tmdb/types.ts`, `src/lib/format.ts`, `src/lib/genres.ts`
- Testar: `src/lib/format.test.ts`, `src/lib/genres.test.ts`

**Interfaces:**
- Consome: nada.
- Produz:
  - **tipos do app:** `Provider`, `Movie`, `MovieDetails`, `Trailer`, `Genre`, `SortOption`, `DiscoverFilters`, `Page<T>`;
  - **tipos crus:** `TmdbMovie`, `TmdbPaged<T>`, `TmdbProvider`, `TmdbWatchProviders`, `TmdbVideo`, `TmdbMovieDetails`;
  - **funções:** `formatRuntime(min: number | null): string | null`, `formatRating(v: number): string`, `tmdbImage(path: string | null, size: ImageSize): string | null`;
  - **constantes:** `HOME_GENRES: Genre[]` (10 itens) e `ALL_GENRES: Genre[]` (19 itens).

- [ ] **Passo 1: criar os tipos (só declarações, sem lógica)**

Crie `src/lib/tmdb/types.ts`:

```ts
// ---------- Tipos do app (o que os componentes conhecem) ----------

export type Provider = { id: number; name: string; logoPath: string | null };

export type Movie = {
  id: number;
  title: string;
  year: number | null;
  rating: number;
  posterPath: string | null;
  backdropPath: string | null;
  providers: Provider[];
};

export type Trailer = { key: string; name: string };

export type MovieDetails = Movie & {
  overview: string;
  runtime: number | null;
  trailer: Trailer | null;
};

export type Genre = { id: number; name: string };

export type SortOption = "popularidade" | "nota" | "lancamento";

export type DiscoverFilters = {
  providerIds: number[];
  genreId: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  sort: SortOption;
};

export type Page<T> = { items: T[]; page: number; totalPages: number };

// ---------- Respostas cruas do TMDB (só lib/tmdb conhece) ----------

export type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average?: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
};

export type TmdbPaged<T> = { page: number; results: T[]; total_pages: number; total_results: number };

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
  display_priorities?: Record<string, number>;
};

export type TmdbWatchProviders = {
  results?: Record<string, { link?: string; flatrate?: TmdbProvider[] }>;
};

export type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  iso_3166_1: string;
};

export type TmdbMovieDetails = TmdbMovie & {
  runtime: number | null;
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
};
```

- [ ] **Passo 2: escrever os testes de formatação (vão falhar)**

Crie `src/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatRating, formatRuntime, tmdbImage } from "./format";

describe("formatRuntime", () => {
  it("formata horas e minutos", () => {
    expect(formatRuntime(166)).toBe("2h 46min");
  });
  it("omite minutos zerados", () => {
    expect(formatRuntime(120)).toBe("2h");
  });
  it("mostra só minutos abaixo de 1 hora", () => {
    expect(formatRuntime(45)).toBe("45min");
  });
  it("retorna null para duração ausente ou zero", () => {
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("formatRating", () => {
  it("usa uma casa decimal", () => {
    expect(formatRating(8.237)).toBe("8.2");
    expect(formatRating(7)).toBe("7.0");
  });
});

describe("tmdbImage", () => {
  it("monta a URL da imagem no tamanho pedido", () => {
    expect(tmdbImage("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });
  it("retorna null sem caminho", () => {
    expect(tmdbImage(null, "w342")).toBeNull();
  });
});
```

- [ ] **Passo 3: escrever os testes de gêneros (vão falhar)**

Crie `src/lib/genres.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ALL_GENRES, HOME_GENRES } from "./genres";

describe("gêneros", () => {
  it("a Início tem os 10 gêneros na ordem combinada", () => {
    expect(HOME_GENRES.map((g) => g.id)).toEqual([28, 35, 18, 27, 878, 10749, 16, 53, 80, 12]);
    expect(HOME_GENRES.map((g) => g.name)).toEqual([
      "Ação", "Comédia", "Drama", "Terror", "Ficção científica",
      "Romance", "Animação", "Suspense", "Crime", "Aventura",
    ]);
  });

  it("a lista completa tem 19 gêneros sem repetição e inclui os da Início", () => {
    const ids = ALL_GENRES.map((g) => g.id);
    expect(ids).toHaveLength(19);
    expect(new Set(ids).size).toBe(19);
    for (const g of HOME_GENRES) expect(ALL_GENRES).toContainEqual(g);
  });
});
```

- [ ] **Passo 4: rodar e ver falhar**

Rode: `npm test -- src/lib/format.test.ts src/lib/genres.test.ts`
Esperado: FAIL com "Failed to resolve import ./format" e "./genres".

- [ ] **Passo 5: implementar**

Crie `src/lib/format.ts`:

```ts
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize = "w92" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function tmdbImage(path: string | null, size: ImageSize): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
```

Crie `src/lib/genres.ts`:

```ts
import type { Genre } from "./tmdb/types";

/** Fileiras da Início, nesta ordem (spec 3.3). */
export const HOME_GENRES: Genre[] = [
  { id: 28, name: "Ação" },
  { id: 35, name: "Comédia" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Terror" },
  { id: 878, name: "Ficção científica" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animação" },
  { id: 53, name: "Suspense" },
  { id: 80, name: "Crime" },
  { id: 12, name: "Aventura" },
];

/** Os 19 gêneros de filme do TMDB, em ordem alfabética, para o filtro do Explorar. */
export const ALL_GENRES: Genre[] = [
  { id: 28, name: "Ação" },
  { id: 16, name: "Animação" },
  { id: 12, name: "Aventura" },
  { id: 10770, name: "Cinema TV" },
  { id: 35, name: "Comédia" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentário" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Família" },
  { id: 14, name: "Fantasia" },
  { id: 37, name: "Faroeste" },
  { id: 878, name: "Ficção científica" },
  { id: 10752, name: "Guerra" },
  { id: 36, name: "História" },
  { id: 9648, name: "Mistério" },
  { id: 10402, name: "Música" },
  { id: 10749, name: "Romance" },
  { id: 53, name: "Suspense" },
  { id: 27, name: "Terror" },
];
```

- [ ] **Passo 6: rodar e ver passar**

Rode: `npm test -- src/lib/format.test.ts src/lib/genres.test.ts`
Esperado: PASS, 9 testes.

- [ ] **Passo 7: commit**

```bash
git add src/lib/tmdb/types.ts src/lib/format.ts src/lib/format.test.ts src/lib/genres.ts src/lib/genres.test.ts
git commit -m "feat: adiciona tipos do app, formatação e lista de gêneros" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 4: Filtros na URL e validação de parâmetros

**Arquivos:**
- Criar: `src/lib/filters.ts`
- Testar: `src/lib/filters.test.ts`

**Interfaces:**
- Consome: `ALL_GENRES` (Tarefa 3) e os tipos `DiscoverFilters` e `SortOption` (Tarefa 3).
- Produz:
  - **tipo:** `SearchParamsInput = Record<string, string | string[] | undefined>`;
  - **constantes:** `SORT_OPTIONS: readonly SortOption[]`, `DEFAULT_FILTERS: DiscoverFilters`, `MIN_YEAR = 1900`, `MAX_PAGE = 500`;
  - **funções:**
    - `parseFilters(sp: SearchParamsInput, currentYear?: number): DiscoverFilters`
    - `serializeFilters(f: DiscoverFilters): string`, que devolve a query sem `?` e `""` quando tudo está no padrão
    - `parseMovieId(raw: string): number | null`
    - `parsePage(value: unknown): number | null`
- **Nomes dos parâmetros na URL:** `streaming` (IDs separados por vírgula), `genero`, `de`, `ate`, `nota` e `ordem` (`popularidade` | `nota` | `lancamento`).

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/lib/filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, parseFilters, parseMovieId, parsePage, serializeFilters } from "./filters";
import type { DiscoverFilters } from "./tmdb/types";

const YEAR = 2026;

describe("parseFilters", () => {
  it("sem parâmetros usa o padrão", () => {
    expect(parseFilters({}, YEAR)).toEqual(DEFAULT_FILTERS);
  });

  it("lê todos os campos", () => {
    expect(
      parseFilters({ streaming: "8,119", genero: "27", de: "2000", ate: "2024", nota: "6.5", ordem: "nota" }, YEAR),
    ).toEqual({ providerIds: [8, 119], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" });
  });

  it("descarta valores inválidos", () => {
    expect(
      parseFilters({ streaming: "abc,8,-3,8", genero: "999", de: "1800", ate: "3000", nota: "9.7", ordem: "aleatorio" }, YEAR),
    ).toEqual({ ...DEFAULT_FILTERS, providerIds: [8] });
  });

  it("troca 'de' e 'até' quando vêm invertidos", () => {
    expect(parseFilters({ de: "2024", ate: "2000" }, YEAR)).toMatchObject({ yearFrom: 2000, yearTo: 2024 });
  });

  it("aceita o ano seguinte ao atual (lançamentos)", () => {
    expect(parseFilters({ ate: "2027" }, YEAR).yearTo).toBe(2027);
    expect(parseFilters({ ate: "2028" }, YEAR).yearTo).toBeNull();
  });

  it("usa o primeiro valor quando o parâmetro se repete", () => {
    expect(parseFilters({ genero: ["35", "27"] }, YEAR).genreId).toBe(35);
  });

  it("nota fora do passo de 0,5 ou zero é ignorada", () => {
    expect(parseFilters({ nota: "6.3" }, YEAR).minRating).toBeNull();
    expect(parseFilters({ nota: "0" }, YEAR).minRating).toBeNull();
    expect(parseFilters({ nota: "7" }, YEAR).minRating).toBe(7);
  });
});

describe("serializeFilters", () => {
  const full: DiscoverFilters = { providerIds: [8, 119], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" };

  it("omite o que está no padrão", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
  });

  it("gera os parâmetros sempre na mesma ordem", () => {
    expect(serializeFilters(full)).toBe("streaming=8%2C119&genero=27&de=2000&ate=2024&nota=6.5&ordem=nota");
  });

  it("ida e volta preserva os filtros", () => {
    const back = parseFilters(Object.fromEntries(new URLSearchParams(serializeFilters(full))), YEAR);
    expect(back).toEqual(full);
  });
});

describe("parseMovieId", () => {
  it("aceita só inteiros positivos", () => {
    expect(parseMovieId("693134")).toBe(693134);
    expect(parseMovieId("abc")).toBeNull();
    expect(parseMovieId("0")).toBeNull();
    expect(parseMovieId("-5")).toBeNull();
    expect(parseMovieId("12.5")).toBeNull();
  });
});

describe("parsePage", () => {
  it("aceita inteiros de 1 a 500", () => {
    expect(parsePage(2)).toBe(2);
    expect(parsePage(500)).toBe(500);
    expect(parsePage(0)).toBeNull();
    expect(parsePage(501)).toBeNull();
    expect(parsePage(1.5)).toBeNull();
    expect(parsePage("2")).toBeNull();
  });
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/lib/filters.test.ts`
Esperado: FAIL com "Failed to resolve import ./filters".

- [ ] **Passo 3: implementar**

Crie `src/lib/filters.ts`:

```ts
import { ALL_GENRES } from "./genres";
import type { DiscoverFilters, SortOption } from "./tmdb/types";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS: readonly SortOption[] = ["popularidade", "nota", "lancamento"];
export const MIN_YEAR = 1900;
/** O TMDB não devolve páginas além da 500. */
export const MAX_PAGE = 500;

export const DEFAULT_FILTERS: DiscoverFilters = {
  providerIds: [],
  genreId: null,
  yearFrom: null,
  yearTo: null,
  minRating: null,
  sort: "popularidade",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export function parseFilters(sp: SearchParamsInput, currentYear = new Date().getFullYear()): DiscoverFilters {
  const providerIds = [
    ...new Set(
      (first(sp.streaming) ?? "")
        .split(",")
        .map((s) => positiveInt(s.trim()))
        .filter((n): n is number => n !== null),
    ),
  ];

  const genre = positiveInt(first(sp.genero));
  const genreId = genre !== null && ALL_GENRES.some((g) => g.id === genre) ? genre : null;

  const year = (value: string | string[] | undefined) => {
    const n = positiveInt(first(value));
    return n !== null && n >= MIN_YEAR && n <= currentYear + 1 ? n : null;
  };
  let yearFrom = year(sp.de);
  let yearTo = year(sp.ate);
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];

  const ratingRaw = first(sp.nota);
  const rating = ratingRaw && /^\d+(\.\d+)?$/.test(ratingRaw) ? Number(ratingRaw) : NaN;
  const minRating = rating > 0 && rating <= 9 && Number.isInteger(rating * 2) ? rating : null;

  const order = first(sp.ordem);
  const sort = SORT_OPTIONS.find((o) => o === order) ?? DEFAULT_FILTERS.sort;

  return { providerIds, genreId, yearFrom, yearTo, minRating, sort };
}

export function serializeFilters(f: DiscoverFilters): string {
  const p = new URLSearchParams();
  if (f.providerIds.length > 0) p.set("streaming", f.providerIds.join(","));
  if (f.genreId !== null) p.set("genero", String(f.genreId));
  if (f.yearFrom !== null) p.set("de", String(f.yearFrom));
  if (f.yearTo !== null) p.set("ate", String(f.yearTo));
  if (f.minRating !== null) p.set("nota", String(f.minRating));
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("ordem", f.sort);
  return p.toString();
}

export function parseMovieId(raw: string): number | null {
  return positiveInt(raw);
}

export function parsePage(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_PAGE ? value : null;
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/lib/filters.test.ts`
Esperado: PASS, 12 testes.

- [ ] **Passo 5: commit**

```bash
git add src/lib/filters.ts src/lib/filters.test.ts
git commit -m "feat: converte filtros do Explorar de e para a URL com validação" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 5: Escolha do trailer e tradução das respostas do TMDB

**Arquivos:**
- Criar: `src/lib/trailer.ts`, `src/lib/tmdb/mappers.ts`, `src/test/fixtures/tmdb.ts`
- Testar: `src/lib/trailer.test.ts`, `src/lib/tmdb/mappers.test.ts`

**Interfaces:**
- Consome: os tipos da Tarefa 3.
- Produz:
  - `pickTrailer(videos: TmdbVideo[]): Trailer | null`
  - `toYear(date?: string): number | null`
  - `mapProvider(p: TmdbProvider): Provider`
  - `mapBrFlatrate(wp: TmdbWatchProviders | undefined): Provider[]`
  - `mapMovie(m: TmdbMovie, providers?: Provider[]): Movie`
  - `mapMovieDetails(d: TmdbMovieDetails): MovieDetails`
  - **Fixtures em `@/test/fixtures/tmdb`:**
    - provedores: `netflix`, `prime`, `disney`, `appleStore`;
    - filmes: `duna`, `semPoster`, `dunaDetails`;
    - funções auxiliares: `providersBr(...ps)`, `video(over)`, `paged(results, page?, totalPages?)`.

- [ ] **Passo 1: criar as respostas-exemplo**

Crie `src/test/fixtures/tmdb.ts`:

```ts
import type { TmdbMovie, TmdbMovieDetails, TmdbPaged, TmdbProvider, TmdbVideo, TmdbWatchProviders } from "@/lib/tmdb/types";

export const netflix: TmdbProvider = { provider_id: 8, provider_name: "Netflix", logo_path: "/netflix.jpg", display_priority: 5, display_priorities: { BR: 1 } };
export const prime: TmdbProvider = { provider_id: 119, provider_name: "Amazon Prime Video", logo_path: "/prime.jpg", display_priority: 1, display_priorities: { BR: 2 } };
export const disney: TmdbProvider = { provider_id: 337, provider_name: "Disney Plus", logo_path: "/disney.jpg", display_priority: 2, display_priorities: { BR: 3 } };
/** Loja de aluguel/compra: nunca deve virar opção de assinatura. */
export const appleStore: TmdbProvider = { provider_id: 2, provider_name: "Apple TV", logo_path: "/apple.jpg", display_priority: 0, display_priorities: { BR: 0 } };

export const duna: TmdbMovie = {
  id: 693134,
  title: "Duna: Parte Dois",
  release_date: "2024-02-27",
  vote_average: 8.15,
  poster_path: "/duna.jpg",
  backdrop_path: "/duna-bg.jpg",
  overview: "Paul Atreides se une a Chani e aos Fremen.",
};

export const semPoster: TmdbMovie = { id: 1, title: "Filme Raro", release_date: "", vote_average: 0, poster_path: null, backdrop_path: null };

export function providersBr(...ps: TmdbProvider[]): TmdbWatchProviders {
  return { results: { BR: { link: "https://www.themoviedb.org/movie/x/watch?locale=BR", flatrate: ps } } };
}

export function video(over: Partial<TmdbVideo> = {}): TmdbVideo {
  return { key: "abc", name: "Trailer", site: "YouTube", type: "Trailer", official: true, iso_639_1: "en", iso_3166_1: "US", ...over };
}

export const dunaDetails: TmdbMovieDetails = {
  ...duna,
  runtime: 166,
  videos: { results: [video({ key: "en1" }), video({ key: "pt1", iso_639_1: "pt", iso_3166_1: "BR" })] },
  "watch/providers": providersBr(prime),
};

export function paged<T>(results: T[], page = 1, totalPages = 1): TmdbPaged<T> {
  return { page, results, total_pages: totalPages, total_results: results.length };
}
```

- [ ] **Passo 2: escrever os testes do trailer (vão falhar)**

Crie `src/lib/trailer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { video } from "@/test/fixtures/tmdb";
import { pickTrailer } from "./trailer";

describe("pickTrailer", () => {
  it("prioriza pt oficial > pt > en oficial > en", () => {
    const enUnofficial = video({ key: "en", official: false });
    const enOfficial = video({ key: "enOf" });
    const ptUnofficial = video({ key: "pt", iso_639_1: "pt", iso_3166_1: "BR", official: false });
    const ptOfficial = video({ key: "ptOf", iso_639_1: "pt", iso_3166_1: "BR" });

    expect(pickTrailer([enUnofficial, enOfficial, ptUnofficial, ptOfficial])?.key).toBe("ptOf");
    expect(pickTrailer([enUnofficial, enOfficial, ptUnofficial])?.key).toBe("pt");
    expect(pickTrailer([enUnofficial, enOfficial])?.key).toBe("enOf");
    expect(pickTrailer([enUnofficial])?.key).toBe("en");
  });

  it("ignora o que não é trailer do YouTube", () => {
    expect(pickTrailer([video({ type: "Teaser" }), video({ site: "Vimeo" })])).toBeNull();
  });

  it("ignora outros idiomas", () => {
    expect(pickTrailer([video({ iso_639_1: "es" })])).toBeNull();
  });

  it("devolve o nome junto com a chave", () => {
    expect(pickTrailer([video({ key: "k1", name: "Trailer Oficial" })])).toEqual({ key: "k1", name: "Trailer Oficial" });
  });

  it("lista vazia → null", () => {
    expect(pickTrailer([])).toBeNull();
  });
});
```

- [ ] **Passo 3: escrever os testes dos mappers (vão falhar)**

Crie `src/lib/tmdb/mappers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { duna, dunaDetails, netflix, prime, providersBr, semPoster } from "@/test/fixtures/tmdb";
import { mapBrFlatrate, mapMovie, mapMovieDetails, toYear } from "./mappers";

describe("toYear", () => {
  it("extrai o ano da data", () => {
    expect(toYear("2024-02-27")).toBe(2024);
  });
  it("data vazia ou ausente → null", () => {
    expect(toYear("")).toBeNull();
    expect(toYear(undefined)).toBeNull();
  });
});

describe("mapBrFlatrate", () => {
  it("pega só as assinaturas do Brasil", () => {
    expect(mapBrFlatrate(providersBr(netflix))).toEqual([{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }]);
  });
  it("sem Brasil ou sem resposta → lista vazia", () => {
    expect(mapBrFlatrate({ results: { US: { flatrate: [netflix] } } })).toEqual([]);
    expect(mapBrFlatrate(undefined)).toEqual([]);
  });
});

describe("mapMovie", () => {
  it("traduz para o formato do app", () => {
    const providers = [{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }];
    expect(mapMovie(duna, providers)).toEqual({
      id: 693134,
      title: "Duna: Parte Dois",
      year: 2024,
      rating: 8.15,
      posterPath: "/duna.jpg",
      backdropPath: "/duna-bg.jpg",
      providers,
    });
  });
  it("aguenta campos ausentes", () => {
    expect(mapMovie(semPoster)).toEqual({
      id: 1, title: "Filme Raro", year: null, rating: 0, posterPath: null, backdropPath: null, providers: [],
    });
  });
});

describe("mapMovieDetails", () => {
  it("junta detalhes, streamings e trailer", () => {
    const d = mapMovieDetails(dunaDetails);
    expect(d.runtime).toBe(166);
    expect(d.overview).toBe("Paul Atreides se une a Chani e aos Fremen.");
    expect(d.trailer).toEqual({ key: "pt1", name: "Trailer" });
    expect(d.providers).toEqual([{ id: prime.provider_id, name: "Amazon Prime Video", logoPath: "/prime.jpg" }]);
  });
  it("duração zero, sinopse em branco, sem vídeos e sem streamings", () => {
    const d = mapMovieDetails({ ...semPoster, runtime: 0, overview: "   " });
    expect(d).toMatchObject({ runtime: null, overview: "", trailer: null, providers: [] });
  });
});
```

- [ ] **Passo 4: rodar e ver falhar**

Rode: `npm test -- src/lib/trailer.test.ts src/lib/tmdb/mappers.test.ts`
Esperado: FAIL com "Failed to resolve import ./trailer" e "./mappers".

- [ ] **Passo 5: implementar**

Crie `src/lib/trailer.ts`:

```ts
import type { Trailer, TmdbVideo } from "./tmdb/types";

const NOT_ALLOWED = Number.POSITIVE_INFINITY;

/** pt oficial (0) > pt (1) > en oficial (2) > en (3); demais idiomas ficam de fora. */
function rank(v: TmdbVideo): number {
  if (v.iso_639_1 === "pt") return v.official ? 0 : 1;
  if (v.iso_639_1 === "en") return v.official ? 2 : 3;
  return NOT_ALLOWED;
}

export function pickTrailer(videos: TmdbVideo[]): Trailer | null {
  const best = videos
    .filter((v) => v.site === "YouTube" && v.type === "Trailer" && rank(v) !== NOT_ALLOWED)
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? { key: best.key, name: best.name } : null;
}
```

Crie `src/lib/tmdb/mappers.ts`:

```ts
import { pickTrailer } from "../trailer";
import type { Movie, MovieDetails, Provider, TmdbMovie, TmdbMovieDetails, TmdbProvider, TmdbWatchProviders } from "./types";

export function toYear(date?: string): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function mapProvider(p: TmdbProvider): Provider {
  return { id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null };
}

export function mapBrFlatrate(wp: TmdbWatchProviders | undefined): Provider[] {
  return (wp?.results?.BR?.flatrate ?? []).map(mapProvider);
}

export function mapMovie(m: TmdbMovie, providers: Provider[] = []): Movie {
  return {
    id: m.id,
    title: m.title,
    year: toYear(m.release_date),
    rating: m.vote_average ?? 0,
    posterPath: m.poster_path ?? null,
    backdropPath: m.backdrop_path ?? null,
    providers,
  };
}

export function mapMovieDetails(d: TmdbMovieDetails): MovieDetails {
  return {
    ...mapMovie(d, mapBrFlatrate(d["watch/providers"])),
    overview: d.overview?.trim() ?? "",
    runtime: d.runtime && d.runtime > 0 ? d.runtime : null,
    trailer: pickTrailer(d.videos?.results ?? []),
  };
}
```

- [ ] **Passo 6: rodar e ver passar**

Rode: `npm test -- src/lib/trailer.test.ts src/lib/tmdb/mappers.test.ts`
Esperado: PASS, 13 testes.

- [ ] **Passo 7: commit**

```bash
git add src/lib/trailer.ts src/lib/trailer.test.ts src/lib/tmdb/mappers.ts src/lib/tmdb/mappers.test.ts src/test/fixtures/tmdb.ts
git commit -m "feat: traduz respostas do TMDB e escolhe o melhor trailer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 6: Cliente do TMDB (token, cache, limite e nova tentativa)

**Arquivos:**
- Criar: `src/lib/tmdb/client.ts`
- Testar: `src/lib/tmdb/client.test.ts`

**Interfaces:**
- Consome: nada do app. Lê `process.env.TMDB_API_READ_ACCESS_TOKEN`.
- Produz:
  - **tipo:** `TmdbParams = Record<string, string | number | undefined>`;
  - **constantes:** `REVALIDATE = { short: 21600, long: 86400 }`, `MAX_CONCURRENT = 10`;
  - **erro:** `class TmdbError extends Error { status: number }`;
  - **funções:**
    - `buildUrl(path: string, params?: TmdbParams): string`
    - `retryDelayMs(retryAfter: string | null): number`
    - `tmdbFetch<T>(path: string, params?: TmdbParams, revalidate?: number): Promise<T>`, que adiciona `language=pt-BR` e omite parâmetros `undefined` ou `""`.

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/lib/tmdb/client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUrl, MAX_CONCURRENT, REVALIDATE, retryDelayMs, TmdbError, tmdbFetch } from "./client";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

beforeEach(() => {
  vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "token-teste");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildUrl", () => {
  it("codifica acentos e & na busca", () => {
    const url = buildUrl("/search/movie", { query: "Pânico & Cia" });
    expect(new URL(url).searchParams.get("query")).toBe("Pânico & Cia");
    expect(url).toContain("query=P%C3%A2nico+%26+Cia");
  });
});

describe("tmdbFetch", () => {
  it("envia o token, pt-BR, os parâmetros e o tempo de cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(tmdbFetch("/discover/movie", { page: 2, with_genres: undefined })).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.themoviedb.org/3/discover/movie");
    expect(u.searchParams.get("language")).toBe("pt-BR");
    expect(u.searchParams.get("page")).toBe("2");
    expect(u.searchParams.has("with_genres")).toBe(false);
    expect(init.headers.Authorization).toBe("Bearer token-teste");
    expect(init.next).toEqual({ revalidate: REVALIDATE.short });
  });

  it("usa o tempo de cache informado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}));
    vi.stubGlobal("fetch", fetchMock);
    await tmdbFetch("/movie/1", {}, REVALIDATE.long);
    expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 86400 });
  });

  it("explica o que fazer quando falta o token", async () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn());
    await expect(tmdbFetch("/x")).rejects.toThrow("Defina TMDB_API_READ_ACCESS_TOKEN no .env.local");
  });

  it("404 vira TmdbError sem nova tentativa", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}, 404));
    vi.stubGlobal("fetch", fetchMock);
    await expect(tmdbFetch("/movie/999")).rejects.toMatchObject({ name: "TmdbError", status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 tenta de novo uma vez, respeitando Retry-After", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 429, { "retry-after": "1" }))
      .mockResolvedValueOnce(json({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(tmdbFetch("/x")).resolves.toEqual({ ok: 1 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("5xx duas vezes seguidas vira TmdbError", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(json({}, 500));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(tmdbFetch("/x")).rejects.toBeInstanceOf(TmdbError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it(`faz no máximo ${MAX_CONCURRENT} pedidos ao mesmo tempo`, async () => {
    let active = 0;
    let peak = 0;
    const fetchMock = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return json({});
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all(Array.from({ length: 25 }, (_, i) => tmdbFetch(`/x/${i}`)));
    expect(peak).toBe(MAX_CONCURRENT);
    expect(fetchMock).toHaveBeenCalledTimes(25);
  });
});

describe("retryDelayMs", () => {
  it("usa Retry-After em segundos, limitado a 5 s, ou 500 ms por padrão", () => {
    expect(retryDelayMs("2")).toBe(2000);
    expect(retryDelayMs("60")).toBe(5000);
    expect(retryDelayMs(null)).toBe(500);
    expect(retryDelayMs("abc")).toBe(500);
  });
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/lib/tmdb/client.test.ts`
Esperado: FAIL com "Failed to resolve import ./client".

- [ ] **Passo 3: implementar**

Crie `src/lib/tmdb/client.ts`:

```ts
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
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/lib/tmdb/client.test.ts`
Esperado: PASS, 9 testes.

- [ ] **Passo 5: commit**

```bash
git add src/lib/tmdb/client.ts src/lib/tmdb/client.test.ts
git commit -m "feat: cliente do TMDB com token no servidor, cache, limite e nova tentativa" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 7: Funções de dados usadas pelas telas

**Arquivos:**
- Criar: `src/lib/tmdb/movies.ts`
- Testar: `src/lib/tmdb/movies.test.ts`

**Interfaces:**
- Consome:
  - `tmdbFetch`, `REVALIDATE`, `TmdbError` e `TmdbParams` (Tarefa 6);
  - os mappers (Tarefa 5);
  - `MAX_PAGE` (Tarefa 4);
  - a lista verificada de IDs (Tarefa 2).
- Produz:
  - **constantes:** `SUBSCRIPTION_PROVIDER_IDS: readonly number[]`, `PROVIDER_OPTIONS_LIMIT = 8`;
  - **funções:**
    - `getProviderOptions(): Promise<Provider[]>`
    - `getMovieProviders(id: number): Promise<Provider[]>`, que nunca lança erro e devolve `[]` se falhar
    - `discoverMovies(filters: DiscoverFilters, page?: number): Promise<Page<Movie>>`
    - `getGenreRow(genreId: number): Promise<Movie[]>`
    - `getFeatured(): Promise<Movie | null>`
    - `searchMovies(query: string, startPage?: number): Promise<Page<Movie>>`. Texto vazio devolve `{ items: [], page: 0, totalPages: 0 }`. A função varre até 3 páginas por chamada e devolve em `page` a última página lida.
    - `getMovieDetails(id: number): Promise<MovieDetails | null>`. Devolve `null` em 404; outros erros sobem.

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/lib/tmdb/movies.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { appleStore, disney, duna, dunaDetails, netflix, paged, prime, providersBr, semPoster } from "@/test/fixtures/tmdb";
import { REVALIDATE, TmdbError, tmdbFetch, type TmdbParams } from "./client";
import {
  discoverMovies,
  getFeatured,
  getGenreRow,
  getMovieDetails,
  getMovieProviders,
  getProviderOptions,
  PROVIDER_OPTIONS_LIMIT,
  searchMovies,
  SUBSCRIPTION_PROVIDER_IDS,
} from "./movies";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

type Call = { path: string; params: TmdbParams; revalidate?: number };
type Handler = (params: TmdbParams) => unknown;

const calls: Call[] = [];
const callsTo = (path: string) => calls.filter((c) => c.path === path);

/** Simula o TMDB: cada caminho tem uma resposta; caminho sem resposta = 404. */
function route(handlers: Record<string, Handler>) {
  vi.mocked(tmdbFetch).mockImplementation((async (path: string, params: TmdbParams = {}, revalidate?: number) => {
    calls.push({ path, params, revalidate });
    const handler = handlers[path];
    if (!handler) throw new TmdbError(404, `sem rota: ${path}`);
    const result = handler(params);
    if (result instanceof Error) throw result;
    return result;
  }) as typeof tmdbFetch);
}

const optionsRoute: Record<string, Handler> = {
  "/watch/providers/movie": () => ({ results: [prime, appleStore, netflix, disney] }),
};

beforeEach(() => {
  calls.length = 0;
  vi.mocked(tmdbFetch).mockReset();
});

describe("getProviderOptions", () => {
  it("mantém só assinaturas e ordena pela prioridade no Brasil", async () => {
    route(optionsRoute);
    expect(await getProviderOptions()).toEqual([
      { id: 8, name: "Netflix", logoPath: "/netflix.jpg" },
      { id: 119, name: "Amazon Prime Video", logoPath: "/prime.jpg" },
      { id: 337, name: "Disney Plus", logoPath: "/disney.jpg" },
    ]);
    const [call] = callsTo("/watch/providers/movie");
    expect(call.params).toMatchObject({ watch_region: "BR" });
    expect(call.revalidate).toBe(REVALIDATE.long);
  });

  it(`limita a ${PROVIDER_OPTIONS_LIMIT} opções`, async () => {
    const many = SUBSCRIPTION_PROVIDER_IDS.map((id, i) => ({
      provider_id: id, provider_name: `P${id}`, logo_path: `/p${id}.jpg`, display_priorities: { BR: i },
    }));
    route({ "/watch/providers/movie": () => ({ results: many }) });
    expect(await getProviderOptions()).toHaveLength(Math.min(PROVIDER_OPTIONS_LIMIT, SUBSCRIPTION_PROVIDER_IDS.length));
  });
});

describe("getMovieProviders", () => {
  it("falha vira lista vazia", async () => {
    route({});
    expect(await getMovieProviders(42)).toEqual([]);
  });
});

describe("discoverMovies", () => {
  it("sem streaming marcado usa a união das opções e busca os logos de cada filme", async () => {
    route({
      ...optionsRoute,
      "/discover/movie": () => paged([duna, semPoster], 1, 7),
      "/movie/693134/watch/providers": () => providersBr(netflix),
    });

    const result = await discoverMovies(DEFAULT_FILTERS);

    const [call] = callsTo("/discover/movie");
    expect(call.params).toMatchObject({
      watch_region: "BR",
      with_watch_monetization_types: "flatrate",
      with_watch_providers: "8|119|337",
      sort_by: "popularity.desc",
      page: 1,
    });
    expect(call.revalidate).toBe(REVALIDATE.short);
    expect(result).toMatchObject({ page: 1, totalPages: 7 });
    expect(result.items.map((m) => m.id)).toEqual([693134, 1]);
    expect(result.items[0].providers).toEqual([{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }]);
    expect(result.items[1].providers).toEqual([]); // falha nos logos não derruba o card
  });

  it("traduz todos os filtros para a consulta", async () => {
    route({ "/discover/movie": () => paged([]) });
    await discoverMovies({ providerIds: [8], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" }, 3);

    expect(callsTo("/watch/providers/movie")).toHaveLength(0);
    expect(callsTo("/discover/movie")[0].params).toMatchObject({
      with_watch_providers: "8",
      with_genres: 27,
      "primary_release_date.gte": "2000-01-01",
      "primary_release_date.lte": "2024-12-31",
      "vote_average.gte": 6.5,
      "vote_count.gte": 200,
      sort_by: "vote_average.desc",
      page: 3,
    });
  });

  it("ordenar por lançamento não exige mínimo de votos", async () => {
    route({ "/discover/movie": () => paged([]) });
    await discoverMovies({ ...DEFAULT_FILTERS, providerIds: [8], sort: "lancamento" });
    const params = callsTo("/discover/movie")[0].params;
    expect(params.sort_by).toBe("primary_release_date.desc");
    expect(params["vote_count.gte"]).toBeUndefined();
  });

  it("limita o total de páginas a 500", async () => {
    route({ "/discover/movie": () => paged([], 1, 9000) });
    expect((await discoverMovies({ ...DEFAULT_FILTERS, providerIds: [8] })).totalPages).toBe(500);
  });
});

describe("getGenreRow e getFeatured", () => {
  it("fileira de gênero ordenada por popularidade", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([duna]), "/movie/693134/watch/providers": () => providersBr(netflix) });
    const row = await getGenreRow(27);
    expect(row.map((m) => m.title)).toEqual(["Duna: Parte Dois"]);
    expect(callsTo("/discover/movie")[0].params).toMatchObject({ with_genres: 27, sort_by: "popularity.desc" });
  });

  it("destaque é o primeiro filme com imagem de fundo", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([semPoster, duna]) });
    expect((await getFeatured())?.id).toBe(693134);
  });

  it("sem imagem de fundo não há destaque", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([semPoster]) });
    expect(await getFeatured()).toBeNull();
  });
});

describe("searchMovies", () => {
  it("texto vazio não chama a API", async () => {
    route({});
    expect(await searchMovies("   ")).toEqual({ items: [], page: 0, totalPages: 0 });
    expect(calls).toHaveLength(0);
  });

  it("mostra só filmes disponíveis por assinatura", async () => {
    route({ "/search/movie": () => paged([duna, semPoster]), "/movie/693134/watch/providers": () => providersBr(netflix) });
    const result = await searchMovies("  duna ");
    expect(result.items.map((m) => m.id)).toEqual([693134]);
    expect(callsTo("/search/movie")[0].params).toMatchObject({ query: "duna", region: "BR", page: 1 });
  });

  it("procura na página seguinte quando a primeira não tem nada disponível", async () => {
    route({
      "/search/movie": (p) => (p.page === 1 ? paged([semPoster], 1, 5) : paged([duna], 2, 5)),
      "/movie/693134/watch/providers": () => providersBr(netflix),
    });
    const result = await searchMovies("duna");
    expect(result).toMatchObject({ page: 2, totalPages: 5 });
    expect(result.items.map((m) => m.id)).toEqual([693134]);
  });

  it("desiste após 3 páginas sem nada disponível", async () => {
    route({ "/search/movie": (p) => paged([semPoster], Number(p.page), 10) });
    expect(await searchMovies("raro")).toEqual({ items: [], page: 3, totalPages: 10 });
    expect(callsTo("/search/movie")).toHaveLength(3);
  });

  it("para na última página", async () => {
    route({ "/search/movie": () => paged([semPoster], 1, 1) });
    expect(await searchMovies("raro")).toEqual({ items: [], page: 1, totalPages: 1 });
    expect(callsTo("/search/movie")).toHaveLength(1);
  });

  it("continua de onde parou", async () => {
    route({ "/search/movie": (p) => paged([semPoster], Number(p.page), 10) });
    expect((await searchMovies("raro", 4)).page).toBe(6);
    expect(callsTo("/search/movie").map((c) => c.params.page)).toEqual([4, 5, 6]);
  });
});

describe("getMovieDetails", () => {
  it("busca filme, vídeos e streamings numa consulta só", async () => {
    route({ "/movie/693134": () => dunaDetails });
    expect(await getMovieDetails(693134)).toMatchObject({ id: 693134, runtime: 166, trailer: { key: "pt1" } });
    const [call] = callsTo("/movie/693134");
    expect(call.params).toMatchObject({ append_to_response: "videos,watch/providers", include_video_language: "pt,en" });
    expect(call.revalidate).toBe(REVALIDATE.long);
  });

  it("404 vira null", async () => {
    route({});
    expect(await getMovieDetails(42)).toBeNull();
  });

  it("outros erros sobem", async () => {
    route({ "/movie/42": () => new TmdbError(500, "fora do ar") });
    await expect(getMovieDetails(42)).rejects.toThrow("fora do ar");
  });
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/lib/tmdb/movies.test.ts`
Esperado: FAIL com "Failed to resolve import ./movies".

- [ ] **Passo 3: implementar**

Crie `src/lib/tmdb/movies.ts`. Em `SUBSCRIPTION_PROVIDER_IDS`, use **exatamente os IDs registrados** na tabela de `docs/superpowers/notes/2026-10-08-verificacao-tmdb.md` (Tarefa 2). A lista abaixo é o ponto de partida e deve ser corrigida se a verificação mostrou IDs diferentes. Ela precisa conter 8, 119 e 337, que os testes usam.

```ts
import "server-only";
import { MAX_PAGE } from "@/lib/filters";
import { REVALIDATE, TmdbError, tmdbFetch, type TmdbParams } from "./client";
import { mapBrFlatrate, mapMovie, mapMovieDetails, mapProvider } from "./mappers";
import type {
  DiscoverFilters,
  Movie,
  MovieDetails,
  Page,
  Provider,
  SortOption,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbPaged,
  TmdbProvider,
  TmdbWatchProviders,
} from "./types";

/** Streamings por assinatura no Brasil (verificados em docs/superpowers/notes/2026-10-08-verificacao-tmdb.md). */
export const SUBSCRIPTION_PROVIDER_IDS: readonly number[] = [8, 119, 337, 1899, 307, 350, 531, 283, 11, 227, 167, 47];
export const PROVIDER_OPTIONS_LIMIT = 8;

const MIN_VOTES_FOR_RATING_SORT = 200;
const MAX_SEARCH_PAGES_PER_CALL = 3;

const SORT_PARAM: Record<SortOption, string> = {
  popularidade: "popularity.desc",
  nota: "vote_average.desc",
  lancamento: "primary_release_date.desc",
};

const brPriority = (p: TmdbProvider) => p.display_priorities?.BR ?? p.display_priority ?? Number.MAX_SAFE_INTEGER;

export async function getProviderOptions(): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>("/watch/providers/movie", { watch_region: "BR" }, REVALIDATE.long);
  return data.results
    .filter((p) => SUBSCRIPTION_PROVIDER_IDS.includes(p.provider_id))
    .sort((a, b) => brPriority(a) - brPriority(b))
    .slice(0, PROVIDER_OPTIONS_LIMIT)
    .map(mapProvider);
}

export async function getMovieProviders(id: number): Promise<Provider[]> {
  try {
    const data = await tmdbFetch<TmdbWatchProviders>(`/movie/${id}/watch/providers`, {}, REVALIDATE.short);
    return mapBrFlatrate(data);
  } catch {
    return [];
  }
}

async function withProviders(movies: TmdbMovie[]): Promise<Movie[]> {
  return Promise.all(movies.map(async (m) => mapMovie(m, await getMovieProviders(m.id))));
}

async function effectiveProviderIds(filters: DiscoverFilters): Promise<number[]> {
  if (filters.providerIds.length > 0) return filters.providerIds;
  return (await getProviderOptions()).map((p) => p.id);
}

function discoverParams(filters: DiscoverFilters, providerIds: number[], page: number): TmdbParams {
  return {
    watch_region: "BR",
    with_watch_monetization_types: "flatrate",
    with_watch_providers: providerIds.join("|"),
    with_genres: filters.genreId ?? undefined,
    "primary_release_date.gte": filters.yearFrom ? `${filters.yearFrom}-01-01` : undefined,
    "primary_release_date.lte": filters.yearTo ? `${filters.yearTo}-12-31` : undefined,
    "vote_average.gte": filters.minRating ?? undefined,
    "vote_count.gte": filters.sort === "nota" ? MIN_VOTES_FOR_RATING_SORT : undefined,
    sort_by: SORT_PARAM[filters.sort],
    include_adult: "false",
    page,
  };
}

export async function discoverMovies(filters: DiscoverFilters, page = 1): Promise<Page<Movie>> {
  const providerIds = await effectiveProviderIds(filters);
  const data = await tmdbFetch<TmdbPaged<TmdbMovie>>("/discover/movie", discoverParams(filters, providerIds, page), REVALIDATE.short);
  return {
    items: await withProviders(data.results),
    page: data.page,
    totalPages: Math.min(data.total_pages, MAX_PAGE),
  };
}

const POPULAR: DiscoverFilters = {
  providerIds: [],
  genreId: null,
  yearFrom: null,
  yearTo: null,
  minRating: null,
  sort: "popularidade",
};

export async function getGenreRow(genreId: number): Promise<Movie[]> {
  return (await discoverMovies({ ...POPULAR, genreId })).items;
}

export async function getFeatured(): Promise<Movie | null> {
  return (await discoverMovies(POPULAR)).items.find((m) => m.backdropPath !== null) ?? null;
}

export async function searchMovies(query: string, startPage = 1): Promise<Page<Movie>> {
  const q = query.trim();
  if (!q) return { items: [], page: 0, totalPages: 0 };

  const items: Movie[] = [];
  let lastPage = startPage;
  let totalPages = 0;
  for (let page = startPage; page < startPage + MAX_SEARCH_PAGES_PER_CALL; page++) {
    const data = await tmdbFetch<TmdbPaged<TmdbMovie>>(
      "/search/movie",
      { query: q, region: "BR", include_adult: "false", page },
      REVALIDATE.short,
    );
    lastPage = page;
    totalPages = Math.min(data.total_pages, MAX_PAGE);
    items.push(...(await withProviders(data.results)).filter((m) => m.providers.length > 0));
    if (items.length > 0 || page >= totalPages) break;
  }
  return { items, page: lastPage, totalPages };
}

export async function getMovieDetails(id: number): Promise<MovieDetails | null> {
  try {
    const data = await tmdbFetch<TmdbMovieDetails>(
      `/movie/${id}`,
      { append_to_response: "videos,watch/providers", include_video_language: "pt,en" },
      REVALIDATE.long,
    );
    return mapMovieDetails(data);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/lib/tmdb/movies.test.ts`
Esperado: PASS, 19 testes.

- [ ] **Passo 5: rodar a suíte inteira e o typecheck**

Rode: `npm test && npm run typecheck`
Esperado: todos passam, sem erros de tipo.

- [ ] **Passo 6: commit**

```bash
git add src/lib/tmdb/movies.ts src/lib/tmdb/movies.test.ts
git commit -m "feat: funções de dados para destaque, fileiras, explorar, busca e detalhes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 8: Moldura do app (tema escuro, cabeçalho, rodapé e estados de tela)

**Arquivos:**
- Criar: `src/lib/site.ts`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/Skeletons.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, `public/tmdb-logo.svg`
- Modificar: `src/app/layout.tsx`, `src/app/globals.css`
- Testar: `src/components/Header.test.tsx`, `src/components/Footer.test.tsx`

**Interfaces:**
- Consome: nada do app, além de `APP_NAME` deste próprio arquivo.
- Produz:
  - **constantes:** `APP_NAME = "CineList"`, `APP_DESCRIPTION`, `TMDB_DISCLAIMER`;
  - **componentes:** `<Header />`, `<Footer />`, `<SkeletonGrid count?: number />`.

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/components/Header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({ usePathname: () => "/explorar" }));

it("tem os links principais, marca a página atual e envia a busca para /buscar", () => {
  render(<Header />);

  expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");

  const input = screen.getByRole("searchbox", { name: "Buscar filme" });
  expect(input).toHaveAttribute("name", "q");
  expect(input.closest("form")).toHaveAttribute("action", "/buscar");
});
```

Crie `src/components/Footer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Footer } from "./Footer";

it("mostra os créditos obrigatórios do TMDB e da JustWatch", () => {
  render(<Footer />);
  expect(screen.getByText("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.")).toBeInTheDocument();
  expect(screen.getByText(/Dados de streaming:/)).toHaveTextContent("Dados de streaming: JustWatch");
  expect(screen.getByRole("img", { name: "TMDB" })).toBeInTheDocument();
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/components/Header.test.tsx src/components/Footer.test.tsx`
Esperado: FAIL com "Failed to resolve import ./Header" e "./Footer".

- [ ] **Passo 3: baixar o logo do TMDB**

```bash
curl -fL -o public/tmdb-logo.svg "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
head -c 200 public/tmdb-logo.svg
```

Esperado: o arquivo começa com `<svg`. **Se o curl falhar (404) ou o arquivo não for SVG**, abra https://www.themoviedb.org/about/logos-attribution, baixe o logo "blue_short" em SVG e salve como `public/tmdb-logo.svg`.

- [ ] **Passo 4: implementar**

Crie `src/lib/site.ts`:

```ts
export const APP_NAME = "CineList";
export const APP_DESCRIPTION = "Descubra o que assistir: filmes disponíveis agora nos streamings por assinatura no Brasil.";
export const TMDB_DISCLAIMER = "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.";
```

Crie `src/components/Header.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/explorar", label: "Explorar" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-wide text-yellow-400">
          {APP_NAME}
        </Link>
        <nav aria-label="Principal" className="flex gap-4 text-sm">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={active ? "font-semibold text-white" : "text-zinc-400 hover:text-white"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/buscar" method="get" role="search" className="order-last w-full md:order-none md:ml-auto md:w-72">
          <input
            type="search"
            name="q"
            required
            aria-label="Buscar filme"
            placeholder="🔍 Buscar filme…"
            className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </form>
      </div>
    </header>
  );
}
```

Crie `src/components/Footer.tsx`:

```tsx
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
```

Crie `src/components/Skeletons.tsx`:

```tsx
export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando filmes" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" />
          <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
```

Substitua `src/app/globals.css` por:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}
```

Substitua `src/app/layout.tsx` por:

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: { default: `${APP_NAME}: o que assistir nos streamings`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100 antialiased">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

Crie `src/app/loading.tsx`:

```tsx
import { SkeletonGrid } from "@/components/Skeletons";

export default function Loading() {
  return <SkeletonGrid count={10} />;
}
```

Crie `src/app/error.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-zinc-400">Não conseguimos falar com o catálogo de filmes agora.</p>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        className="mt-6 rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300"
      >
        Tentar de novo
      </button>
    </div>
  );
}
```

Crie `src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link href="/" className="mt-6 inline-block text-yellow-400 hover:underline">
        Voltar para o Início
      </Link>
    </div>
  );
}
```

- [ ] **Passo 5: rodar e ver passar**

Rode: `npm test -- src/components/Header.test.tsx src/components/Footer.test.tsx`
Esperado: PASS, 2 testes.

- [ ] **Passo 6: verificar o build**

Rode: `npm run build && npm run lint`
Esperado: os dois terminam com código 0.

- [ ] **Passo 7: commit**

```bash
git add src/lib/site.ts src/components/Header.tsx src/components/Header.test.tsx src/components/Footer.tsx src/components/Footer.test.tsx src/components/Skeletons.tsx src/app/layout.tsx src/app/globals.css src/app/loading.tsx src/app/error.tsx src/app/not-found.tsx public/tmdb-logo.svg
git commit -m "feat: moldura com tema escuro, cabeçalho, rodapé e estados de tela" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 9: Logos dos streamings e card de filme

**Arquivos:**
- Criar: `src/components/ProviderLogos.tsx`, `src/components/MovieCard.tsx`, `src/test/fixtures/movies.ts`
- Testar: `src/components/ProviderLogos.test.tsx`, `src/components/MovieCard.test.tsx`

**Interfaces:**
- Consome: `Movie` e `Provider` (Tarefa 3); `formatRating` e `tmdbImage` (Tarefa 3).
- Produz:
  - `<ProviderLogos providers: Provider[] size?: "sm" | "md" max?: number className?: string />`. O padrão é `size="sm"` e `max=4`; sem streamings, não renderiza nada.
  - `<MovieCard movie: Movie />`, um link para `/filme/{id}` com um `h3` contendo o título.
  - **Fixtures em `@/test/fixtures/movies`:** `netflixProvider`, `primeProvider`, `makeMovie(over?)`.

- [ ] **Passo 1: criar os filmes de teste**

Crie `src/test/fixtures/movies.ts`:

```ts
import type { Movie, Provider } from "@/lib/tmdb/types";

export const netflixProvider: Provider = { id: 8, name: "Netflix", logoPath: "/netflix.jpg" };
export const primeProvider: Provider = { id: 119, name: "Amazon Prime Video", logoPath: "/prime.jpg" };

export function makeMovie(over: Partial<Movie> = {}): Movie {
  return {
    id: 693134,
    title: "Duna: Parte Dois",
    year: 2024,
    rating: 8.2,
    posterPath: "/duna.jpg",
    backdropPath: "/duna-bg.jpg",
    providers: [netflixProvider],
    ...over,
  };
}
```

- [ ] **Passo 2: escrever os testes (vão falhar)**

Crie `src/components/ProviderLogos.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { netflixProvider, primeProvider } from "@/test/fixtures/movies";
import { ProviderLogos } from "./ProviderLogos";

describe("ProviderLogos", () => {
  it("mostra cada logo com o nome do serviço como texto alternativo", () => {
    render(<ProviderLogos providers={[netflixProvider, primeProvider]} />);
    expect(screen.getByRole("img", { name: "Netflix" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amazon Prime Video" })).toBeInTheDocument();
  });

  it("resume o excesso com +N", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Serviço ${i + 1}`, logoPath: `/s${i}.jpg` }));
    render(<ProviderLogos providers={many} max={4} />);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("serviço sem logo aparece pelo nome", () => {
    render(<ProviderLogos providers={[{ id: 47, name: "Looke", logoPath: null }]} />);
    expect(screen.getByText("Looke")).toBeInTheDocument();
  });

  it("sem streamings não renderiza nada", () => {
    const { container } = render(<ProviderLogos providers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

Crie `src/components/MovieCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { MovieCard } from "./MovieCard";

describe("MovieCard", () => {
  it("leva aos detalhes e mostra pôster, título, ano, nota e logos", () => {
    render(<MovieCard movie={makeMovie()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/693134");
    expect(screen.getByRole("img", { name: "Pôster de Duna: Parte Dois" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Duna: Parte Dois" })).toBeInTheDocument();
    expect(screen.getByText("2024 · ★ 8.2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Netflix" })).toBeInTheDocument();
  });

  it("sem pôster mostra o título no lugar da imagem", () => {
    render(<MovieCard movie={makeMovie({ posterPath: null })} />);
    expect(screen.queryByRole("img", { name: /Pôster/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Duna: Parte Dois")).toHaveLength(2);
  });

  it("sem ano e sem nota mostra só um traço", () => {
    render(<MovieCard movie={makeMovie({ year: null, rating: 0, providers: [] })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Passo 3: rodar e ver falhar**

Rode: `npm test -- src/components/ProviderLogos.test.tsx src/components/MovieCard.test.tsx`
Esperado: FAIL com "Failed to resolve import ./ProviderLogos" e "./MovieCard".

- [ ] **Passo 4: implementar**

Crie `src/components/ProviderLogos.tsx`:

```tsx
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
              <Image src={logo} alt={p.name} title={p.name} width={px} height={px} className={size === "sm" ? "rounded" : "rounded-lg"} />
            ) : (
              <span className="rounded bg-zinc-700 px-1 text-[10px]">{p.name}</span>
            )}
          </li>
        );
      })}
      {extra > 0 && <li className="rounded bg-black/70 px-1 text-[10px] font-semibold">+{extra}</li>}
    </ul>
  );
}
```

Crie `src/components/MovieCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatRating, tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { ProviderLogos } from "./ProviderLogos";

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = tmdbImage(movie.posterPath, "w342");
  const meta = [movie.year ?? "—", movie.rating > 0 ? `★ ${formatRating(movie.rating)}` : null].filter(Boolean).join(" · ");

  return (
    <Link href={`/filme/${movie.id}`} className="group block focus:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800 ring-yellow-400 transition group-hover:scale-[1.03] group-focus-visible:ring-2">
        {poster ? (
          <Image src={poster} alt={`Pôster de ${movie.title}`} fill sizes="(max-width: 768px) 45vw, 200px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-zinc-300">{movie.title}</div>
        )}
        <ProviderLogos providers={movie.providers} className="absolute bottom-1.5 left-1.5" />
      </div>
      <h3 className="mt-2 truncate text-sm font-medium">{movie.title}</h3>
      <p className="text-xs text-zinc-400">{meta}</p>
    </Link>
  );
}
```

- [ ] **Passo 5: rodar e ver passar**

Rode: `npm test -- src/components/ProviderLogos.test.tsx src/components/MovieCard.test.tsx`
Esperado: PASS, 7 testes.

- [ ] **Passo 6: commit**

```bash
git add src/components/ProviderLogos.tsx src/components/ProviderLogos.test.tsx src/components/MovieCard.tsx src/components/MovieCard.test.tsx src/test/fixtures/movies.ts
git commit -m "feat: card de filme com pôster, nota e logos dos streamings" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 10: Tela Início (destaque e fileiras de gênero)

**Arquivos:**
- Criar: `src/components/MovieRow.tsx`, `src/components/Hero.tsx`
- Modificar: `src/app/page.tsx`
- Testar: `src/components/MovieRow.test.tsx`, `src/components/Hero.test.tsx`

**Interfaces:**
- Consome:
  - `MovieCard` e `ProviderLogos` (Tarefa 9);
  - `getFeatured` e `getGenreRow` (Tarefa 7);
  - `HOME_GENRES` (Tarefa 3);
  - `formatRating` e `tmdbImage` (Tarefa 3).
- Produz:
  - `<MovieRow title: string href: string movies: Movie[] />`: uma `section` com nome acessível igual ao título, o link "Ver todos de {título}" e nada quando a lista está vazia;
  - `<Hero movie: Movie />`: uma `section` "Destaque" com `h1` e o link "Ver detalhes".

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/components/MovieRow.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { MovieRow } from "./MovieRow";

describe("MovieRow", () => {
  it("mostra o título, o link para ver todos e um card por filme", () => {
    render(
      <MovieRow
        title="Ficção científica"
        href="/explorar?genero=878"
        movies={[makeMovie({ id: 1, title: "A" }), makeMovie({ id: 2, title: "B" })]}
      />,
    );
    const region = screen.getByRole("region", { name: "Ficção científica" });
    expect(within(region).getByRole("link", { name: "Ver todos de Ficção científica" })).toHaveAttribute("href", "/explorar?genero=878");
    expect(within(region).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["A", "B"]);
  });

  it("sem filmes não renderiza nada", () => {
    const { container } = render(<MovieRow title="Terror" href="/explorar?genero=27" movies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

Crie `src/components/Hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { Hero } from "./Hero";

it("destaca o filme com título, informações e link para os detalhes", () => {
  render(<Hero movie={makeMovie()} />);
  const region = screen.getByRole("region", { name: "Destaque" });
  expect(region).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Duna: Parte Dois" })).toBeInTheDocument();
  expect(screen.getByText("2024 · ★ 8.2")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute("href", "/filme/693134");
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/components/MovieRow.test.tsx src/components/Hero.test.tsx`
Esperado: FAIL com "Failed to resolve import ./MovieRow" e "./Hero".

- [ ] **Passo 3: implementar os componentes**

Crie `src/components/MovieRow.tsx`:

```tsx
import Link from "next/link";
import type { Movie } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

type Props = { title: string; href: string; movies: Movie[] };

function slug(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
}

export function MovieRow({ title, href, movies }: Props) {
  if (movies.length === 0) return null;
  const headingId = `fileira-${slug(title)}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id={headingId} className="text-lg font-semibold md:text-xl">
          {title}
        </h2>
        <Link href={href} aria-label={`Ver todos de ${title}`} className="text-sm text-zinc-400 hover:text-yellow-400">
          ver tudo ›
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
        {movies.map((movie) => (
          <li key={movie.id} className="w-36 shrink-0 snap-start md:w-44">
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Crie `src/components/Hero.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatRating, tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { ProviderLogos } from "./ProviderLogos";

export function Hero({ movie }: { movie: Movie }) {
  const backdrop = tmdbImage(movie.backdropPath, "w1280");
  const meta = [movie.year, movie.rating > 0 ? `★ ${formatRating(movie.rating)}` : null].filter(Boolean).join(" · ");

  return (
    <section aria-label="Destaque" className="relative overflow-hidden rounded-2xl bg-zinc-900">
      {backdrop && <Image src={backdrop} alt="" fill loading="eager" sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="relative flex min-h-[260px] flex-col justify-end gap-3 p-6 md:min-h-[420px] md:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Em destaque</p>
        <h1 className="max-w-2xl text-3xl font-bold md:text-5xl">{movie.title}</h1>
        <p className="text-sm text-zinc-300">{meta}</p>
        <ProviderLogos providers={movie.providers} size="md" />
        <Link
          href={`/filme/${movie.id}`}
          className="w-fit rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/components/MovieRow.test.tsx src/components/Hero.test.tsx`
Esperado: PASS, 3 testes.

- [ ] **Passo 5: montar a tela Início**

Substitua `src/app/page.tsx` por:

```tsx
import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { HOME_GENRES } from "@/lib/genres";
import { getFeatured, getGenreRow } from "@/lib/tmdb/movies";

// A Início é gerada no servidor e renovada a cada 6 horas.
export const revalidate = 21600;

export default async function HomePage() {
  const rowsPromise = Promise.allSettled(HOME_GENRES.map((genre) => getGenreRow(genre.id)));
  const [featuredResult] = await Promise.allSettled([getFeatured()]);
  const rowResults = await rowsPromise;

  // Só mostramos a tela de erro se nada carregou; uma fileira com falha apenas some.
  if (featuredResult.status === "rejected" && rowResults.every((r) => r.status === "rejected")) {
    throw featuredResult.reason;
  }
  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : null;

  return (
    <div className="space-y-10">
      {featured && <Hero movie={featured} />}
      {HOME_GENRES.map((genre, i) => {
        const result = rowResults[i];
        return result.status === "fulfilled" ? (
          <MovieRow key={genre.id} title={genre.name} href={`/explorar?genero=${genre.id}`} movies={result.value} />
        ) : null;
      })}
    </div>
  );
}
```

- [ ] **Passo 6: ver no navegador**

Rode `npm run dev` em segundo plano e abra http://localhost:3000.
Esperado:
- um destaque grande no topo;
- 10 fileiras de gênero, na ordem Ação … Aventura, que deslizam para o lado;
- logos dos streamings nos pôsteres.

No celular, ou com a janela estreita, as fileiras deslizam com o dedo ou a rolagem. Encerre o servidor depois de conferir.

- [ ] **Passo 7: verificar o build e commit**

Rode: `npm run build`
Esperado: o build termina com código 0 e gera a Início com os dados do TMDB (o token precisa estar no `.env.local`).

```bash
git add src/components/MovieRow.tsx src/components/MovieRow.test.tsx src/components/Hero.tsx src/components/Hero.test.tsx src/app/page.tsx
git commit -m "feat: tela Início com destaque e fileiras por gênero" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 11: Página de detalhes do filme

**Arquivos:**
- Criar: `src/components/TrailerPlayer.tsx`, `src/components/BackLink.tsx`, `src/app/filme/[id]/page.tsx`, `src/app/filme/[id]/not-found.tsx`
- Testar: `src/components/TrailerPlayer.test.tsx`

**Interfaces:**
- Consome:
  - `getMovieDetails` (Tarefa 7);
  - `parseMovieId` (Tarefa 4);
  - `ProviderLogos` (Tarefa 9);
  - `formatRating`, `formatRuntime` e `tmdbImage` (Tarefa 3);
  - `APP_NAME` (Tarefa 8).
- Produz:
  - `<TrailerPlayer trailer: Trailer title: string />`: um botão "Assistir ao trailer de {title}" que, ao ser clicado, vira um iframe de `youtube-nocookie.com`;
  - `<BackLink />`: o botão "← Voltar".

- [ ] **Passo 1: escrever o teste (vai falhar)**

Crie `src/components/TrailerPlayer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { TrailerPlayer } from "./TrailerPlayer";

it("só carrega o YouTube depois do clique", async () => {
  const { container } = render(<TrailerPlayer trailer={{ key: "pt1", name: "Trailer" }} title="Duna" />);
  expect(container.querySelector("iframe")).toBeNull();

  await userEvent.click(screen.getByRole("button", { name: "Assistir ao trailer de Duna" }));

  const iframe = screen.getByTitle("Trailer de Duna");
  expect(iframe.tagName).toBe("IFRAME");
  expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/pt1?autoplay=1");
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/components/TrailerPlayer.test.tsx`
Esperado: FAIL com "Failed to resolve import ./TrailerPlayer".

- [ ] **Passo 3: implementar os componentes**

Crie `src/components/TrailerPlayer.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { Trailer } from "@/lib/tmdb/types";

export function TrailerPlayer({ trailer, title }: { trailer: Trailer; title: string }) {
  const [playing, setPlaying] = useState(false);
  const key = encodeURIComponent(trailer.key);

  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-xl"
        src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1`}
        title={`Trailer de ${title}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Assistir ao trailer de ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-zinc-900"
    >
      <Image
        src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-cover opacity-80 transition group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl text-zinc-950"
      >
        ▶
      </span>
    </button>
  );
}
```

Crie `src/components/BackLink.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="text-sm text-zinc-400 hover:text-white"
    >
      ← Voltar
    </button>
  );
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/components/TrailerPlayer.test.tsx`
Esperado: PASS, 1 teste.

- [ ] **Passo 5: montar a página de detalhes**

Crie `src/app/filme/[id]/page.tsx`:

```tsx
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
```

Crie `src/app/filme/[id]/not-found.tsx`:

```tsx
import Link from "next/link";

export default function MovieNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <p className="mt-2 text-zinc-400">O link pode estar errado ou o filme saiu do catálogo.</p>
      <Link href="/" className="mt-6 inline-block text-yellow-400 hover:underline">
        Voltar para o Início
      </Link>
    </div>
  );
}
```

- [ ] **Passo 6: ver no navegador**

Rode `npm run dev` e confira:
- clicar num card da Início abre `/filme/<id>` com pôster, título, ano, sinopse, nota, duração, "Onde assistir" com os logos e o trailer como capa com ▶;
- clicar no ▶ toca o vídeo;
- "← Voltar" retorna à Início;
- `/filme/abc` e `/filme/999999999` mostram "Filme não encontrado".

Encerre o servidor depois de conferir.

- [ ] **Passo 7: commit**

```bash
git add src/components/TrailerPlayer.tsx src/components/TrailerPlayer.test.tsx src/components/BackLink.tsx "src/app/filme/[id]/page.tsx" "src/app/filme/[id]/not-found.tsx"
git commit -m "feat: página de detalhes com onde assistir e trailer sob demanda" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 12: Grade com "Carregar mais" e Server Actions

**Arquivos:**
- Criar: `src/components/MovieGrid.tsx`, `src/components/PaginatedMovieGrid.tsx`, `src/app/actions.ts`
- Testar: `src/components/PaginatedMovieGrid.test.tsx`

**Interfaces:**
- Consome:
  - `MovieCard` (Tarefa 9);
  - `discoverMovies` e `searchMovies` (Tarefa 7);
  - `parseFilters` e `parsePage` (Tarefa 4).
- Produz:
  - `<MovieGrid movies: Movie[] />`, uma `ul` com `aria-label="Filmes"`;
  - `<PaginatedMovieGrid initial: Page<Movie> loadPage: (page: number) => Promise<Page<Movie>> />`;
  - **Server Actions:** `loadMoreDiscover(query: string, page: number): Promise<Page<Movie>>` e `loadMoreSearch(q: string, page: number): Promise<Page<Movie>>`.

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/components/PaginatedMovieGrid.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Movie, Page } from "@/lib/tmdb/types";
import { makeMovie } from "@/test/fixtures/movies";
import { PaginatedMovieGrid } from "./PaginatedMovieGrid";

function pageOf(ids: number[], page: number, totalPages: number): Page<Movie> {
  return { items: ids.map((id) => makeMovie({ id, title: `Filme ${id}` })), page, totalPages };
}

const titles = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("PaginatedMovieGrid", () => {
  it("mostra a primeira página e acrescenta a próxima ao clicar", async () => {
    const loadPage = vi.fn().mockResolvedValue(pageOf([3, 4], 2, 2));
    render(<PaginatedMovieGrid initial={pageOf([1, 2], 1, 2)} loadPage={loadPage} />);
    expect(titles()).toEqual(["Filme 1", "Filme 2"]);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(loadPage).toHaveBeenCalledWith(2);
    expect(await screen.findByText("Filme 4")).toBeInTheDocument();
    expect(titles()).toEqual(["Filme 1", "Filme 2", "Filme 3", "Filme 4"]);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("não repete filmes que já estão na grade", async () => {
    const loadPage = vi.fn().mockResolvedValue(pageOf([2, 3], 2, 3));
    render(<PaginatedMovieGrid initial={pageOf([1, 2], 1, 3)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Filme 3")).toBeInTheDocument();
    expect(titles()).toEqual(["Filme 1", "Filme 2", "Filme 3"]);
    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();
  });

  it("faz um pedido por vez mesmo com cliques repetidos", async () => {
    let resolve!: (page: Page<Movie>) => void;
    const loadPage = vi.fn(() => new Promise<Page<Movie>>((r) => (resolve = r)));
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 3)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    const busy = screen.getByRole("button", { name: "Carregando…" });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(loadPage).toHaveBeenCalledTimes(1);

    await act(async () => resolve(pageOf([2], 2, 3)));
    expect(screen.getByText("Filme 2")).toBeInTheDocument();
  });

  it("mostra erro e deixa tentar de novo", async () => {
    const loadPage = vi.fn().mockRejectedValueOnce(new Error("rede")).mockResolvedValueOnce(pageOf([2], 2, 2));
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 2)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar mais filmes. Tente de novo.");

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByText("Filme 2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sem botão quando já está na última página", () => {
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 1)} loadPage={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/components/PaginatedMovieGrid.test.tsx`
Esperado: FAIL com "Failed to resolve import ./PaginatedMovieGrid".

- [ ] **Passo 3: implementar**

Crie `src/components/MovieGrid.tsx`:

```tsx
import type { Movie } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

export function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <ul aria-label="Filmes" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}
```

Crie `src/components/PaginatedMovieGrid.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import type { Movie, Page } from "@/lib/tmdb/types";
import { MovieGrid } from "./MovieGrid";

type Props = {
  initial: Page<Movie>;
  loadPage: (page: number) => Promise<Page<Movie>>;
};

export function PaginatedMovieGrid({ initial, loadPage }: Props) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const busy = useRef(false);

  async function loadMore() {
    if (busy.current) return;
    busy.current = true;
    setStatus("loading");
    try {
      const next = await loadPage(page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...next.items.filter((m) => !seen.has(m.id))];
      });
      setPage(next.page);
      setTotalPages(next.totalPages);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <MovieGrid movies={items} />
      {status === "error" && (
        <p role="alert" className="text-center text-sm text-red-400">
          Não foi possível carregar mais filmes. Tente de novo.
        </p>
      )}
      {page < totalPages && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loading"}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-semibold hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50"
          >
            {status === "loading" ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
```

Crie `src/app/actions.ts`:

```ts
"use server";

import { parseFilters, parsePage } from "@/lib/filters";
import { discoverMovies, searchMovies } from "@/lib/tmdb/movies";
import type { Movie, Page } from "@/lib/tmdb/types";

// Server Actions são endpoints públicos: valide tudo o que chega.
function requirePage(page: number): number {
  const valid = parsePage(page);
  if (valid === null) throw new Error("Página inválida");
  return valid;
}

export async function loadMoreDiscover(query: string, page: number): Promise<Page<Movie>> {
  const filters = parseFilters(Object.fromEntries(new URLSearchParams(query)));
  return discoverMovies(filters, requirePage(page));
}

export async function loadMoreSearch(q: string, page: number): Promise<Page<Movie>> {
  return searchMovies(q, requirePage(page));
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/components/PaginatedMovieGrid.test.tsx`
Esperado: PASS, 5 testes.

- [ ] **Passo 5: commit**

```bash
git add src/components/MovieGrid.tsx src/components/PaginatedMovieGrid.tsx src/components/PaginatedMovieGrid.test.tsx src/app/actions.ts
git commit -m "feat: grade com carregar mais sem duplicatas e Server Actions de paginação" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 13: Tela Explorar com filtros

**Arquivos:**
- Criar: `src/components/FiltersPanel.tsx`, `src/app/explorar/page.tsx`
- Testar: `src/components/FiltersPanel.test.tsx`

**Interfaces:**
- Consome:
  - `serializeFilters`, `parseFilters`, `DEFAULT_FILTERS`, `SORT_OPTIONS`, `MIN_YEAR` e `SearchParamsInput` (Tarefa 4);
  - `ALL_GENRES` (Tarefa 3);
  - `getProviderOptions` e `discoverMovies` (Tarefa 7);
  - `PaginatedMovieGrid` e `loadMoreDiscover` (Tarefa 12).
- Produz: `<FiltersPanel providers: Provider[] genres: Genre[] filters: DiscoverFilters currentYear: number />`. Cada mudança chama `router.replace("<pathname>?<query>", { scroll: false })`, ou só o `pathname` quando todos os filtros estão no padrão.

- [ ] **Passo 1: escrever os testes (vão falhar)**

Crie `src/components/FiltersPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { ALL_GENRES } from "@/lib/genres";
import type { DiscoverFilters } from "@/lib/tmdb/types";
import { netflixProvider, primeProvider } from "@/test/fixtures/movies";
import { FiltersPanel } from "./FiltersPanel";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/explorar" }));

function renderPanel(filters: Partial<DiscoverFilters> = {}) {
  render(
    <FiltersPanel
      providers={[netflixProvider, primeProvider]}
      genres={ALL_GENRES}
      filters={{ ...DEFAULT_FILTERS, ...filters }}
      currentYear={2026}
    />,
  );
}

beforeEach(() => replace.mockClear());

describe("FiltersPanel", () => {
  it("marcar um streaming coloca no link", async () => {
    renderPanel();
    const netflix = screen.getByRole("button", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(netflix);
    expect(replace).toHaveBeenCalledWith("/explorar?streaming=8", { scroll: false });
  });

  it("marcar um segundo streaming mantém o primeiro", async () => {
    renderPanel({ providerIds: [8] });
    await userEvent.click(screen.getByRole("button", { name: "Amazon Prime Video" }));
    expect(replace).toHaveBeenCalledWith("/explorar?streaming=8%2C119", { scroll: false });
  });

  it("desmarcar o único streaming volta ao link limpo", async () => {
    renderPanel({ providerIds: [8] });
    const netflix = screen.getByRole("button", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(netflix);
    expect(replace).toHaveBeenCalledWith("/explorar", { scroll: false });
  });

  it("gênero, anos, nota e ordenação viram parâmetros do link", async () => {
    renderPanel();
    await userEvent.selectOptions(screen.getByLabelText("Gênero"), "27");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ano de"), "2000");
    expect(replace).toHaveBeenLastCalledWith("/explorar?de=2000", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ano até"), "2024");
    expect(replace).toHaveBeenLastCalledWith("/explorar?ate=2024", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Nota mínima"), "6.5");
    expect(replace).toHaveBeenLastCalledWith("/explorar?nota=6.5", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "nota");
    expect(replace).toHaveBeenLastCalledWith("/explorar?ordem=nota", { scroll: false });
  });

  it("mostra os valores atuais selecionados", () => {
    renderPanel({ genreId: 27, yearFrom: 2000, minRating: 7, sort: "lancamento" });
    expect(screen.getByLabelText("Gênero")).toHaveValue("27");
    expect(screen.getByLabelText("Ano de")).toHaveValue("2000");
    expect(screen.getByLabelText("Nota mínima")).toHaveValue("7");
    expect(screen.getByLabelText("Ordenar por")).toHaveValue("lancamento");
  });

  it("limpar filtros volta ao link limpo", async () => {
    renderPanel({ genreId: 27, sort: "nota" });
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(replace).toHaveBeenCalledWith("/explorar", { scroll: false });
  });
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npm test -- src/components/FiltersPanel.test.tsx`
Esperado: FAIL com "Failed to resolve import ./FiltersPanel".

- [ ] **Passo 3: implementar o painel**

Crie `src/components/FiltersPanel.tsx`:

```tsx
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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

const selectClass = "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-zinc-400";

const toNumberOrNull = (value: string) => (value === "" ? null : Number(value));

export function FiltersPanel({ providers, genres, filters, currentYear }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const years = Array.from({ length: currentYear + 1 - MIN_YEAR + 1 }, (_, i) => currentYear + 1 - i);

  function apply(next: DiscoverFilters) {
    const query = serializeFilters(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleProvider(id: number) {
    const selected = filters.providerIds.includes(id);
    apply({
      ...filters,
      providerIds: selected ? filters.providerIds.filter((p) => p !== id) : [...filters.providerIds, id],
    });
  }

  return (
    <aside className="md:w-64 md:shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="painel-filtros"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold md:hidden"
      >
        ⚙ Filtros
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
                  className={`overflow-hidden rounded-lg transition ${active ? "ring-2 ring-yellow-400" : "opacity-50 hover:opacity-100"}`}
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

        <button type="button" onClick={() => apply(DEFAULT_FILTERS)} className="text-sm text-zinc-400 underline hover:text-white">
          Limpar filtros
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Passo 4: rodar e ver passar**

Rode: `npm test -- src/components/FiltersPanel.test.tsx`
Esperado: PASS, 6 testes.

- [ ] **Passo 5: montar a tela Explorar**

Crie `src/app/explorar/page.tsx`:

```tsx
import type { Metadata } from "next";
import { loadMoreDiscover } from "@/app/actions";
import { FiltersPanel } from "@/components/FiltersPanel";
import { PaginatedMovieGrid } from "@/components/PaginatedMovieGrid";
import { parseFilters, serializeFilters, type SearchParamsInput } from "@/lib/filters";
import { ALL_GENRES } from "@/lib/genres";
import { discoverMovies, getProviderOptions } from "@/lib/tmdb/movies";

export const metadata: Metadata = { title: "Explorar" };

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function ExplorarPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const query = serializeFilters(filters);
  const [providers, firstPage] = await Promise.all([getProviderOptions(), discoverMovies(filters, 1)]);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-10">
      <FiltersPanel providers={providers} genres={ALL_GENRES} filters={filters} currentYear={new Date().getFullYear()} />
      <section className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold">Explorar</h1>
        {firstPage.items.length === 0 ? (
          <p className="text-zinc-400">Nenhum filme encontrado com esses filtros.</p>
        ) : (
          <PaginatedMovieGrid key={query} initial={firstPage} loadPage={loadMoreDiscover.bind(null, query)} />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Passo 6: ver no navegador**

Rode `npm run dev` e confira em http://localhost:3000/explorar:
- os logos dos streamings aparecem no painel, no máximo 8, e marcar um muda o link (`?streaming=…`) e a grade;
- gênero, anos, nota e ordenação funcionam;
- "Carregar mais" acrescenta 20 filmes;
- "ver tudo ›" de uma fileira da Início abre o Explorar com o gênero marcado;
- `/explorar?streaming=abc&nota=99&ordem=x` abre normalmente, com os filtros no padrão;
- com a janela estreita, os filtros ficam escondidos atrás do botão "⚙ Filtros".

Encerre o servidor depois de conferir.

- [ ] **Passo 7: commit**

```bash
git add src/components/FiltersPanel.tsx src/components/FiltersPanel.test.tsx src/app/explorar/page.tsx
git commit -m "feat: tela Explorar com filtros no link e carregar mais" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 14: Tela de busca

**Arquivos:**
- Criar: `src/app/buscar/page.tsx`

**Interfaces:**
- Consome:
  - `searchMovies` (Tarefa 7);
  - `PaginatedMovieGrid` e `loadMoreSearch` (Tarefa 12);
  - `SearchParamsInput` (Tarefa 4).
- Produz: a rota `/buscar?q=…`.

As regras de busca já estão testadas na Tarefa 7 e a grade na Tarefa 12. Esta tarefa só liga as peças, e a verificação fica no navegador (e no E2E da Tarefa 15).

- [ ] **Passo 1: implementar**

Crie `src/app/buscar/page.tsx`:

```tsx
import type { Metadata } from "next";
import { loadMoreSearch } from "@/app/actions";
import { PaginatedMovieGrid } from "@/components/PaginatedMovieGrid";
import type { SearchParamsInput } from "@/lib/filters";
import { searchMovies } from "@/lib/tmdb/movies";

export const metadata: Metadata = { title: "Buscar" };

const MAX_QUERY_LENGTH = 100;

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function BuscarPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, MAX_QUERY_LENGTH);

  if (!q) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Buscar filme</h1>
        <p className="mt-2 text-zinc-400">Digite o nome de um filme no campo de busca lá em cima.</p>
      </div>
    );
  }

  const firstPage = await searchMovies(q, 1);
  const nothingAvailable = firstPage.items.length === 0 && firstPage.page >= firstPage.totalPages;

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Resultados para “{q}”</h1>
      {nothingAvailable ? (
        <p className="text-zinc-400">Nenhum filme com esse nome está disponível nos streamings agora.</p>
      ) : (
        <PaginatedMovieGrid key={q} initial={firstPage} loadPage={loadMoreSearch.bind(null, q)} />
      )}
    </section>
  );
}
```

- [ ] **Passo 2: ver no navegador**

Rode `npm run dev` e, pelo campo de busca do cabeçalho, procure o título de um filme que aparece na Início.
Esperado:
- abre `/buscar?q=…` e o filme aparece com os logos;
- buscar "xyzxyzxyz" mostra "Nenhum filme com esse nome está disponível nos streamings agora.";
- `/buscar` sem texto mostra o convite para digitar.

Encerre o servidor depois de conferir.

- [ ] **Passo 3: rodar todas as verificações**

Rode: `npm test && npm run typecheck && npm run lint && npm run build`
Esperado: tudo termina com código 0.

- [ ] **Passo 4: commit**

```bash
git add src/app/buscar/page.tsx
git commit -m "feat: tela de busca mostrando só filmes disponíveis nos streamings" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 15: Testes de ponta a ponta (Playwright)

**Arquivos:**
- Criar: `playwright.config.ts`, `e2e/catalogo.spec.ts`
- Modificar: `package.json` (script `e2e`)

**Interfaces:**
- Consome: o app inteiro, rodando com `npm run dev` e o token real em `.env.local`.
- Produz: o script `npm run e2e`.

- [ ] **Passo 1: instalar o Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
npm pkg set "scripts.e2e=playwright test"
```

Esperado: o Chromium é baixado sem erro.

- [ ] **Passo 2: configurar**

Crie `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Passo 3: escrever os testes**

Crie `e2e/catalogo.spec.ts`:

```ts
import { expect, test, type Locator, type Page } from "@playwright/test";

const cardsIn = (scope: Page | Locator) => scope.locator('a[href^="/filme/"]');

test("Início mostra fileiras de gênero com filmes", async ({ page }) => {
  await page.goto("/");
  const acao = page.getByRole("region", { name: "Ação" });
  await expect(acao).toBeVisible();
  await expect(cardsIn(acao).first()).toBeVisible();
});

test("card abre os detalhes e Voltar retorna", async ({ page }) => {
  await page.goto("/");
  await cardsIn(page.getByRole("region", { name: "Ação" })).first().click();
  await expect(page).toHaveURL(/\/filme\/\d+$/);
  await expect(page.getByRole("heading", { name: "Onde assistir" })).toBeVisible();
  await page.getByRole("button", { name: "← Voltar" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("filme inexistente mostra página amigável", async ({ page }) => {
  await page.goto("/filme/abc");
  await expect(page.getByRole("heading", { name: "Filme não encontrado" })).toBeVisible();
});

test("Explorar: filtro de gênero muda o link e carregar mais traz mais filmes", async ({ page }) => {
  await page.goto("/explorar");
  await page.getByLabel("Gênero").selectOption({ label: "Terror" });
  await expect(page).toHaveURL(/genero=27/);

  const grid = page.getByRole("list", { name: "Filmes" });
  await expect(cardsIn(grid).first()).toBeVisible();
  const before = await cardsIn(grid).count();
  await page.getByRole("button", { name: "Carregar mais" }).click();
  await expect.poll(() => cardsIn(grid).count()).toBeGreaterThan(before);
});

test("Busca encontra um filme visto na Início", async ({ page }) => {
  await page.goto("/");
  const firstTitle = page.getByRole("region", { name: "Comédia" }).getByRole("heading", { level: 3 }).first();
  const title = ((await firstTitle.textContent()) ?? "").trim();
  expect(title).not.toBe("");

  const search = page.getByRole("searchbox", { name: "Buscar filme" });
  await search.fill(title);
  await search.press("Enter");

  await expect(page).toHaveURL(/\/buscar\?q=/);
  await expect(page.locator('a[href^="/filme/"]', { hasText: title }).first()).toBeVisible();
});
```

- [ ] **Passo 4: rodar**

Rode: `npm run e2e`
Esperado: 5 testes passando. A primeira abertura da Início pode levar alguns segundos, porque o cache ainda está vazio.

Se algum teste falhar, use a skill superpowers:systematic-debugging antes de mudar qualquer código. O relatório fica em `test-results/`.

- [ ] **Passo 5: commit**

```bash
git add playwright.config.ts e2e/catalogo.spec.ts package.json package-lock.json
git commit -m "test: testes de ponta a ponta da Início, detalhes, Explorar e busca" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 16: README, verificação final e publicação na Vercel (guiada)

**Arquivos:**
- Modificar: `README.md`, que substitui o README gerado pelo `create-next-app`.

**Interfaces:**
- Consome: o app completo.
- Produz: o link público do site, registrado no README.

- [ ] **Passo 1: escrever o README do portfólio**

Substitua `README.md` por:

````markdown
# CineList

Catálogo para **descobrir o que assistir**: os filmes disponíveis agora nos streamings **por assinatura no Brasil** (Netflix, Prime Video, Max, Disney+, Globoplay…), com visual de vitrine e tema escuro.

## Funcionalidades

- **Início:** filme em destaque + 10 fileiras por gênero (Ação, Comédia, Drama, Terror…), cada uma com os logos dos streamings onde o filme está.
- **Explorar:** grade com filtros por streaming, gênero, ano, nota mínima e ordenação, todos guardados no link (dá para compartilhar uma busca como "terror na Netflix").
- **Busca:** encontra filmes pelo nome, mostrando só os disponíveis nos streamings.
- **Detalhes:** sinopse, nota, duração, onde assistir e trailer (o YouTube só carrega quando você clica).

## Tecnologias

- [Next.js](https://nextjs.org) (App Router, Server Components e Server Actions) + React + TypeScript
- Tailwind CSS
- Vitest + Testing Library (unidade e componentes) e Playwright (ponta a ponta)
- Dados: API do [TMDB](https://www.themoviedb.org), disponibilidade nos streamings pela [JustWatch](https://www.justwatch.com)

## Arquitetura em 30 segundos

- As páginas são montadas **no servidor**. O token do TMDB nunca chega ao navegador.
- `src/lib/tmdb/client.ts` é a única peça que fala com o TMDB. Ela cuida de cache (6 h e 24 h), no máximo 10 pedidos simultâneos e uma nova tentativa em caso de falha.
- `src/lib/tmdb/movies.ts` entrega dados prontos para as telas, e os componentes recebem tipos do app sem saber que o TMDB existe.

## Como rodar

Requisitos: Node.js 24+ e um **API Read Access Token** do TMDB (gratuito, em https://www.themoviedb.org/settings/api).

```bash
npm install
cp .env.example .env.local   # depois cole o seu token no .env.local
npm run dev                  # http://localhost:3000
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes de unidade e componentes |
| `npm run e2e` | testes de ponta a ponta (precisa do token) |
| `npm run typecheck` | checagem de tipos (rode `npm run build` uma vez antes) |
| `npm run lint` | lint |
| `npm run build` | build de produção |

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Dados de streaming: JustWatch.
````

- [ ] **Passo 2: verificação final completa**

Rode: `npm test && npm run typecheck && npm run lint && npm run build && npm run e2e`
Esperado: tudo termina com código 0. **Se algo falhar, não avance:** corrija usando a skill superpowers:systematic-debugging.

- [ ] **Passo 3: commit**

```bash
git add README.md
git commit -m "docs: README do projeto para o portfólio" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Passo 4: publicar no GitHub (pedir confirmação antes)**

Publicar o código é uma ação externa. **Pergunte ao usuário** se ele quer publicar agora e se o repositório pode ser **público**, como é comum em portfólio. Confirme também que o `.env.local` não está no git:

```bash
git ls-files | grep -c "env.local"
```

Esperado: `0`.

Com a confirmação do usuário, verifique se o GitHub CLI está instalado: `gh --version`.
- **Se estiver instalado e autenticado** (`gh auth status`): `gh repo create catalogo-filmes --public --source . --remote origin --push`.
- **Se não estiver**, guie o usuário:
  1. Entre em https://github.com/new, dê o nome `catalogo-filmes`, marque **Public**, **não** adicione README nem .gitignore e clique em **Create repository**.
  2. Copie o endereço que aparece (`https://github.com/<usuario>/catalogo-filmes.git`) e me envie.

  Depois, rode:

  ```bash
  git remote add origin https://github.com/<usuario>/catalogo-filmes.git
  git push -u origin main
  ```

  Na primeira vez, o Windows abre uma janela de login do GitHub. O usuário faz o login nela.

- [ ] **Passo 5: publicar na Vercel (guiado)**

Envie ao usuário:

> 1. Acesse https://vercel.com/signup e entre com a sua conta do GitHub (plano **Hobby**, gratuito).
> 2. Clique em **Add New… → Project** e escolha o repositório `catalogo-filmes` (botão **Import**).
> 3. Em **Environment Variables**, adicione o nome `TMDB_API_READ_ACCESS_TOKEN` e cole o mesmo token do seu `.env.local` como valor. Não cole o token aqui no chat.
> 4. Clique em **Deploy** e espere terminar (1 a 3 minutos).
> 5. Me envie o link que aparecer (algo como `https://catalogo-filmes-xxxx.vercel.app`).

- [ ] **Passo 6: conferir o site publicado**

Abra o link recebido e confira:
- a Início mostra o destaque e as fileiras;
- um card abre os detalhes, com trailer;
- o Explorar filtra;
- a busca funciona;
- o rodapé mostra os créditos.

Se a Início mostrar "Algo deu errado", a causa mais provável é o token na Vercel. Peça ao usuário que confira o nome da variável e faça **Redeploy**.

- [ ] **Passo 7: registrar o link no README e commit**

No `README.md`, logo abaixo do primeiro parágrafo, acrescente a linha com o link real recebido no Passo 5:

```markdown
🔗 **Site no ar:** https://catalogo-filmes-xxxx.vercel.app
```

Troque `https://catalogo-filmes-xxxx.vercel.app` pelo endereço exato recebido.

```bash
git add README.md
git commit -m "docs: adiciona link do site publicado" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Esperado: a Vercel publica a nova versão sozinha depois do push.
