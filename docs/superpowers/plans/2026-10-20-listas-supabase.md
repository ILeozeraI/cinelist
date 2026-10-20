# Listas "Quero assistir" e "Já assisti" com login (Supabase): Plano de Implementação

> **Para quem vai executar (agente):** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** permitir criar conta com e-mail e senha (Supabase), marcar filmes como "Quero assistir" ou "Já assisti" na página de detalhes e ver essas listas em abas da Início, sem deixar a Descobrir (a Início pública) mais lenta.

**Arquitetura:** a sessão fica em cookies via `@supabase/ssr`. Há três jeitos de criar o cliente do Supabase: no servidor (Server Components, Server Actions), no navegador (o cabeçalho só lê a sessão) e no `proxy` (renova os cookies). As páginas públicas (`/`, `/filme/[id]`) **não leem cookies no servidor**. O estado do usuário chega a elas por componentes de cliente que chamam Server Actions ou leem a sessão no navegador. Assim elas continuam estáticas e guardadas em cache. As abas pessoais são rotas próprias e dinâmicas. Uma tabela `movie_marks` com RLS guarda um estado por filme e por pessoa. Um Vercel Cron diário mantém o projeto gratuito do Supabase acordado.

**Stack:** Next.js 16.4 (App Router, `proxy.ts`), React 19.3, TypeScript, Tailwind v4, `@supabase/supabase-js` 2.x + `@supabase/ssr` 0.12.x, Vitest + Testing Library, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-20-listas-supabase-design.md` (leia junto com este plano)

## Restrições globais

- **Branch:** todo o trabalho fica em `feat/listas-supabase`. **Nunca** faça commit, merge ou push no `main` até o dono aprovar no navegador (Tarefa 10).
- **Antes de escrever código Next.js**, leia o guia relevante em `node_modules/next/dist/docs/` (exigência do `AGENTS.md`). Nesta versão, `middleware` virou **`proxy`**: arquivo `src/proxy.ts`, função exportada `proxy`. Não ligue `cacheComponents` nem `partialPrefetching`.
- **Antes de usar a API do Supabase**, leia o README de `node_modules/@supabase/ssr` depois de instalar. As assinaturas de `cookies.getAll/setAll` mudam entre versões.
- **A Descobrir (`/`) continua estática** (`revalidate = 21600`). Não leia `cookies()`/sessão no `layout.tsx` raiz, em `src/app/page.tsx` nem em `src/app/filme/[id]/page.tsx`. Verificação: na saída do `npm run build`, `/` continua marcada como estática/ISR (não `ƒ Dynamic`).
- **Variáveis:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (a chave pública, *publishable* `sb_publishable_...`; a chave legada *anon* também funciona) e `CRON_SECRET` (só na Vercel). **Nenhuma** chave secreta/`service_role` no app. Nunca imprima os valores no terminal e nunca peça ao dono que cole chaves no chat.
- **Sem variáveis do Supabase**, o `build` e as páginas públicas funcionam. Tudo que é de conta mostra a mensagem de indisponível.
- **Valores fixos:** estados `"quero_assistir"` e `"ja_assisti"`. Rotas `/entrar`, `/quero-assistir`, `/ja-assisti` e `/api/manter-acordado`. Parâmetro de retorno `voltar`. Senha com mínimo de **6** caracteres.
- **Textos exatos (pt-BR):**
  - Abas: `Descobrir`, `Quero assistir`, `Já assisti`.
  - Botões de marcar: `Quero assistir`, `Já assisti`. Cabeçalho: `Entrar`, `Sair`.
  - Indisponível: `Não foi possível conectar agora. Tente de novo em instantes.`
  - Lista vazia: `Você ainda não marcou nenhum filme. Abra um filme e toque em "Quero assistir".` (em `/ja-assisti`, troque o final por `toque em "Já assisti".`)
  - Erros de login: ver Tarefa 4.
- **Validação:** Server Actions são endpoints públicos. Valide tudo o que chega (mesmo padrão de `src/app/actions.ts`).
- **Quem é o usuário no servidor:** use `supabase.auth.getClaims()` (o token é validado). **Nunca** use `getSession()` no servidor. No navegador, `getSession()` só serve para *mostrar* o e-mail no cabeçalho.
- **Visual:** segue o site atual. Tokens `sala`, `poltrona`, `tela`, `penumbra`, `projetor`, `projetor-claro`, fontes `font-display`/`font-sans`, as pílulas de `HomeGenreRows.tsx` (`pillClass`) e o sublinhado `after:bg-projetor` do link ativo do `Header`.
- **Ambiente:** Windows 11, Node v24, Git Bash. Python se chama com `py`. Comandos na raiz do projeto.
- **Commits:** cada commit termina com `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- **O dono é leigo em programação.** Todo passo que depende dele vai em linguagem simples, um passo por vez, dizendo onde clicar.

## Foco da revisão

