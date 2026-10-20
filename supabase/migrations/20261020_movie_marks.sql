-- Tabela das marcações de filmes de cada usuário (Quero assistir / Já assisti).
-- Pode ser rodada mais de uma vez sem erro.

-- 1) A tabela. Cada usuário tem no máximo um estado por filme (chave primária).
create table if not exists public.movie_marks (
  -- Dono da marcação. Preenchido sozinho com o usuário logado.
  -- Se a conta for apagada, as marcações somem junto.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Número do filme no TMDB (sempre positivo).
  movie_id integer not null check (movie_id > 0),
  -- Só dois estados são aceitos.
  status text not null check (status in ('quero_assistir', 'ja_assisti')),
  -- Quando a marcação foi criada/alterada (as listas mostram os mais recentes primeiro).
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

-- 2) Índice para listar rápido as marcações de um usuário por estado.
create index if not exists movie_marks_user_status_updated_idx
  on public.movie_marks (user_id, status, updated_at desc);

-- 3) Segurança por linha (RLS): sem isso, qualquer um poderia ler os dados dos outros.
alter table public.movie_marks enable row level security;

-- 4) Permissões da tabela: usuários logados (authenticated) podem ler e mexer (limitados pelas regras abaixo).
grant select, insert, update, delete on public.movie_marks to authenticated;
-- Visitantes (anon) só podem ler, para o aviso diário que mantém o projeto acordado.
-- Sem política para anon, a leitura volta 0 linhas: nenhum dado é exposto.
revoke insert, update, delete on public.movie_marks from anon;
grant select on public.movie_marks to anon;

-- 5) Regras (políticas): cada usuário só enxerga e mexe nas próprias linhas.
-- Ver só as próprias marcações.
drop policy if exists "movie_marks_select_own" on public.movie_marks;
create policy "movie_marks_select_own" on public.movie_marks
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Criar marcações só em seu próprio nome.
drop policy if exists "movie_marks_insert_own" on public.movie_marks;
create policy "movie_marks_insert_own" on public.movie_marks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Alterar só as próprias marcações (e não dá para passar para outro dono).
drop policy if exists "movie_marks_update_own" on public.movie_marks;
create policy "movie_marks_update_own" on public.movie_marks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Apagar só as próprias marcações.
drop policy if exists "movie_marks_delete_own" on public.movie_marks;
create policy "movie_marks_delete_own" on public.movie_marks
  for delete to authenticated
  using ((select auth.uid()) = user_id);
