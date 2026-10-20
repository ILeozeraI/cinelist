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

## Contas e listas (Supabase)

Dá para criar uma conta (e-mail e senha) e montar duas listas: **Quero assistir** e **Já assisti**. As contas e as listas ficam no [Supabase](https://supabase.com) (gratuito). Sem as chaves do Supabase o site continua funcionando, só as partes de conta mostram "Não foi possível conectar agora".

**Configurar o Supabase (uma vez):**

1. Crie um projeto em https://supabase.com.
2. Em *Authentication → Providers → Email*, deixe **Confirm email desligado** (assim a conta já entra logada, sem e-mail de confirmação).
3. Em *SQL Editor*, cole o conteúdo do arquivo `supabase/migrations/20261020_movie_marks.sql` e clique em **Run**. Isso cria a tabela das marcações e as regras de segurança.
4. Em *Project Settings → API*, copie a **URL do projeto** e a **chave pública** (a *publishable*, que começa com `sb_publishable_`). Nunca use a chave secreta (`service_role`).
5. Cole as duas no `.env.local` (veja o `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

**Na Vercel** (*Settings → Environment Variables*, ambiente Production), cadastre:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, com os mesmos valores do `.env.local`;
- `CRON_SECRET`, um texto aleatório e bem longo que só você sabe. Ele protege a rota `/api/manter-acordado`, que a Vercel chama todo dia (veja o `vercel.json`) para o Supabase gratuito não "dormir" por falta de uso.

**Testes e2e:** eles usam o Supabase de verdade e criam usuários `e2e-…@cinelist.test`. Se quiser limpar, apague esses usuários em *Authentication → Users*.

## Publicação

Na Vercel, cadastre `TMDB_API_READ_ACCESS_TOKEN` em Environment Variables antes do primeiro deploy (e as variáveis do Supabase, veja a seção acima).

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