1. **`voltar` adulterado** (`//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:alert(1)`, vazio, ausente): a pessoa sempre cai em `/`. *Teste: Tarefa 4, "`safeReturnPath` recusa destinos externos".*
2. **Cliques rápidos repetidos nos botões de marcar**: um pedido por vez, sem estado final trocado. *Teste: Tarefa 7, "bloqueia novos cliques enquanto salva".*
3. **Sessão expirada ou logout em outra aba, e depois um clique em marcar**: a pessoa vai para `/entrar?voltar=/filme/<id>`, sem erro técnico. *Testes: Tarefa 6 (`setMark` devolve `anonimo`) e Tarefa 7 ("vai para o login quando a sessão expirou").*
4. **Um filme da lista que o TMDB não devolve mais (404/falha)**: ele some da grade e o resto aparece. *Teste: Tarefa 8, "pula filmes que o TMDB não devolve".*
5. **Supabase pausado/fora do ar ou sem variáveis**: `/entrar`, as abas pessoais e os botões mostram a mensagem de indisponível. A Descobrir e os detalhes carregam normalmente. *Testes: Tarefas 1, 4, 6, 7 e 8 ("…indisponível…").*

## Mapa de arquivos

```
package.json                         + @supabase/supabase-js, @supabase/ssr
.env.example                         + variáveis do Supabase (instruções em pt-BR)
vercel.json                          cron diário → /api/manter-acordado
supabase/migrations/20261020_movie_marks.sql   tabela + RLS (o dono roda no SQL Editor)
src/proxy.ts                         renova a sessão (só quando há cookie sb-*)
src/lib/supabase/env.ts              lê as variáveis; null se faltarem
src/lib/supabase/server.ts           cliente de servidor (cookies do next/headers) + getCurrentUserId
src/lib/supabase/browser.ts          cliente de navegador (singleton)
src/lib/supabase/session.ts          updateSession(request) usado pelo proxy
src/lib/auth.ts                      safeReturnPath, loginHref, mensagens de erro de login
src/lib/marks.ts                     tipos e validação dos estados, consultas à tabela
src/app/auth-actions.ts              signIn, signUp, signOut (Server Actions)
src/app/mark-actions.ts              loadMark, setMark (Server Actions)
src/app/entrar/page.tsx              página de entrar/criar conta
src/components/AuthForm.tsx          formulário (cliente) com as duas opções
src/components/AccountMenu.tsx       "Entrar" ou menu com e-mail + "Sair" (cliente)
src/components/Header.tsx            usa AccountMenu; "Início" ativo também nas abas pessoais
src/components/MarkButtons.tsx       botões na página de detalhes (cliente)
src/components/HomeTabs.tsx          barra de abas Descobrir · Quero assistir · Já assisti
src/components/MarkedMoviesPage.tsx  conteúdo compartilhado das duas abas pessoais (servidor)
src/app/page.tsx                     + HomeTabs
src/app/filme/[id]/page.tsx          + MarkButtons na seção "Onde assistir"
src/app/quero-assistir/page.tsx      aba pessoal
src/app/ja-assisti/page.tsx          aba pessoal
src/app/api/manter-acordado/route.ts rota do cron (protegida por CRON_SECRET)
e2e/listas.spec.ts                   ponta a ponta das listas
README.md                            configuração do Supabase e do cron
```

Fronteiras (as mesmas da spec original): `src/lib/` não importa de `src/components/` nem de `src/app/`. Os componentes não importam `src/lib/supabase/server.ts` nem `src/lib/tmdb/*`. Eles falam com o servidor só por Server Actions ou por props. O `AccountMenu` pode importar `src/lib/supabase/browser.ts`.

---

### Tarefa 1: Dependências, variáveis e clientes do Supabase

**Arquivos:**
- Modificar: `package.json` (via `npm install @supabase/supabase-js @supabase/ssr`), `.env.example`
- Criar: `src/lib/supabase/env.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`
- Teste: `src/lib/supabase/env.test.ts`

**Interfaces:**
- Produz:
  - `getSupabaseEnv(): { url: string; key: string } | null`. Devolve `null` se alguma das duas variáveis `NEXT_PUBLIC_*` estiver vazia ou ausente.
  - `createSupabaseServerClient(): Promise<SupabaseClient | null>`, em `server.ts` (com `import "server-only"`). Usa `cookies()` de `next/headers`. O `setAll` fica dentro de `try/catch`, porque Server Components não podem gravar cookies.
  - `getCurrentUserId(supabase: SupabaseClient): Promise<string | null>`, em `server.ts`. Devolve o `claims.sub` de `getClaims()`, ou `null` se não houver sessão. **Lança erro** se o Supabase não responder, para quem chamou distinguir "anônimo" de "fora do ar".
  - `getSupabaseBrowserClient(): SupabaseClient | null`, em `browser.ts`. Cria uma única instância com `createBrowserClient`. Devolve `null` sem variáveis.

- [ ] **Passo 1: instalar** `npm install @supabase/supabase-js @supabase/ssr` e ler o README de `node_modules/@supabase/ssr`.
- [ ] **Passo 2: escrever o teste que falha** (`env.test.ts`, com `vi.stubEnv`):
  - `"devolve url e chave quando as duas existem"` → `toEqual({ url: "https://x.supabase.co", key: "sb_publishable_abc" })`
  - `it.each([["", "k"], ["https://x.supabase.co", ""], [undefined, undefined]])("devolve null sem variável (%s, %s)")` → `toBeNull()`
