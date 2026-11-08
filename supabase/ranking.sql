-- ════════════════════════════════════════════════════════════════════════════
-- Street Bogotá · Ranking online y gamificación (Supabase / Postgres 15+)
-- Todo lleva el prefijo sbog_ (tablas, índices y funciones) para convivir con
-- otros rankings en la misma base de datos sin tocar sus tablas.
-- Pega todo en Supabase → SQL Editor → Run. Se puede volver a ejecutar:
-- las tablas usan "if not exists" y las funciones "create or replace".
--
-- Modelo de seguridad (sin cuentas ni contraseñas):
--   · El navegador guarda un "secret" aleatorio la primera vez que registra
--     un usuario. Solo se guarda su hash SHA-256; ese secret es lo que prueba
--     que el usuario es tuyo (otro jugador no puede publicar con tu nombre).
--   · Las tablas NO se pueden leer ni escribir directo con la publishable key:
--     todo pasa por las funciones RPC de abajo, que validan cada dato.
--   · Es un juego de navegador: alguien con conocimientos puede inventar un
--     puntaje llamando la RPC a mano. Los límites (tope de puntos, 1 envío
--     cada 15 s, nivel 1–12) frenan lo obvio; borra trampas desde el panel.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── 1. Jugadores ────────────────────────────────────────────────────────────
create table if not exists public.sbog_players (
  id                uuid primary key default gen_random_uuid(),
  username          text not null,
  username_key      text generated always as (lower(username)) stored,
  secret_hash       text not null,
  runs              integer not null default 0,
  wins              integer not null default 0,
  total_score       bigint  not null default 0,
  best_score        integer not null default 0,
  best_fighter    text,
  best_level        integer not null default 0,
  xp                integer not null default 0,
  fighters_played text[]  not null default '{}',
  last_submit_at    timestamptz,
  created_at        timestamptz not null default now(),
  constraint sbog_players_username_format check (username ~ '^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$'),
  constraint sbog_players_username_key unique (username_key)
);
create index if not exists sbog_players_best_score_idx on public.sbog_players (best_score desc, created_at);

-- ── 2. Partidas (cada puntaje registrado) ───────────────────────────────────
create table if not exists public.sbog_scores (
  id             bigint generated always as identity primary key,
  player_id      uuid not null references public.sbog_players (id) on delete cascade,
  score          integer not null check (score between 0 and 2000000),
  fighter      text    not null check (fighter in ('office','student','teleperforman','gymbro','magolita')),
  level_reached  integer not null check (level_reached between 1 and 12),
  won            boolean not null default false,
  continues_used integer not null default 0 check (continues_used between 0 and 10),
  duration_s     integer check (duration_s between 0 and 86400),
  created_at     timestamptz not null default now()
);
create index if not exists sbog_scores_created_score_idx on public.sbog_scores (created_at desc, score desc);
create index if not exists sbog_scores_player_idx on public.sbog_scores (player_id, created_at desc);

-- Bases creadas con la versión anterior (campaña de 11 niveles): amplía el rango a 12.
alter table public.sbog_scores drop constraint if exists sbog_scores_level_reached_check;
alter table public.sbog_scores add constraint sbog_scores_level_reached_check check (level_reached between 1 and 12);

-- ── 3. Logros ───────────────────────────────────────────────────────────────
create table if not exists public.sbog_achievements (
  code        text primary key,
  title       text not null,
  description text not null,
  icon        text not null default '★',
  points      integer not null default 10,  -- XP extra al desbloquearlo
  sort        integer not null default 0
);

