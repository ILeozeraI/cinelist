-- "Batida do coração" diária que mantém o Supabase gratuito acordado.
-- Uma consulta só de leitura (que ainda voltava 0 linhas por causa da RLS) não bastou:
-- o Supabase pausou o projeto mesmo com o cron rodando. Agora o cron grava no banco.
-- Pode ser rodada mais de uma vez sem erro.

-- 1) Tabela de uma linha só: quando foi a última batida e quantas já houve.
--    Serve também para você conferir no Table Editor que o cron está rodando todo dia.
create table if not exists public.keepalive (
  id smallint primary key default 1 check (id = 1),
  last_ping timestamptz not null default now(),
  pings bigint not null default 0
);

-- 2) Ninguém lê nem escreve na tabela direto pela API; só pela função abaixo.
alter table public.keepalive enable row level security;
revoke all on public.keepalive from anon, authenticated;

-- 3) A função grava a hora atual (e soma 1 na contagem). Ela não recebe nenhum dado,
--    então quem a chamar só consegue atualizar esse horário, nada mais.
create or replace function public.manter_acordado()
returns timestamptz
language sql
security definer
set search_path = ''
as $$
  insert into public.keepalive as k (id, last_ping, pings)
  values (1, now(), 1)
  on conflict (id) do update set last_ping = now(), pings = k.pings + 1
  returning last_ping;
$$;

-- 4) Só o visitante anônimo (a chave pública usada pelo cron) pode chamar a função.
revoke all on function public.manter_acordado() from public, anon, authenticated;
grant execute on function public.manter_acordado() to anon;