- [ ] **Passo 3: rodar** `npx vitest run src/lib/supabase/env.test.ts`. Esperado: FALHA (módulo não existe).
- [ ] **Passo 4: implementar** `env.ts`, `server.ts` e `browser.ts` com as assinaturas acima. Em `env.ts`, leia `process.env.NEXT_PUBLIC_SUPABASE_URL` e `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **literalmente** (o Next só embute no navegador as variáveis escritas por extenso).
- [ ] **Passo 5: atualizar `.env.example`**. Acrescente as duas variáveis com comentários em pt-BR no estilo da do TMDB, por exemplo: "Supabase → Project Settings → API Keys: copie a Project URL e a Publishable key".
- [ ] **Passo 6: rodar** `npm test && npm run typecheck && npm run lint`. Esperado: tudo passa.
- [ ] **Passo 7: commit** `feat: clientes do Supabase (servidor e navegador) e variáveis`

---

### Tarefa 2: Tabela `movie_marks` + configuração guiada do Supabase com o dono

> **Quem faz:** o **controlador** (a sessão que conversa com o dono), não um subagente. Os passos 2 a 6 são uma conversa guiada.

**Arquivos:**
- Criar: `supabase/migrations/20261020_movie_marks.sql`

**Interfaces:**
- Produz: a tabela `public.movie_marks(user_id uuid, movie_id integer, status text, updated_at timestamptz)`, que as Tarefas 6, 8 e 9 consultam.

- [ ] **Passo 1: escrever o SQL**. Ele deve rodar de novo sem erro (`if not exists` / `drop policy if exists`):
  - `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`
  - `movie_id integer not null check (movie_id > 0)`
  - `status text not null check (status in ('quero_assistir', 'ja_assisti'))`
  - `updated_at timestamptz not null default now()`
  - `primary key (user_id, movie_id)` e índice `(user_id, status, updated_at desc)`
  - `alter table ... enable row level security`
  - Quatro políticas (`select`, `insert`, `update`, `delete`) `to authenticated`, com `using`/`with check` `((select auth.uid()) = user_id)`.
- [ ] **Passo 2: projeto já criado pelo dono.** É o projeto `cinelist`, na organização *CineList*, com "Enable Data API", "Automatically expose new tables" e "Enable automatic RLS" marcados. Pule a criação. O SQL continua ligando a RLS e criando as políticas explicitamente (sem políticas, a RLS automática bloquearia tudo).
- [ ] **Passo 3 (guiado): chaves.** *Project Settings → API Keys*. O dono cria o `.env.local` a partir do `.env.example` (se já existir, acrescenta as linhas) e cola a **Project URL** e a **Publishable key**. Ele **não** cola nada no chat. Para conferir sem expor os valores, rode `grep -c "^NEXT_PUBLIC_SUPABASE_" .env.local`. Esperado: `2`.
- [ ] **Passo 4 (guiado): desligar a confirmação.** *Authentication → Sign In / Providers → Email*: desligar **Confirm email** e salvar.
- [ ] **Passo 5 (guiado): rodar o SQL.** *SQL Editor → New query*: o dono cola o conteúdo do arquivo de migração e clica em **Run**. Esperado: "Success. No rows returned". Para conferir, em *Table Editor* aparece `movie_marks` com o selo de RLS ligada.
- [ ] **Passo 6: commit** `feat: tabela movie_marks com RLS`

---

### Tarefa 3: Proxy que renova a sessão

**Arquivos:**
- Criar: `src/lib/supabase/session.ts`, `src/proxy.ts`
- Teste: `src/lib/supabase/session.test.ts`

**Interfaces:**
- Consome: `getSupabaseEnv()` (Tarefa 1).
- Produz: `updateSession(request: NextRequest): Promise<NextResponse>` e `hasSupabaseCookie(request: NextRequest): boolean` (algum cookie com nome começando em `sb-`).

- [ ] **Passo 1: escrever os testes que falham** (`session.test.ts`, com `vi.mock("@supabase/ssr")`):
  - `"não chama o Supabase quando não há cookie sb-"`: a requisição sem cookies devolve `NextResponse.next()`, e `createServerClient` não foi chamado. Esse é o caminho de todo visitante anônimo, inclusive recrutadores.
  - `"não chama o Supabase sem variáveis"`: tem cookie `sb-x-auth-token` mas o env está vazio, e `createServerClient` não foi chamado.
  - `"renova a sessão quando há cookie sb-"`: com o env presente, `getClaims` foi chamado uma vez.
  - `"segue a navegação se o Supabase falhar"`: `getClaims` rejeita e a resposta ainda é `next` (status 200, sem lançar).
- [ ] **Passo 2: rodar** `npx vitest run src/lib/supabase/session.test.ts`. Esperado: FALHA.
- [ ] **Passo 3: implementar `updateSession`** seguindo o padrão do README do `@supabase/ssr`: `createServerClient` com `getAll` vindo de `request.cookies` e `setAll` gravando na `request` **e** na `NextResponse` recriada. Em seguida, chame `getClaims()` dentro de `try/catch`.
- [ ] **Passo 4: implementar `src/proxy.ts`**: `export async function proxy(request: NextRequest)` que devolve `updateSession(request)`. O `config.matcher` exclui `_next/static`, `_next/image`, `favicon.ico`, `api/` e arquivos de imagem (`.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$`).
- [ ] **Passo 5: rodar** `npm test && npm run typecheck`. Esperado: tudo passa.
- [ ] **Passo 6: commit** `feat: proxy renova a sessão do Supabase só para quem tem cookie`

---

### Tarefa 4: Entrar, criar conta e sair

**Arquivos:**
- Criar: `src/lib/auth.ts`, `src/app/auth-actions.ts`, `src/app/entrar/page.tsx`, `src/components/AuthForm.tsx`
- Testes: `src/lib/auth.test.ts`, `src/app/auth-actions.test.ts`, `src/components/AuthForm.test.tsx`

**Interfaces:**
- Consome: `createSupabaseServerClient`, `getCurrentUserId` (Tarefa 1).
- Produz:
  - `safeReturnPath(raw: unknown): string` (`src/lib/auth.ts`). Aceita só string que começa com `/`, não começa com `//` nem `/\`, e não tem caracteres de controle. Qualquer outra coisa vira `"/"`.
  - `loginHref(returnTo: string): string`. Devolve `/entrar?voltar=<encodeURIComponent(safeReturnPath(returnTo))>`.
  - `UNAVAILABLE_MESSAGE` = `"Não foi possível conectar agora. Tente de novo em instantes."`
  - `authErrorMessage(error: { code?: string; status?: number } | null): string`
  - `type AuthFormState = { error: string | null; email: string }`
  - Server Actions `signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`, `signUp(prev, formData)` (mesma assinatura) e `signOut(): Promise<void>`. O `formData` tem os campos `email`, `senha` e `voltar`.

