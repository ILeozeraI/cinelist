# Listas "Quero assistir" e "Já assisti" com login (Supabase) — Design

**Data:** 2026-10-20
**Status:** aguardando aprovação do dono do projeto
**Branch:** `feat/listas-supabase` (só vai para o `main` depois que o dono conferir no navegador)

## 1. Objetivo e contexto

O CineList hoje é um catálogo público para descobrir filmes nos streamings por assinatura no Brasil (ver `2026-10-08-catalogo-filmes-design.md`). O próximo passo é deixar a pessoa **guardar o que ela quer ver e o que já viu**, para o site servir também como uma lista pessoal, e não só como vitrine.

Para isso entra uma conta com **e-mail e senha**, usando o **Supabase**, que a spec original já tinha deixado como "fase futura".

- **Critério de sucesso:** a pessoa cria a conta em segundos, marca filmes na página de detalhes e os encontra nas abas da Início. A Início pública continua tão rápida quanto hoje.
- **Por que agora:** o dono está mandando currículos com o link do CineList. **O login precisa funcionar sempre que um recrutador abrir o site**, mesmo depois de dias sem visitas.
- O projeto continua sendo de **portfólio**, então qualidade visual, código limpo e testes continuam contando.

## 2. Decisões fechadas (do dono do projeto)

| Tema | Decisão |
|---|---|
| Acesso | **Navegação pública.** Catálogo, busca e detalhes funcionam sem login. O login só é pedido para **marcar** um filme ou **abrir as abas pessoais** |
| Abas da Início | Três abas: **Descobrir** · **Quero assistir** · **Já assisti** |
| Aba Descobrir | É **exatamente** a Início atual (destaque + Top 10 + filtro por nota + fileiras por gênero), sem mudanças |
| Abas pessoais | Uma **grade** com os filmes que a pessoa marcou |
| Sem login nas abas pessoais | Clicar nelas pede login |
| Cadastro | E-mail e senha. **Sem confirmação de e-mail**: criou a conta, já está logado. O "Confirm email" é desligado no painel do Supabase |
| Esqueci minha senha | **Fora desta versão** (fica para uma versão futura) |
| Estados do filme | **Mutuamente exclusivos**: cada filme está em "Quero assistir", em "Já assisti" ou em nenhum. Marcar "Já assisti" tira o filme de "Quero assistir" automaticamente (e vice-versa) |
| Onde ficam os botões | **Só na página de detalhes** (`/filme/[id]`), junto da seção "Onde assistir" |
| Visual | Segue o estilo atual do site (tema escuro, cores `projetor`/`tela`/`sala`, fontes atuais). Sem esboços prévios |
| Técnica de login | **`@supabase/ssr`** com a **sessão em cookies** (cliente de servidor + cliente de navegador), que é o padrão oficial do Supabase para Next.js |
| Técnica de marcar | Os botões de marcar chamam **Server Actions** |
| Conferência antes do `main` | **No computador do dono** (`npm run dev`). As variáveis do Supabase só vão para a Vercel no fim, antes de juntar no `main` |
| Supabase gratuito "dormindo" | **Manter acordado** com uma visita automática agendada (seção 6.1). O login não pode quebrar por falta de uso |
| Fluxo de trabalho | Tudo no branch separado. Quando chegar a hora de criar o projeto no Supabase, pegar as chaves e desligar o "Confirm email", o dono é **guiado passo a passo** (ele é leigo em programação e já tem conta no Supabase) |

## 3. Comportamentos combinados

O dono confirmou estes comportamentos:

1. **Cabeçalho:** sem login aparece um botão **Entrar**. Logado, ele vira um menu com o **e-mail** da pessoa e a opção **Sair**.
2. **Página própria de entrar** (`/entrar`) com as duas opções: **Entrar** e **Criar conta**. Depois de entrar ou criar a conta, a pessoa **volta para onde estava**. Se ela tentou marcar um filme, volta para a página desse filme.
3. **Clicar no botão já marcado desmarca** o filme (ele volta para "nenhum").
4. **Ordem das listas:** o filme marcado **por último aparece primeiro**.
5. **Cada aba tem endereço próprio**, assim dá para salvar o link e o botão Voltar do navegador funciona.
6. **A Descobrir continua tão rápida quanto hoje.** As listas pessoais carregam à parte, só para quem está logado.

