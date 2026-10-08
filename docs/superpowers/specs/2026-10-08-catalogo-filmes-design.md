# Catálogo de Filmes nos Streamings — Design

**Data:** 2026-10-08
**Status:** aprovado (spec revisada pelo dono do projeto em 2026-10-08)

## 1. Objetivo e contexto

Um site para **descobrir o que assistir**: um catálogo visual, com cara de Netflix/JustWatch, dos filmes disponíveis **agora** nos streamings **por assinatura** no **Brasil**. Os dados vêm da API do TMDB, e a disponibilidade nos streamings vem da JustWatch, através do TMDB.

- **Propósito:** projeto de **portfólio**. Qualidade visual, código limpo e testes contam tanto quanto as funcionalidades.
- **Plataforma:** site web responsivo (desktop e celular), publicado na Vercel com um link público.
- **Critério de sucesso:** o site público abre rápido, é bonito e funciona bem no celular. O código é organizado, tem testes e o dono do projeto pode apresentá-lo com orgulho.

## 2. Decisões fechadas

| Tema | Decisão |
|---|---|
| Região | Só Brasil (`watch_region=BR`), textos em pt-BR (`language=pt-BR`) |
| "Disponível" | Só **assinatura** (`flatrate`). Aluguel, compra e grátis ficam de fora |
| Stack | Next.js (App Router) + React + TypeScript + Tailwind CSS |
| Renderização | O **servidor monta as páginas** (Server Components) e usa cache das respostas do TMDB |
| Tema | **Só escuro**, sem alternância para claro |
| Layout da Início | "Vitrine estilo Netflix": destaque + fileiras horizontais **só por gênero** |
| Login/banco | **Nenhum** nesta versão. O Supabase vem numa fase futura |

## 3. Telas

### 3.1 Elementos comuns
- **Cabeçalho:** logo do app, links **Início** e **Explorar**, campo **Buscar filme** (envia para `/buscar?q=`).
- **Rodapé:** logo do TMDB, o aviso "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB" e o crédito "Dados de streaming: JustWatch".
- **Estados de tela:**
  - carregando: esqueletos de pôster;
  - vazio: mensagem explicativa;
  - erro: "Algo deu errado" + botão **Tentar de novo**.

### 3.2 Card de filme (`MovieCard`)
- Mostra pôster, título, ano, nota (1 casa decimal) e os logos dos streamings por assinatura no Brasil.
- Sem pôster: um quadro escuro com o título.
- Clique: vai para `/filme/[id]`.

### 3.3 Início (`/`)
- **Destaque (Hero):** o filme mais popular entre os disponíveis por assinatura no Brasil que tenha imagem de fundo (`backdrop_path`). Mostra imagem grande, título, nota, ano e logos, e o clique leva aos detalhes.
- **10 fileiras de gênero**, nesta ordem fixa:

  | Gênero (pt-BR) | ID TMDB |
  |---|---|
  | Ação | 28 |
  | Comédia | 35 |
  | Drama | 18 |
  | Terror | 27 |
  | Ficção científica | 878 |
  | Romance | 10749 |
  | Animação | 16 |
  | Suspense | 53 |
  | Crime | 80 |
  | Aventura | 12 |

- **Cada fileira:**
  - mostra 20 filmes do gênero, ordenados por popularidade, disponíveis por assinatura no Brasil;
  - desliza na horizontal, com toque no celular e setas/rolagem no desktop;
  - tem o link **"ver tudo ›"**, que leva a `/explorar?genero=<id>`.
- Se uma fileira falhar, ela não aparece e as outras continuam.

### 3.4 Explorar (`/explorar`)
- **Grade de pôsteres** com filtros:
  - **Streamings:** seleção múltipla, com logos. A lista vem dos provedores de assinatura do Brasil no TMDB (`/watch/providers/movie?watch_region=BR`); mostramos os **8 primeiros** por `display_priority`. Vários marcados significa "OU".
  - **Gênero:** um entre os 19 gêneros de filme do TMDB, ou "Todos".
  - **Ano:** de/até, aplicado à data de lançamento.
  - **Nota mínima:** de 0 a 9, em passos de 0,5.
  - **Ordenação:**
    - **popularidade** (padrão);
    - **nota:** exige `vote_count.gte=200` para evitar filmes obscuros;
    - **lançamento mais recente.**
- **Nenhum streaming marcado** significa a união dos 8 streamings da lista, para que a regra "disponível por assinatura" valha sempre.
- **Filtros no link:** ficam na URL, por exemplo `?streaming=8,119&genero=27&de=2000&ate=2024&nota=6.5&ordem=nota`.
  - Valores inválidos são ignorados e voltam ao padrão.
  - Mudar um filtro atualiza o link, e o servidor remonta a grade.