**Mensagens (texto exato) de `authErrorMessage`:**

| `code` do Supabase | Mensagem |
|---|---|
| `invalid_credentials` | `E-mail ou senha incorretos.` |
| `user_already_exists`, `email_exists` | `Este e-mail já tem uma conta. Use a opção Entrar.` |
| `weak_password` | `A senha precisa ter pelo menos 6 caracteres.` |
| `email_address_invalid`, `validation_failed` | `Digite um e-mail válido.` |
| `over_request_rate_limit`, `over_email_send_rate_limit` | `Muitas tentativas. Espere um pouco e tente de novo.` |
| qualquer outro, `null` ou erro de rede | `UNAVAILABLE_MESSAGE` |

- [ ] **Passo 1: escrever os testes que falham de `auth.ts`:**
  - `"safeReturnPath aceita caminhos internos"`: `"/filme/123"` → `"/filme/123"` e `"/quero-assistir"` → `"/quero-assistir"`.
  - `it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", undefined, 42, "/filme/1\n"])("safeReturnPath recusa destinos externos (%s)")` → `"/"`.
  - `"loginHref codifica o retorno"`: `loginHref("/filme/1")` → `"/entrar?voltar=%2Ffilme%2F1"`.
  - `it.each` sobre a tabela de mensagens acima.
- [ ] **Passo 2: escrever os testes que falham das actions** (`vi.mock("@/lib/supabase/server")`, `vi.mock("next/navigation")` com `redirect` lançando um erro marcador):
  - `"signIn com sucesso redireciona para o voltar seguro"`: `voltar="/filme/9"` → `redirect("/filme/9")`. Com `voltar="//evil.com"` → `redirect("/")`.
  - `"signIn devolve a mensagem traduzida e mantém o e-mail"`: o `signInWithPassword` resolve `{ error: { code: "invalid_credentials" } }` → `{ error: "E-mail ou senha incorretos.", email: "a@b.com" }`.
  - `"signUp recusa senha curta sem chamar o Supabase"`: `senha="12345"` → a mensagem de senha curta, e `signUp` do Supabase não foi chamado.
  - `"signUp recusa e-mail sem @ sem chamar o Supabase"` → `"Digite um e-mail válido."`
  - `"signUp sem sessão devolvida mostra erro"`: o Supabase resolve `{ data: { session: null }, error: null }` (Confirm email ligado por engano) → `{ error: UNAVAILABLE_MESSAGE }`. Registre também com `console.error`.
  - `"entrar fica indisponível sem Supabase"`: `createSupabaseServerClient` resolve `null` → `{ error: UNAVAILABLE_MESSAGE }`.
  - `"apara espaços do e-mail"`: `" A@B.com "` chega ao Supabase como `"a@b.com"`.
- [ ] **Passo 3: rodar** `npx vitest run src/lib/auth.test.ts src/app/auth-actions.test.ts`. Esperado: FALHA.
- [ ] **Passo 4: implementar `auth.ts` e `auth-actions.ts`.** O `redirect()` fica **fora** do `try/catch`. O `signOut` chama `supabase.auth.signOut()` e ignora falhas de rede (os cookies são limpos de qualquer forma).
- [ ] **Passo 5: escrever o teste que falha de `AuthForm`** (props `{ returnTo: string }`, mockando `@/app/auth-actions`):
  - `"começa em Entrar e troca para Criar conta"`: dois botões de aba com `aria-pressed`. O botão de enviar muda de `Entrar` para `Criar conta`.
  - `"mostra a regra da senha e o erro devolvido"`: o texto `Mínimo de 6 caracteres` aparece no modo Criar conta. Depois de a action devolver um erro, ele aparece num elemento `role="alert"`.
  - `"envia o voltar escondido"`: `input[type=hidden][name=voltar]` com o valor de `returnTo`.