## 4. Telas e comportamento

### 4.1 Abas da Início
- Uma barra de abas fica no topo do conteúdo: **Descobrir** · **Quero assistir** · **Já assisti**. A aba atual fica destacada, como o link ativo do cabeçalho (sublinhado na cor `projetor`).
- **Descobrir** = `/`, a página atual.
- **Quero assistir** e **Já assisti** têm endereço próprio.
  - *Decisão do builder (sugestão):* rotas separadas, `/quero-assistir` e `/ja-assisti`. Assim a `/` continua estática e guardada no servidor (`revalidate`) e só as rotas pessoais leem cookies. Usar `/?aba=...` na própria Início é aceitável **só se** a Descobrir continuar estática.
- **Sem login:** clicar numa aba pessoal leva para `/entrar`, e depois do login a pessoa volta para a aba que pediu.
- **Grade:** os filmes da lista, com o card de filme atual (`MovieCard`: pôster, título, ano, nota, logos dos streamings), do mais recente para o mais antigo.
- **Lista vazia:** uma mensagem explicando como marcar, por exemplo: "Você ainda não marcou nenhum filme. Abra um filme e toque em *Quero assistir*." Pode ter um link para a Descobrir.
- **Onde fica a barra de abas no layout** (antes ou depois do destaque grande da Descobrir, por exemplo) é decisão de visual do builder. Ela não pode empurrar o destaque a ponto de piorar o carregamento do primeiro pôster/fundo (LCP), que já foi otimizado.

### 4.2 Botões na página de detalhes
- Dois botões ao lado/junto de "Onde assistir": **Quero assistir** e **Já assisti**.
- O botão do estado atual aparece **marcado** (preenchido, com ícone de check ou similar) e tem `aria-pressed`.
- Clique num botão não marcado: o filme vai para esse estado (e sai do outro, se estava lá). Clique no botão marcado: desmarca.
- **Sem login:** clicar leva para `/entrar?...` com retorno para a página do filme. O filme **não** é marcado automaticamente depois do login. A pessoa só volta para a página e clica de novo.
- **Resposta imediata:** o botão muda na hora (otimista), como os filtros já fazem no site. Se o servidor falhar, volta ao estado anterior e mostra uma mensagem curta de erro.
- A página de detalhes hoje é gerada no servidor com cache do TMDB. Saber o estado do filme para a pessoa logada não pode deixar a página visivelmente mais lenta. Como fazer isso (bloco carregado à parte com `Suspense`, leitura no navegador, etc.) é decisão do builder.

### 4.3 Página `/entrar`
- Duas opções na mesma página: **Entrar** e **Criar conta** (abas ou link para trocar, decisão de visual do builder).
- Campos: e-mail e senha. A senha tem no mínimo **6 caracteres** (o padrão do Supabase). O formulário avisa isso.
- **Criar conta** já deixa a pessoa logada (a confirmação de e-mail está desligada).
- **Mensagens de erro em pt-BR**, claras, no mínimo para: e-mail ou senha errados, e-mail já cadastrado, senha curta demais, e-mail inválido e falha de conexão.
- **Retorno:** o destino vem num parâmetro (ex.: `?voltar=/filme/123`). **Só caminhos internos** que começam com `/` (e não com `//`) são aceitos. Qualquer outra coisa vai para `/`. Isso evita redirecionar a pessoa para outro site (*open redirect*).
- Quem já está logado e abre `/entrar` vai direto para o destino.
- Sem "Esqueci minha senha" nesta versão.