- **"Carregar mais":** busca a próxima página (20 filmes) e acrescenta na grade. O botão some quando não há mais páginas.
- **No celular:** os filtros ficam num painel que abre pelo botão **Filtros**.

### 3.5 Busca (`/buscar?q=...`)
- Usa a busca de filmes do TMDB (`/search/movie`) e, para cada resultado, consulta os streamings.
- Mostra **somente** os filmes disponíveis por assinatura no Brasil.
- **"Carregar mais"** processa a próxima página de resultados do TMDB.
- Sem resultados: "Nenhum filme com esse nome está disponível nos streamings agora."
- `q` vazio: a página mostra só o convite para digitar.

### 3.6 Detalhes do filme (`/filme/[id]`)
1. **Topo:** pôster, título, ano e sinopse em pt-BR. Sem sinopse: "Sinopse não disponível em português."
2. **Informações:** ★ nota do TMDB e duração no formato "2h 46min". Duração ausente ou 0: o campo é omitido.
3. **Onde assistir:** logos dos streamings por assinatura no Brasil + crédito "Dados: JustWatch". Lista vazia: "Não está disponível por assinatura no Brasil no momento."
4. **Trailer:** escolhido entre os vídeos do filme com `site = YouTube` e `type = Trailer`.
   - **Prioridade:** pt-BR oficial > pt-BR > en oficial > en.
   - O player mostra só a miniatura e um botão ▶. Ao clicar, carrega o iframe de `youtube-nocookie.com`.
   - Sem trailer, a seção some.
- Link **"← Voltar"** no topo.
- ID inexistente ou inválido: página **"Filme não encontrado"** (404).
- **Fora desta versão:** elenco e filmes parecidos.

## 4. Arquitetura e organização do código

```
src/
├── app/
│   ├── layout.tsx            tema escuro, cabeçalho, rodapé
│   ├── page.tsx              Início
│   ├── explorar/page.tsx
│   ├── buscar/page.tsx
│   ├── filme/[id]/page.tsx   (+ not-found.tsx)
│   ├── loading.tsx / error.tsx
│   └── actions.ts            Server Actions de "carregar mais" (explorar e busca)
├── components/
│   ├── Header, Footer, Hero
│   ├── MovieCard, MovieRow, MovieGrid, LoadMoreButton
│   ├── FiltersPanel, ProviderLogos, TrailerPlayer
│   └── Skeletons
└── lib/
    ├── tmdb/
    │   ├── client.ts         única peça que chama o TMDB: token, pt-BR, cache, limite de concorrência, nova tentativa
    │   ├── movies.ts         getFeatured, getGenreRow, discoverMovies, searchMovies, getMovieDetails, getProviderOptions
    │   ├── mappers.ts        resposta crua do TMDB → tipos do app
    │   └── types.ts          Movie, MovieDetails, Provider, Trailer, DiscoverFilters
    ├── genres.ts             os 10 gêneros da Início + nomes pt-BR dos 19
    ├── filters.ts            URLSearchParams ⇄ DiscoverFilters (com validação)
    ├── trailer.ts            regra de escolha do trailer
    └── format.ts             duração, ano, nota
```

**Regras de fronteira:**
- Só `lib/tmdb/client.ts` conhece o token e a URL do TMDB.
- Os componentes recebem os tipos do app (`Movie`, `MovieDetails`) e não sabem que o TMDB existe.
- As telas (`app/`) chamam as funções de `lib/tmdb/movies.ts` e repassam os dados aos componentes.
- `lib/` não importa nada de `components/` nem de `app/`.

**Preparado para o futuro (sem implementar agora):** o Supabase entra como `lib/supabase/`. O `MovieCard` poderá ganhar um botão de favorito sem mudar o formato dos dados.

## 5. Dados e integração com o TMDB

- **Autenticação:** cabeçalho `Authorization: Bearer <token>`, com o **API Read Access Token** guardado em `TMDB_API_READ_ACCESS_TOKEN` no `.env.local` (local) e nas variáveis de ambiente da Vercel.
  - O token **nunca** usa o prefixo `NEXT_PUBLIC_` e nunca vai para o navegador.
  - O `.env.local` fica no `.gitignore`.
- **Imagens:** `https://image.tmdb.org/t/p/<tamanho>/<caminho>`, servidas via `next/image` com `remotePatterns` para `image.tmdb.org`. O logo de cada streaming vem em `logo_path`.