create table if not exists public.sbog_player_achievements (
  player_id   uuid not null references public.sbog_players (id) on delete cascade,
  code        text not null references public.sbog_achievements (code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (player_id, code)
);

insert into public.sbog_achievements (code, title, description, icon, points, sort) values
  ('primera_vuelta',   'Primera vuelta',    'Registra tu primer puntaje.',                        '🚶', 10,  1),
  ('diez_mil',         '10K',               '10.000 puntos en una partida.',                      '💰', 20,  2),
  ('cincuenta_mil',    '50K',               '50.000 puntos en una partida.',                      '💸', 40,  3),
  ('cien_mil',         '100K',              '100.000 puntos en una partida.',                     '🤑', 80,  4),
  ('aura_farmer',      'Aura farmer',       'Gánale al Gordo del Aura en Gran Estación.',         '✨', 30,  5),
  ('media_bogota',     'Media Bogotá',      'Llega a Calles del centro (nivel 7).',         '🚌', 30,  6),
  ('bogota_despejada', 'Bogotá despejada',  'Termina la campaña completa.',                       '🏙️', 100, 7),
  ('sin_fiado',        'Sin pedir fiado',   'Termina la campaña sin usar continuaciones.',        '👑', 150, 8),
  ('todo_el_parche',   'Todo el parche',    'Juega con los 5 personajes.',                        '🧑‍🤝‍🧑', 50, 9),
  ('constante',        'Constante',         'Registra 10 partidas.',                              '📅', 30, 10),
  ('veterano',         'Veterano',          'Registra 50 partidas.',                              '🎖️', 60, 11),
  ('superacion',       'Superación',        'Mejora tu propio récord.',                           '📈', 10, 12)
on conflict (code) do update set
  title = excluded.title, description = excluded.description, icon = excluded.icon,
  points = excluded.points, sort = excluded.sort;

-- ── 4. Niveles de jugador (XP → nivel → título) ─────────────────────────────
-- Nivel n necesita 250·(n−1)² XP: 2 → 250, 3 → 1.000, 4 → 2.250, 5 → 4.000…
create or replace function public.sbog_level(p_xp integer)
returns integer language sql immutable set search_path = '' as $$
  select 1 + floor(sqrt(greatest(coalesce(p_xp, 0), 0) / 250.0))::integer
$$;

create or replace function public.sbog_title(p_level integer)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_level >= 15 then 'Rey de Bogotá'
    when p_level >= 11 then 'Leyenda de la Séptima'
    when p_level >= 8  then 'Duro de la cuadra'
    when p_level >= 6  then 'Bacán'
    when p_level >= 4  then 'Parcero'
    when p_level >= 2  then 'Ciclista'
    else 'Peatón'
  end
$$;

-- ── 5. RPC: ¿el usuario está libre, es mío o es de otro? ────────────────────
create or replace function public.sbog_check_username(p_username text, p_secret text)
returns text language plpgsql stable security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  p_username := btrim(p_username);
  if p_username is null or p_username !~ '^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$' then return 'invalid'; end if;
  select secret_hash into v_hash from public.sbog_players where username_key = lower(p_username);
  if not found then return 'free'; end if;
  if v_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex') then return 'mine'; end if;
  return 'taken';
end $$;

-- ── 6. RPC: registrar un puntaje (crea el usuario la primera vez) ───────────
create or replace function public.sbog_submit_score(
  p_username  text,
  p_secret    text,
  p_score     integer,
  p_character text,
  p_level     integer,
  p_won       boolean default false,
  p_continues integer default 0,
  p_duration  integer default null
) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_player    public.sbog_players;
  v_hash      text;
  v_prev_best integer;
  v_unlocked  jsonb := '[]'::jsonb;
  v_points    integer := 0;
  v_gain      integer;
  v_rank      integer;
  v_level     integer;
begin
  p_username := btrim(p_username);
  if p_username is null or p_username !~ '^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  if p_secret is null or length(p_secret) not between 24 and 128 then
    raise exception 'invalid_secret' using errcode = '22023';
  end if;
  if p_score is null or p_score not between 0 and 2000000 then
    raise exception 'invalid_score' using errcode = '22023';
  end if;
  if p_character is null or p_character not in ('office','student','teleperforman','gymbro','magolita') then
    raise exception 'invalid_character' using errcode = '22023';
  end if;
  if p_level is null or p_level not between 1 and 12 then
    raise exception 'invalid_level' using errcode = '22023';
  end if;
  p_won       := coalesce(p_won, false) and p_level = 12;
  p_continues := least(greatest(coalesce(p_continues, 0), 0), 10);
  if p_duration is not null then p_duration := least(greatest(p_duration, 0), 86400); end if;
  v_hash := encode(digest(p_secret, 'sha256'), 'hex');

  select * into v_player from public.sbog_players where username_key = lower(p_username) for update;
  if not found then
    begin
      insert into public.sbog_players (username, secret_hash) values (p_username, v_hash) returning * into v_player;
    exception when unique_violation then
      raise exception 'username_taken' using errcode = '28000';
    end;
  elsif v_player.secret_hash <> v_hash then
    raise exception 'username_taken' using errcode = '28000';
  elsif v_player.last_submit_at > now() - interval '15 seconds' then
    raise exception 'too_fast' using errcode = '54000';
  end if;

  v_prev_best := v_player.best_score;
  insert into public.sbog_scores (player_id, score, fighter, level_reached, won, continues_used, duration_s)
  values (v_player.id, p_score, p_character, p_level, p_won, p_continues, p_duration);

  update public.sbog_players set
    runs              = runs + 1,
    wins              = wins + case when p_won then 1 else 0 end,
    total_score       = total_score + p_score,
    best_score        = greatest(best_score, p_score),
    best_fighter    = case when p_score > best_score or best_fighter is null then p_character else best_fighter end,
    best_level        = greatest(best_level, p_level),
    fighters_played = case when p_character = any (fighters_played) then fighters_played
                             else fighters_played || p_character end,
    last_submit_at    = now()
  where id = v_player.id
  returning * into v_player;

  -- logros nuevos de esta partida
  with candidates (code) as (
    select c from (values
      ('primera_vuelta',   true),
      ('diez_mil',         p_score >= 10000),
      ('cincuenta_mil',    p_score >= 50000),
      ('cien_mil',         p_score >= 100000),
      ('aura_farmer',      p_level >= 12),
      ('media_bogota',     p_level >= 7),
      ('bogota_despejada', p_won),
      ('sin_fiado',        p_won and p_continues = 0),
      ('todo_el_parche',   cardinality(v_player.fighters_played) >= 5),
      ('constante',        v_player.runs >= 10),
      ('veterano',         v_player.runs >= 50),
      ('superacion',       v_prev_best > 0 and p_score > v_prev_best)
    ) as t (c, ok) where ok
  ), inserted as (
    insert into public.sbog_player_achievements (player_id, code)
    select v_player.id, code from candidates
    on conflict do nothing
    returning code
  )
  select coalesce(jsonb_agg(jsonb_build_object('code', a.code, 'title', a.title, 'description', a.description,
                                               'icon', a.icon, 'points', a.points) order by a.sort), '[]'::jsonb),
         coalesce(sum(a.points), 0)::integer
    into v_unlocked, v_points
    from inserted i join public.sbog_achievements a on a.code = i.code;

  -- XP: 10 por jugar + 1 por cada 100 puntos + bonus de logros
  v_gain := 10 + p_score / 100 + v_points;
  update public.sbog_players set xp = xp + v_gain where id = v_player.id returning * into v_player;
  v_level := public.sbog_level(v_player.xp);

  select count(*)::integer + 1 into v_rank from public.sbog_players where best_score > v_player.best_score;

  return jsonb_build_object(
    'ok',            true,
    'username',      v_player.username,
    'rank',          v_rank,
    'new_best',      p_score > v_prev_best,
    'best_score',    v_player.best_score,
    'runs',          v_player.runs,
    'xp',            v_player.xp,
    'xp_gained',     v_gain,
    'level',         v_level,
    'title',         public.sbog_title(v_level),
    'level_xp',      250 * (v_level - 1) * (v_level - 1),
    'next_level_xp', 250 * v_level * v_level,
    'unlocked',      v_unlocked
  );
end $$;

-- ── 7. RPC: tabla de posiciones ('all' = histórico, 'week' = últimos 7 días) ─
create or replace function public.sbog_get_leaderboard(p_period text default 'all', p_limit integer default 10)
returns table (rank integer, username text, score integer, fighter text, level_reached integer,
               player_level integer, title text)
language sql stable security definer set search_path = public as $$
  with best as (
    select p.id, p.username, p.best_score as score, p.best_fighter as fighter, p.best_level as level_reached,
           p.xp, p.created_at as since
      from public.sbog_players p
     where coalesce(p_period, 'all') <> 'week' and p.best_score > 0
    union all
    select * from (
      select distinct on (s.player_id) p.id, p.username, s.score, s.fighter, s.level_reached, p.xp, s.created_at
        from public.sbog_scores s join public.sbog_players p on p.id = s.player_id
       where p_period = 'week' and s.created_at > now() - interval '7 days' and s.score > 0
       order by s.player_id, s.score desc, s.created_at
    ) w
  )
  select (rank() over (order by score desc, since))::integer, username, score, fighter, level_reached,
         public.sbog_level(xp), public.sbog_title(public.sbog_level(xp))
    from best
   order by score desc, since
   limit least(greatest(coalesce(p_limit, 10), 1), 50)
$$;

-- ── 8. RPC: perfil público de un jugador (stats + todos los logros) ─────────
create or replace function public.sbog_get_player(p_username text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username',       p.username,
    'runs',           p.runs,
    'wins',           p.wins,
    'best_score',     p.best_score,
    'best_fighter', p.best_fighter,
    'best_level',     p.best_level,
    'total_score',    p.total_score,
    'xp',             p.xp,
    'level',          public.sbog_level(p.xp),
    'title',          public.sbog_title(public.sbog_level(p.xp)),
    'level_xp',       250 * (public.sbog_level(p.xp) - 1) * (public.sbog_level(p.xp) - 1),
    'next_level_xp',  250 * public.sbog_level(p.xp) * public.sbog_level(p.xp),
    'rank',           (select count(*)::integer + 1 from public.sbog_players o where o.best_score > p.best_score),
    'achievements',   (select coalesce(jsonb_agg(jsonb_build_object(
                         'code', a.code, 'title', a.title, 'description', a.description, 'icon', a.icon,
                         'points', a.points, 'unlocked_at', pa.unlocked_at) order by a.sort), '[]'::jsonb)
                         from public.sbog_achievements a
                         left join public.sbog_player_achievements pa on pa.code = a.code and pa.player_id = p.id)
  )
  from public.sbog_players p
  where p.username_key = lower(btrim(p_username))
$$;

-- ── 9. Permisos: tablas cerradas, solo las RPC quedan expuestas ─────────────
alter table public.sbog_players             enable row level security;
alter table public.sbog_scores              enable row level security;
alter table public.sbog_achievements        enable row level security;
alter table public.sbog_player_achievements enable row level security;

revoke all on public.sbog_players, public.sbog_scores, public.sbog_player_achievements from anon, authenticated;
revoke insert, update, delete on public.sbog_achievements from anon, authenticated;
grant select on public.sbog_achievements to anon, authenticated;
drop policy if exists "achievements are public" on public.sbog_achievements;
create policy "achievements are public" on public.sbog_achievements for select to anon, authenticated using (true);

revoke execute on function public.sbog_submit_score(text, text, integer, text, integer, boolean, integer, integer) from public;
revoke execute on function public.sbog_check_username(text, text) from public;
revoke execute on function public.sbog_get_leaderboard(text, integer) from public;
revoke execute on function public.sbog_get_player(text) from public;
grant execute on function public.sbog_submit_score(text, text, integer, text, integer, boolean, integer, integer) to anon, authenticated;
grant execute on function public.sbog_check_username(text, text) to anon, authenticated;
grant execute on function public.sbog_get_leaderboard(text, integer) to anon, authenticated;
grant execute on function public.sbog_get_player(text) to anon, authenticated;
grant execute on function public.sbog_level(integer), public.sbog_title(integer) to anon, authenticated;