### 4.4 Cabeçalho
- Sem login: botão **Entrar**, que leva para `/entrar` com retorno para a página atual.
- Logado: um menu com o e-mail da pessoa e a opção **Sair**. Sair encerra a sessão e mantém a pessoa na página atual. Se ela estava numa aba pessoal, vai para `/`.
- O cabeçalho está no layout raiz. **Ler a sessão no layout raiz pelo servidor tornaria todas as páginas dinâmicas** (inclusive a Descobrir). Por isso o cabeçalho deve descobrir o usuário de um jeito que não quebre o cache das páginas públicas, por exemplo pelo cliente de navegador do Supabase. Uma piscada curta ("Entrar" → e-mail) é aceitável.
- No celular, o botão/menu precisa caber no cabeçalho atual (que já quebra em duas linhas com a busca).

## 5. Dados

- **Uma tabela** no Supabase guarda a marcação de cada pessoa. Sugestão:

  | coluna | tipo | observação |
  |---|---|---|
  | `user_id` | `uuid` | referencia `auth.users(id)`, `on delete cascade` |
  | `movie_id` | `integer` | ID do filme no TMDB |
  | `status` | `text` | só `'quero_assistir'` ou `'ja_assisti'` (`check`) |
  | `updated_at` | `timestamptz` | usado para ordenar (mais recente primeiro) |

  Chave primária `(user_id, movie_id)`: é isso que garante que o filme tenha **um só estado**. Marcar = *upsert*, desmarcar = *delete*. Trocar de estado atualiza `updated_at`, então o filme vai para o topo da nova lista.
- **Segurança (RLS):** a tabela tem Row Level Security ligada, com políticas para cada pessoa **só ler, criar, mudar e apagar as próprias linhas** (`auth.uid() = user_id`). As Server Actions também validam a entrada (ID do filme inteiro positivo, status entre os dois valores), seguindo o comentário em `src/app/actions.ts`: "Server Actions são endpoints públicos: valide tudo o que chega."
- **O SQL fica versionado no repositório** (ex.: `supabase/migrations/<data>_listas.sql`). O dono vai rodá-lo no **SQL Editor** do painel, com guia passo a passo. Não usamos a CLI do Supabase.
- **Dados do filme nas grades:** a tabela guarda só o ID. Os dados para o card (título, pôster, ano, nota, streamings) vêm do TMDB, que já tem cache. Guardar uma cópia dos dados do filme na tabela é aceitável se o builder achar melhor, mas os **logos dos streamings precisam continuar atualizados**. Se um filme não carregar no TMDB, ele some da grade sem quebrar a página.
- Paginação ou limite das grades: decisão do builder (o uso esperado é de dezenas de filmes por pessoa).

## 6. Técnica