- [ ] **Passo 6: implementar `AuthForm`** (`"use client"`, `useActionState`, botão desabilitado com `Entrando…`/`Criando conta…` enquanto `pending`) e **`/entrar/page.tsx`**. A página lê `searchParams.voltar` com `safeReturnPath`. Se `getCurrentUserId` devolver um id, faz `redirect(voltar)`. Se o Supabase lançar erro ou for `null`, mostra o formulário mesmo assim (o envio vai mostrar a mensagem). `metadata.title = "Entrar"`. Visual: cartão central no estilo do site, campos `type="email"` (`autoComplete="email"`) e `type="password"` (`autoComplete` `current-password`/`new-password` conforme o modo).
- [ ] **Passo 7: rodar** `npm test && npm run typecheck && npm run lint`. Esperado: tudo passa.
- [ ] **Passo 8: commit** `feat: página Entrar com criar conta e sair`

---

### Tarefa 5: Conta no cabeçalho

**Arquivos:**
- Criar: `src/components/AccountMenu.tsx`
- Modificar: `src/components/Header.tsx`, `src/components/Header.test.tsx`
- Teste: `src/components/AccountMenu.test.tsx`

**Interfaces:**
- Consome: `getSupabaseBrowserClient` (Tarefa 1), `signOut` e `loginHref` (Tarefa 4).
- Produz: `<AccountMenu />` (sem props).

- [ ] **Passo 1: escrever os testes que falham** (mockando `@/lib/supabase/browser`, `@/app/auth-actions` e `next/navigation`):
  - `"sem sessão mostra Entrar com retorno para a página atual"`: com `usePathname` = `/filme/5`, o link `Entrar` tem `href` `/entrar?voltar=%2Ffilme%2F5`.
  - `"com sessão mostra o e-mail e Sair"`: `getSession` resolve com `user.email = "ana@ex.com"`. O botão do menu mostra `ana@ex.com`. Ao abrir, aparece o botão `Sair`.
  - `"Sair encerra a sessão e fica na página"`: o clique em `Sair` chama `signOut` e depois `router.refresh()`. O menu volta a mostrar `Entrar`.
  - `"Sair numa aba pessoal vai para a Início"`: com o pathname `/ja-assisti`, chama `router.push("/")`.
  - `"sem Supabase mostra Entrar"`: `getSupabaseBrowserClient` devolve `null` → o link `Entrar` aparece.
  - `"relê a sessão ao mudar de página"`: com um novo `usePathname`, `getSession` é chamado de novo. É assim que o cabeçalho percebe o login feito pela Server Action.
- [ ] **Passo 2: rodar** `npx vitest run src/components/AccountMenu.test.tsx`. Esperado: FALHA.
- [ ] **Passo 3: implementar `AccountMenu`.** Lê `getSession()` num `useEffect` que depende do `pathname`, e assina `onAuthStateChange`. Enquanto não sabe, mostra um espaço reservado do mesmo tamanho do botão, para não pular. O menu abre e fecha com o clique, fecha com `Esc` e com clique fora, e usa `aria-expanded`. O e-mail é cortado com `truncate` e `max-w-[16ch]` no celular. Visual: o botão `Entrar` é uma pílula com borda `projetor`.
- [ ] **Passo 4: modificar o `Header`.** Coloque `<AccountMenu />` depois da busca (no desktop) e na primeira linha (no celular), sem quebrar o layout em duas linhas que já existe. O link `Início` fica ativo também em `/quero-assistir` e `/ja-assisti`. No `Header.test.tsx`, acrescente os mocks de `@/lib/supabase/browser`, `@/app/auth-actions` e `useRouter` e o caso `"Início fica ativo em /quero-assistir"`.
- [ ] **Passo 5: rodar** `npm test && npm run typecheck && npm run lint`. Esperado: tudo passa.
- [ ] **Passo 6: commit** `feat: botão Entrar e menu da conta no cabeçalho`

---

### Tarefa 6: Dados e Server Actions das marcações

**Arquivos:**
- Criar: `src/lib/marks.ts`, `src/app/mark-actions.ts`
- Testes: `src/lib/marks.test.ts`, `src/app/mark-actions.test.ts`

