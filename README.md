# CineList

Catálogo para **descobrir o que assistir**: os filmes disponíveis agora nos streamings **por assinatura no Brasil** (Netflix, Prime Video, Max, Disney+, Globoplay…), com visual de vitrine e tema escuro.

🔗 **Site no ar:** https://cinelist-nine.vercel.app

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

O `npm run build` também precisa do token no `.env.local`, porque a página Início é gerada na hora do build.

## Publicação

Na Vercel, cadastre `TMDB_API_READ_ACCESS_TOKEN` em Environment Variables antes do primeiro deploy.

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