- Bibliotecas novas: `@supabase/supabase-js` e `@supabase/ssr`.
- **Clientes:** um de navegador (`createBrowserClient`) e um de servidor (`createServerClient` lendo/escrevendo cookies via `next/headers`). Do lado do servidor, quem diz quem é o usuário é o `getUser()`/`getClaims()` (que valida o token), **nunca** `getSession()` sozinho.
- **Renovar a sessão:** esta versão do Next.js **renomeou `middleware` para `proxy`** (`src/proxy.ts`, função `proxy`). Ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. A renovação dos cookies de sessão do Supabase vai no `proxy`, com um `matcher` que **não** rode em arquivos estáticos e imagens. Antes de escrever código, o builder deve ler os guias em `node_modules/next/dist/docs/` (exigência do `AGENTS.md`).
- **Server Actions:** marcar, desmarcar, entrar, criar conta e sair. Depois de marcar ou desmarcar, as telas afetadas (página do filme e as abas pessoais) precisam mostrar o estado novo.
- **Variáveis de ambiente:** URL do projeto e a chave pública (*publishable*/*anon*) do Supabase, com prefixo `NEXT_PUBLIC_`. Entram no `.env.example` (com instrução em pt-BR, como a do TMDB), no `.env.local` e na Vercel. **Nenhuma chave secreta** (`service_role`/*secret*) é usada pelo app.
- **Testes:** o projeto já tem Vitest (unidade/componentes) e Playwright (e2e). As partes novas seguem o mesmo padrão: validação do destino de retorno, validação das Server Actions, botões (estados, otimista, erro), abas e página de entrar. Como testar o login no e2e sem depender do Supabase real é decisão do builder. O e2e atual do catálogo precisa continuar passando.
- **Supabase fora do ar** *(decisão do Claude)*: se o Supabase não responder, entrar, criar conta, marcar e as abas pessoais mostram uma mensagem clara em pt-BR (ex.: "Não foi possível conectar agora. Tente de novo em instantes."). O catálogo público nunca depende do Supabase para carregar.
- **Sem variáveis do Supabase** *(decisão do Claude)*: o `build` e as páginas públicas funcionam mesmo sem as variáveis configuradas. Nesse caso as partes de conta mostram a mesma mensagem de "não foi possível conectar", em vez de quebrar.
- **README:** explicar as novas variáveis, o passo de configurar o Supabase e a visita automática.

### 6.1 Manter o Supabase acordado
- No plano gratuito, o projeto do Supabase é pausado depois de cerca de 1 semana sem uso. O dono decidiu evitar isso.
- **Como:** um **Vercel Cron Job** (configurado no `vercel.json`) chama uma rota do app **uma vez por dia**, que é o máximo do plano gratuito da Vercel e mais que suficiente. Essa rota faz uma consulta leve ao banco do Supabase, para contar como uso de verdade.
- A rota é **protegida**: só responde quando recebe o segredo `CRON_SECRET` que a Vercel envia no cabeçalho `Authorization`. Sem o segredo, ela devolve 401. O `CRON_SECRET` é uma variável nova da Vercel, criada no passo guiado.
- O cron só roda no site publicado (produção), então ele passa a valer depois que o branch for para o `main`. Até lá, o uso local já mantém o projeto acordado.
- Escolher a consulta exata (que deve passar pela RLS sem precisar de chave secreta) e o nome da rota fica com o builder.

## 7. Configuração no Supabase (guiada, com o dono)

O builder conduz o dono, passo a passo e em linguagem simples, por:

1. Criar o projeto no Supabase (nome, senha do banco, região, de preferência **São Paulo**).
2. Copiar a URL e a chave pública para o `.env.local`.
3. Desligar **Confirm email** (Authentication → provedor Email).
4. Rodar o SQL da tabela e das políticas no **SQL Editor**.
5. Conferir tudo no computador (`npm run dev`).
6. Antes de juntar no `main`: colocar as mesmas variáveis do Supabase na Vercel e criar o `CRON_SECRET`.
7. Depois de publicar: conferir na Vercel que o Cron Job aparece e rodou.

O build e os testes que não dependem do Supabase devem funcionar mesmo antes desses passos, para o trabalho não travar esperando o dono.

## 8. Fora do escopo (non-goals)

- Esqueci minha senha / trocar senha / apagar conta.
- Login com Google ou outros provedores.
- Botões de marcar nos cards, no destaque ou nas fileiras (só na página de detalhes).
- Nota pessoal, data em que assistiu, comentários ou listas personalizadas.
- Compartilhar listas com outras pessoas.
- Um link de teste (Preview) da Vercel para o branch: a conferência é local.

## 9. O que seria um fracasso (anti-goals)

- A Descobrir ficar mais lenta ou deixar de ser guardada no servidor por causa do login.
- Exigir login para só navegar.
- Uma pessoa conseguir ver ou mexer na lista de outra.
- Um filme aparecer nas duas listas ao mesmo tempo.
- Mensagens de erro em inglês ou técnicas para quem usa o site.
- Mexer no `main` antes de o dono conferir no navegador.
- Um recrutador abrir o site e o login não funcionar porque o Supabase "dormiu".

## 10. O que fica com o builder

- Visual exato das abas, dos botões, do menu da conta e da página `/entrar`, seguindo o estilo atual.
- Rotas das abas pessoais (respeitando a seção 4.1), nome do parâmetro de retorno e nome do arquivo de migração.
- Como mostrar o estado do filme sem deixar a página de detalhes lenta.
- Como o cabeçalho descobre o usuário sem quebrar o cache.
- Guardar ou não uma cópia dos dados do filme na tabela. Paginação das grades.
- Estratégia de teste do login no e2e.