**Interfaces:**
- Consome: `createSupabaseServerClient` e `getCurrentUserId` (Tarefa 1), a tabela (Tarefa 2).
- Produz:
  - `isMovieId(v: unknown): v is number` em `src/lib/filters.ts` (a mesma regra de `positiveInt`: `number`, inteiro seguro > 0), com testes em `src/lib/filters.test.ts`
  - `type MarkStatus = "quero_assistir" | "ja_assisti"`
  - `MARK_STATUSES: readonly MarkStatus[]`
  - `isMarkStatus(v: unknown): v is MarkStatus`
  - `getMark(supabase, userId: string, movieId: number): Promise<MarkStatus | null>`
  - `saveMark(supabase, userId: string, movieId: number, status: MarkStatus | null): Promise<void>`. Com `null`, faz `delete`. Com um estado, faz `upsert` com `onConflict: "user_id,movie_id"` e `updated_at: new Date().toISOString()`. Lança erro se o Supabase devolver `error`.
  - `listMarkedMovieIds(supabase, userId: string, status: MarkStatus): Promise<number[]>`, ordenado por `updated_at desc`.
  - `type MarkResult = { state: "ok"; status: MarkStatus | null } | { state: "anonimo" } | { state: "indisponivel" }`
  - Server Actions `loadMark(movieId: number): Promise<MarkResult>` e `setMark(movieId: number, status: MarkStatus | null): Promise<MarkResult>`. O `setMark` devolve o estado **salvo**.

- [ ] **Passo 1: escrever os testes que falham** (`marks.test.ts`, com um cliente falso que registra as chamadas encadeadas):
  - `"saveMark com estado faz upsert com updated_at"` e `"saveMark com null apaga"`.
  - `"listMarkedMovieIds ordena do mais recente"`: confere `.order("updated_at", { ascending: false })` e o filtro por `status`.
  - `"isMarkStatus"`: aceita os dois valores; recusa `"assistido"`, `null` e `1`.
- [ ] **Passo 2: escrever os testes que falham das actions** (`mark-actions.test.ts`):
  - `it.each([0, -1, 1.5, "12", null, Number.MAX_SAFE_INTEGER + 1])("recusa id inválido (%s) sem chamar o Supabase")` → lança `"Filme inválido"`.
  - `"setMark recusa estado desconhecido"` (`"assistido"`) → lança `"Estado inválido"`.
  - `"sem sessão devolve anonimo"`: `getCurrentUserId` → `null` → `{ state: "anonimo" }` (`loadMark` e `setMark`).
  - `"Supabase fora do ar devolve indisponivel"`: o cliente é `null` **ou** `getCurrentUserId` rejeita **ou** `saveMark` rejeita → `{ state: "indisponivel" }`, sem lançar.
  - `"setMark salva e revalida as abas"`: `saveMark(…, 7, "ja_assisti")` → `{ state: "ok", status: "ja_assisti" }`, e `revalidatePath` foi chamado com `/quero-assistir` e `/ja-assisti`.
- [ ] **Passo 3: rodar** `npx vitest run src/lib/marks.test.ts src/app/mark-actions.test.ts`. Esperado: FALHA.
- [ ] **Passo 4: implementar** `isMovieId`, `marks.ts` e `mark-actions.ts`. As actions validam com `isMovieId` e `isMarkStatus` antes de qualquer chamada ao Supabase.
- [ ] **Passo 5: rodar** `npm test && npm run typecheck`. Esperado: tudo passa.
- [ ] **Passo 6: commit** `feat: salvar e ler marcações com validação`

---

### Tarefa 7: Botões na página de detalhes

**Arquivos:**
- Criar: `src/components/MarkButtons.tsx`
- Modificar: `src/app/filme/[id]/page.tsx` (dentro da seção "Onde assistir", logo abaixo do título `Onde assistir` ou ao lado dele, como o visual pedir)
- Teste: `src/components/MarkButtons.test.tsx`

**Interfaces:**
- Consome: `loadMark`, `setMark`, `MarkStatus`, `MarkResult` (Tarefa 6), `loginHref` e `UNAVAILABLE_MESSAGE` (Tarefa 4).
- Produz: `<MarkButtons movieId={number} />`.

- [ ] **Passo 1: escrever os testes que falham** (mockando `@/app/mark-actions` e `next/navigation`):
  - `"mostra o estado salvo"`: `loadMark` → `ok/"quero_assistir"`. `Quero assistir` fica com `aria-pressed="true"` e `Já assisti` com `"false"`.
  - `"marcar Já assisti troca na hora"`: o clique faz `Já assisti` ficar pressionado **antes** de `setMark` resolver, e `Quero assistir` deixa de estar. A chamada é `setMark(id, "ja_assisti")`.
  - `"clicar no marcado desmarca"`: `setMark(id, null)`, e nenhum botão fica pressionado.
  - `"volta ao estado anterior e avisa quando falha"`: `setMark` → `indisponivel`. O estado volta ao anterior e `UNAVAILABLE_MESSAGE` aparece em `role="alert"`.
  - `"bloqueia novos cliques enquanto salva"`: com `setMark` pendente, os botões ficam `disabled`, e um segundo clique não gera outra chamada.
  - `"sem login vai para o Entrar"`: `loadMark` → `anonimo`. O clique faz `router.push("/entrar?voltar=%2Ffilme%2F42")`, e `setMark` não é chamado.
  - `"vai para o login quando a sessão expirou"`: `loadMark` → `ok/null`, mas `setMark` → `anonimo` → `router.push(loginHref(...))`, e o estado volta.
  - `"Supabase fora do ar ao carregar"`: `loadMark` → `indisponivel`. Os botões aparecem; o clique tenta `setMark` de novo (o Supabase pode ter voltado).
