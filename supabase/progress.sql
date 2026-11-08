-- ════════════════════════════════════════════════════════════════════════════
-- Street Bogotá · Avance guardado en la nube (Supabase / Postgres 15+)
-- Requiere supabase/ranking.sql (usa sbog_players y su "secret").
-- Pega todo en Supabase → SQL Editor → Run. Se puede volver a ejecutar.
--
-- Cada jugador tiene UN documento jsonb con su avance: niveles pasados,
-- tarjetas, colores, récord de supervivencia y lo que se agregue después.
-- El juego mezcla el documento local con el de la nube antes de enviarlo
-- (nunca se pierde un desbloqueo), y aquí se hace una mezcla por llave:
-- las llaves que no vienen en el envío se conservan.
-- El mismo secret del ranking prueba que el avance es tuyo; el "código de
-- recuperación" que muestra el juego es ese secret, para usarlo en otro equipo.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sbog_saves (
  player_id  uuid primary key references public.sbog_players (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  version    integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint sbog_saves_data_object check (jsonb_typeof(data) = 'object'),
  constraint sbog_saves_data_size check (pg_column_size(data) <= 32768)
);

-- ── RPC: leer el avance (null si el usuario aún no existe) ──────────────────
create or replace function public.sbog_load_progress(p_username text, p_secret text)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare v_player public.sbog_players; v_save public.sbog_saves;
begin
  p_username := btrim(p_username);
  if p_username is null or p_username !~ '^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  select * into v_player from public.sbog_players where username_key = lower(p_username);
  if not found then return jsonb_build_object('exists', false, 'data', null); end if;
  if v_player.secret_hash <> encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex') then
    raise exception 'username_taken' using errcode = '28000';
  end if;
  select * into v_save from public.sbog_saves where player_id = v_player.id;
  return jsonb_build_object('exists', true, 'username', v_player.username,
    'data', coalesce(v_save.data, '{}'::jsonb), 'version', coalesce(v_save.version, 0), 'updated_at', v_save.updated_at);
end $$;

-- ── RPC: guardar el avance (crea el usuario la primera vez) ─────────────────
create or replace function public.sbog_save_progress(p_username text, p_secret text, p_data jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_player public.sbog_players; v_hash text; v_save public.sbog_saves;
begin
  p_username := btrim(p_username);
  if p_username is null or p_username !~ '^[A-Za-z0-9_ÑñÁÉÍÓÚÜáéíóúü-]{3,16}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  if p_secret is null or length(p_secret) not between 24 and 128 then
    raise exception 'invalid_secret' using errcode = '22023';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 32768 then
    raise exception 'invalid_progress' using errcode = '22023';
  end if;
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
  end if;

  select * into v_save from public.sbog_saves where player_id = v_player.id for update;
  if found and v_save.updated_at > now() - interval '2 seconds' then
    raise exception 'too_fast' using errcode = '54000';
  end if;

  insert into public.sbog_saves (player_id, data) values (v_player.id, p_data)
  on conflict (player_id) do update set
    data       = public.sbog_saves.data || excluded.data,
    version    = public.sbog_saves.version + 1,
    updated_at = now()
  returning * into v_save;

  return jsonb_build_object('ok', true, 'username', v_player.username, 'data', v_save.data,
                            'version', v_save.version, 'updated_at', v_save.updated_at);
end $$;

alter table public.sbog_saves enable row level security;
revoke all on public.sbog_saves from anon, authenticated;
revoke execute on function public.sbog_load_progress(text, text) from public;
revoke execute on function public.sbog_save_progress(text, text, jsonb) from public;
grant execute on function public.sbog_load_progress(text, text) to anon, authenticated;
grant execute on function public.sbog_save_progress(text, text, jsonb) to anon, authenticated;