**Endpoints usados:**

| Uso | Endpoint |
|---|---|
| Destaque, fileiras, Explorar | `GET /discover/movie` com `watch_region=BR`, `with_watch_monetization_types=flatrate`, `with_watch_providers=<ids separados por \|>`, `with_genres`, `primary_release_date.gte/lte`, `vote_average.gte`, `vote_count.gte`, `sort_by`, `page`, `language=pt-BR` |
| Logos de cada card | `GET /movie/{id}/watch/providers` → `results.BR.flatrate` |
| Lista de streamings do filtro | `GET /watch/providers/movie?watch_region=BR&language=pt-BR` |
| Nomes dos gêneros | `GET /genre/movie/list?language=pt-BR` |
| Busca | `GET /search/movie?query=...&language=pt-BR&region=BR&page=n` |
| Detalhes | `GET /movie/{id}?language=pt-BR&append_to_response=videos,watch/providers&include_video_language=pt,en` |

**Cache** (expiração por tempo, pelo mecanismo de cache de dados do Next.js):
- **6 horas:** discover, busca e streamings por filme.
- **24 horas:** detalhes, lista de gêneros e lista de provedores.

**Concorrência:** no máximo **10** pedidos simultâneos ao TMDB por renderização. Uma página da Início em cache frio faz cerca de 1 + 10 × 21 pedidos.

**Nova tentativa:** em HTTP 429 ou 5xx, **1** nova tentativa após uma breve espera, respeitando `Retry-After` quando presente.

**Primeira tarefa do plano: verificar na prática** se `with_watch_monetization_types=flatrate` funciona com a lista de provedores separada por `|`, e se `results.BR.flatrate` traz o que esperamos. A spec assume que sim. Se o comportamento divergir, ajustamos a consulta sem mudar as telas.

## 6. Tratamento de erros

| Situação | Comportamento |
|---|---|
| TMDB fora do ar / timeout em página inteira | `error.tsx`: "Algo deu errado" + **Tentar de novo** |
| Uma fileira da Início falha | A fileira é omitida (`Promise.allSettled`); o resto aparece |
| Streamings de um filme falham | O card aparece sem logos |
| 429 / 5xx | 1 nova tentativa; persistindo, segue as regras acima |
| `/filme/[id]` inexistente ou inválido | 404 "Filme não encontrado" |
| Filtro inválido na URL | Ignorado; volta ao padrão |
| Filme sem pôster / sem sinopse / sem trailer | Placeholder / texto padrão / seção omitida |
| Token ausente | Erro explícito no servidor: "Defina TMDB_API_READ_ACCESS_TOKEN no .env.local" |

## 7. Testes

- **Ferramentas:** Vitest + Testing Library (unidade e componentes) e Playwright (ponta a ponta).
- **TDD** em toda a lógica de `lib/`:
  - `format`;
  - `filters` (ida e volta URL ⇄ filtros, valores inválidos);
  - `trailer` (prioridade de idioma e ausência);
  - `mappers` (campos ausentes);
  - `movies.ts`, com `fetch` simulado e respostas-exemplo do TMDB salvas em `tests/fixtures/`.
- **Componentes:**
  - `MovieCard` (com e sem pôster e logos);
  - `ProviderLogos`;
  - `TrailerPlayer` (iframe só aparece após o clique);
  - `FiltersPanel` (alterar filtro gera a URL certa).
- **Ponta a ponta (smoke, contra o TMDB real, exige o token):**
  - a Início carrega fileiras;
  - o card abre os detalhes;
  - um filtro do Explorar altera a URL e a grade;
  - uma busca retorna resultado.
- **Antes de publicar:** `typecheck`, `lint`, todos os testes e `next build` passando.

## 8. Configuração inicial (guiada)

- O dono do projeto ainda **não tem conta no TMDB**. O plano inclui um passo guiado:
  1. criar a conta;
  2. pedir acesso à API;
  3. copiar o **API Read Access Token**;
  4. colocá-lo no `.env.local`.
- Na hora da publicação, o mesmo token é configurado na Vercel.
- **Ambiente:** Windows 11, Node.js v24. Python, se for necessário, é chamado com `py`.
- `.gitignore` inclui `node_modules/`, `.next/`, `.env*.local` e `.superpowers/`.

## 9. Fora do escopo desta versão

- Login, cadastro, favoritos e "já assisti" (fase futura com Supabase).
- Elenco e filmes parecidos na página de detalhes.
- Séries de TV.
- Outros países, aluguel/compra/grátis.
- Tema claro.
- Rolagem infinita automática (usamos o botão "Carregar mais").