- [ ] **Passo 2: rodar** `npx vitest run src/components/MarkButtons.test.tsx`. Esperado: FALHA.
- [ ] **Passo 3: implementar `MarkButtons`** (`"use client"`). Chama `loadMark` num `useEffect`. Enquanto carrega, os botões aparecem desabilitados (sem pular o layout). O estado otimista usa `useOptimistic` ou um estado local com reversão. O botão marcado é preenchido em `projetor` com um ícone de check (crie um `CheckIcon` em `Icons.tsx` no padrão dos outros). O não marcado segue o estilo das pílulas. Os botões vão em `role="group"` com `aria-label="Sua lista"`.
- [ ] **Passo 4: colocar na página de detalhes** sem ler cookies no servidor. A página só passa `movie.id`.
- [ ] **Passo 5: rodar** `npm test && npm run typecheck && npm run lint && npm run build`. Esperado: tudo passa, e no build `/` continua estática/ISR.
- [ ] **Passo 6: commit** `feat: botões Quero assistir e Já assisti na página do filme`

---

### Tarefa 8: Abas da Início e páginas das listas

**Arquivos:**
- Criar: `src/components/HomeTabs.tsx`, `src/components/MarkedMoviesPage.tsx`, `src/app/quero-assistir/page.tsx`, `src/app/ja-assisti/page.tsx`
- Modificar: `src/app/page.tsx`
- Testes: `src/components/HomeTabs.test.tsx`, `src/components/MarkedMoviesPage.test.tsx`

**Interfaces:**
- Consome: `createSupabaseServerClient` e `getCurrentUserId` (Tarefa 1), `listMarkedMovieIds` e `MarkStatus` (Tarefa 6), `loginHref` e `UNAVAILABLE_MESSAGE` (Tarefa 4), `getMovieDetails` (`src/lib/tmdb/movies.ts`, já existe e tem cache de 24 h) e `MovieGrid` (já existe).
- Produz: `<HomeTabs />` (cliente, usa `usePathname`) e `MarkedMoviesPage({ status }: { status: MarkStatus })` (Server Component assíncrono). As duas páginas só fazem `return <MarkedMoviesPage status="..." />` e definem `metadata.title` (`Quero assistir` / `Já assisti`).

> `MarkedMoviesPage` é um componente de servidor que chama `lib/supabase/server` e `lib/tmdb/movies`. Isso é uma exceção à fronteira dos componentes. Se o revisor preferir, mova o conteúdo para `src/app/(listas)/MarkedMoviesPage.tsx`. O comportamento é o mesmo.

- [ ] **Passo 1: escrever os testes que falham de `HomeTabs`:**
  - `"marca a aba atual"`: com o pathname `/ja-assisti`, o link `Já assisti` tem `aria-current="page"` e os outros não. Os `href` são `/`, `/quero-assistir` e `/ja-assisti`, nessa ordem, dentro de `nav` com `aria-label="Suas listas"`.
- [ ] **Passo 2: escrever os testes que falham de `MarkedMoviesPage`** (renderize com `render(await MarkedMoviesPage({ status }))`, mockando `@/lib/supabase/server`, `@/lib/marks`, `@/lib/tmdb/movies` e `next/navigation`):
  - `"sem login manda para o Entrar com retorno"`: `redirect("/entrar?voltar=%2Fquero-assistir")`.
  - `"mostra os filmes na ordem salva"`: os ids `[3, 1, 2]` aparecem como cards nessa ordem.
  - `"pula filmes que o TMDB não devolve"`: `getMovieDetails(1)` → `null` e `getMovieDetails(2)` rejeita. Só o card 3 aparece, sem erro.
  - `"lista vazia explica como marcar"`: o texto exato de lista vazia da aba e um link para `/`.
  - `"Supabase indisponível mostra o aviso"`: o cliente é `null` ou `listMarkedMovieIds` rejeita → `UNAVAILABLE_MESSAGE`, sem redirecionar.
- [ ] **Passo 3: rodar** `npx vitest run src/components/HomeTabs.test.tsx src/components/MarkedMoviesPage.test.tsx`. Esperado: FALHA.
- [ ] **Passo 4: implementar.** O `MarkedMoviesPage` busca os detalhes com `Promise.allSettled` (o cliente do TMDB já limita a 10 pedidos simultâneos), mantém a ordem dos ids e passa `MovieDetails` (que já é um `Movie`) para o `MovieGrid`. Sem paginação: mostra tudo. O título visível da página fica num `h1` (`Quero assistir` / `Já assisti`) com o `HomeTabs` acima, dentro de `shell page-top`.
- [ ] **Passo 5: colocar `HomeTabs` em `src/app/page.tsx`**, no topo do bloco de conteúdo, antes do `TopTenRow`, sem mudar o `Hero` nem o `revalidate`. Confira no navegador que o destaque continua com o mesmo tamanho e posição.
- [ ] **Passo 6: rodar** `npm test && npm run typecheck && npm run lint && npm run build`. Esperado: tudo passa. No build, `/` continua estática/ISR, e `/quero-assistir` e `/ja-assisti` aparecem como dinâmicas.
- [ ] **Passo 7: commit** `feat: abas Descobrir, Quero assistir e Já assisti`

---

### Tarefa 9: Manter o Supabase acordado

**Arquivos:**
- Criar: `src/app/api/manter-acordado/route.ts`, `vercel.json`
- Teste: `src/app/api/manter-acordado/route.test.ts`

**Interfaces:**
- Consome: `getSupabaseEnv` (Tarefa 1) e a tabela (Tarefa 2).
- Produz: `GET(request: Request): Promise<Response>`.

- [ ] **Passo 1: escrever os testes que falham** (mockando `@supabase/supabase-js`):
  - `"recusa sem o segredo"`: sem `Authorization`, com `Bearer errado`, ou com `CRON_SECRET` vazio no ambiente → 401, e o Supabase não foi chamado.
  - `"consulta o banco com o segredo certo"`: `Bearer s3gr3do` → 200 `{ ok: true }`. Foi chamado `from("movie_marks").select("movie_id", { count: "exact", head: true })`.
  - `"avisa quando o Supabase falha"`: a consulta devolve `error` ou o env é `null` → 503.
- [ ] **Passo 2: rodar** `npx vitest run src/app/api/manter-acordado/route.test.ts`. Esperado: FALHA.
- [ ] **Passo 3: implementar.** Use `createClient` do `@supabase/supabase-js`, sem sessão (`auth: { persistSession: false }`). A RLS devolve 0 linhas, mas a consulta chega ao banco. A comparação do segredo usa `crypto.timingSafeEqual` com buffers de tamanho igual. Acrescente `export const dynamic = "force-dynamic"` (confira o nome em `node_modules/next/dist/docs/` para route handlers). Crie o `vercel.json` com `{ "crons": [{ "path": "/api/manter-acordado", "schedule": "0 12 * * *" }] }`.
- [ ] **Passo 4: rodar** `npm test && npm run typecheck && npm run lint`. Esperado: tudo passa.
- [ ] **Passo 5: commit** `feat: cron diário mantém o Supabase acordado`

---

### Tarefa 10: Ponta a ponta, README e conferência do dono

**Arquivos:**
- Criar: `e2e/listas.spec.ts`
- Modificar: `README.md`

- [ ] **Passo 1: escrever `e2e/listas.spec.ts`.** Ele depende do Supabase configurado no `.env.local` (Tarefa 2). Cria um usuário novo por execução, com o e-mail `e2e-<Date.now()>@cinelist.test` e a senha `senha-e2e-123`:
  - `"aba pessoal sem login pede login"`: `/quero-assistir` → URL `/entrar?voltar=%2Fquero-assistir`.
  - `"marcar sem login leva ao Entrar e volta para o filme"`: abrir um filme pela fileira Ação, clicar em `Quero assistir`, ir para `/entrar…`, criar a conta e voltar para `/filme/<id>`.
  - `"fluxo completo"`: criar a conta → o cabeçalho mostra o e-mail → marcar `Quero assistir` → em `/quero-assistir` o card aparece → voltar ao filme, marcar `Já assisti` → em `/quero-assistir` aparece a lista vazia e em `/ja-assisti` o card aparece → `Sair` → o cabeçalho mostra `Entrar`.
  - `"entrar com senha errada mostra o erro"`: `E-mail ou senha incorretos.`
- [ ] **Passo 2: rodar** `npm run e2e`. Esperado: os testes novos e os antigos (`e2e/catalogo.spec.ts`) passam.
- [ ] **Passo 3: atualizar o `README.md`.** Acrescente uma seção "Contas e listas (Supabase)" com os passos da Tarefa 2 (criar o projeto, chaves, Confirm email, SQL) e os passos da Vercel: as duas variáveis `NEXT_PUBLIC_SUPABASE_*` e o `CRON_SECRET` (um texto aleatório longo). Diga também que os testes e2e criam usuários `e2e-…@cinelist.test`, que podem ser apagados em *Authentication → Users*.
- [ ] **Passo 4: verificação final.** Rode `npm test && npm run typecheck && npm run lint && npm run build && npm run e2e`. Esperado: tudo passa, e `/` continua estática/ISR no build.
- [ ] **Passo 5: commit** `test: e2e das listas e README do Supabase`
- [ ] **Passo 6 (guiado, controlador): conferência do dono.** Suba `npm run dev` e passe um roteiro curto para o dono testar em `http://localhost:3000`: criar uma conta, marcar dois filmes, trocar um de lista, ver as abas, sair, tentar marcar sem login, e olhar no celular pelo DevTools ou pela rede local. **Não junte nada no `main` antes do "aprovado" dele.**
- [ ] **Passo 7 (depois do "aprovado"): publicar.** Use a superpowers:finishing-a-development-branch. **Antes** do merge, guie o dono para colocar na Vercel (*Settings → Environment Variables*, ambiente Production) `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `CRON_SECRET`. Depois do deploy, confira junto com ele: o site em produção (`cinelist-nine.vercel.app`) cria a conta e marca filmes, e em *Settings → Cron Jobs* aparece `/api/manter-acordado`. Clique em **Run** uma vez e confira que a resposta é 200.
