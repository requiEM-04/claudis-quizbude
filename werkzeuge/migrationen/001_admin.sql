-- 001 Admin-Bereich (0.9.3). Darf mehrfach laufen.
-- Admin ist ein eigenes Konto: requiem-admin@quizbude.app, angelegt im Supabase-Dashboard (ohne Namen in den Metadaten).
-- Anmelden auf der Seite mit dem Namen „admin“, danach geht es auf admin.html.

-- Wer ist Admin ---------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  seit timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Protokoll aller Admin-Aktionen ---------------------------------------
create table if not exists public.admin_log (
  id bigint generated always as identity primary key,
  am timestamptz not null default now(),
  admin uuid,
  aktion text not null,
  ziel uuid,
  ziel_name text,
  details jsonb
);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;

create or replace function public.qb_admin_log(p_aktion text, p_ziel uuid, p_details jsonb default null) returns void
language sql security definer set search_path = public as $$
  insert into public.admin_log (admin, aktion, ziel, ziel_name, details)
  values (auth.uid(), p_aktion, p_ziel, (select name from public.profile where id = p_ziel), p_details);
$$;
revoke all on function public.qb_admin_log(text, uuid, jsonb) from public, anon, authenticated;

-- Einstellungen, die alle lesen dürfen ---------------------------------
create table if not exists public.config (
  schluessel text primary key,
  wert jsonb not null,
  geaendert timestamptz not null default now()
);
alter table public.config enable row level security;
drop policy if exists "config lesen" on public.config;
create policy "config lesen" on public.config for select using (true);
revoke all on public.config from anon, authenticated;
grant select on public.config to anon, authenticated;
insert into public.config (schluessel, wert) values
  ('nachricht', '{"text": "", "an": false}'),
  ('neue_konten', '{"an": true}')
on conflict (schluessel) do nothing;

-- Neue Spalten im Profil -------------------------------------------------
alter table public.profile add column if not exists ruhm_extra int not null default 0;
alter table public.profile add column if not exists gesperrt_bis timestamptz;
alter table public.profile add column if not exists sperr_grund text;
alter table public.profile add column if not exists versteckt boolean not null default false;
alter table public.profile add column if not exists deaktiviert boolean not null default false;

-- Ruhm zählt geschenkten Ruhm mit
create or replace function public.qb_ruhm_aus(p public.profile) returns int
language sql immutable as $$
  select greatest(0, p.spiele * 10 + p.richtig * 3 + p.siege * 20 + p.sprints * 4 + p.sprint_treffer
    + greatest(p.sprint_rekord, coalesce((p.rekorde->>'flaggen')::int, 0))
    + coalesce((select sum(v::int) from jsonb_each_text(p.rekorde) as e(k, v) where k <> 'flaggen' and v ~ '^[0-9]+$'), 0)
    + coalesce(p.ruhm_extra, 0))::int;
$$;

-- Fällt jemand unter eine Stufe (Ruhm abgezogen), wird nicht mehr Freies still abgelegt statt zu scheitern
create or replace function public.qb_profil_ruhm() returns trigger
language plpgsql as $$
declare st int; k text; v text; neu jsonb := '{}'::jsonb; geaendert boolean;
begin
  new.ruhm := public.qb_ruhm_aus(new);
  if new.stil is null or jsonb_typeof(new.stil) <> 'object' then new.stil := '{}'::jsonb; end if;
  st := public.qb_ruhm_stufe(new.ruhm);
  if tg_op = 'INSERT' then geaendert := true; else geaendert := new.stil is distinct from old.stil; end if;
  for k, v in select key, value from jsonb_each_text(new.stil) loop
    if v is null or v = '' then continue; end if;
    if public.qb_stil_frei(k, v, st) then neu := neu || jsonb_build_object(k, v);
    elsif geaendert then raise exception 'Das ist noch nicht freigeschaltet.';
    end if;
  end loop;
  new.stil := neu;
  return new;
end $$;

-- Name -> Anmelde-Adresse, genau wie auf der Seite
create or replace function public.qb_mail(n text) returns text
language sql immutable as $$
  select regexp_replace(replace(replace(replace(replace(replace(lower(n), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), '.', '-'), '[^a-z0-9_-]', '', 'g') || '@quizbude.app';
$$;

-- Neue Konten: Admin bekommt kein Profil, „admin“ im Namen ist reserviert, Anmeldung lässt sich schließen
create or replace function public.qb_neuer_nutzer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Gast' || substr(new.id::text, 1, 4));
  a text := coalesce(new.raw_user_meta_data->>'avatar', '🦊');
  f text := coalesce(new.raw_user_meta_data->>'farbe', '#F2B531');
begin
  if lower(new.email) = 'requiem-admin@quizbude.app' then
    if new.raw_user_meta_data ? 'name' then raise exception 'Dieser Name ist reserviert.'; end if;
    insert into public.admins (user_id) values (new.id) on conflict do nothing;
    return new;
  end if;
  if lower(n) like '%admin%' or lower(new.email) like '%admin%' then raise exception 'Dieser Name ist reserviert.'; end if;
  if coalesce((select (wert->>'an')::boolean from public.config where schluessel = 'neue_konten'), true) = false then
    raise exception 'Gerade können keine neuen Konten angelegt werden.';
  end if;
  if char_length(a) > 8 then a := '🦊'; end if;
  if f !~ '^#[0-9A-Fa-f]{6}$' then f := '#F2B531'; end if;
  insert into public.profile (id, name, avatar, farbe) values (new.id, left(n, 16), a, f);
  return new;
end $$;

-- Falls das Admin-Konto schon existiert
insert into public.admins (user_id)
  select id from auth.users where lower(email) = 'requiem-admin@quizbude.app' and not (coalesce(raw_user_meta_data, '{}'::jsonb) ? 'name')
  on conflict do nothing;
delete from public.profile where id in (select user_id from public.admins);

-- Sprint-Bestenliste ohne versteckte, gesperrte und deaktivierte Spieler
create or replace function public.sprint_bestenliste(p_kategorie text, p_seit timestamptz default null)
returns table (id uuid, name text, avatar text, farbe text, ruhm int, stil jsonb, wert int)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, x.wert
    from (select von, max(wert)::int as wert from public.sprint_laeufe
          where kategorie = p_kategorie and p_seit is not null and am >= p_seit group by von) x
    join public.profile p on p.id = x.von
    where x.wert > 0 and not p.versteckt and not p.deaktiviert and (p.gesperrt_bis is null or p.gesperrt_bis < now())
    union all
    select p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, (p.rekorde->>p_kategorie)::int
    from public.profile p
    where p_seit is null and coalesce((p.rekorde->>p_kategorie)::int, 0) > 0
      and not p.versteckt and not p.deaktiviert and (p.gesperrt_bis is null or p.gesperrt_bis < now())
  ) t order by wert desc, name limit 15;
$$;
revoke all on function public.sprint_bestenliste(text, timestamptz) from public;
grant execute on function public.sprint_bestenliste(text, timestamptz) to anon, authenticated;

-- Admin-Funktionen ------------------------------------------------------
create or replace function public.admin_uebersicht() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  return jsonb_build_object(
    'spieler', (select count(*) from public.profile),
    'heute_aktiv', (select count(*) from public.profile where zuletzt > now() - interval '24 hours'),
    'woche_aktiv', (select count(*) from public.profile where zuletzt > now() - interval '7 days'),
    'spiele_heute', (select count(*) from public.spiele where am > now() - interval '24 hours'),
    'spiele_gesamt', (select count(*) from public.spiele),
    'sprints_heute', (select count(*) from public.sprint_laeufe where am > now() - interval '24 hours'),
    'sprints_gesamt', (select count(*) from public.sprint_laeufe),
    'gesperrt', (select count(*) from public.profile where gesperrt_bis > now()),
    'versteckt', (select count(*) from public.profile where versteckt),
    'deaktiviert', (select count(*) from public.profile where deaktiviert)
  );
end $$;

create or replace function public.admin_spieler() returns table (
  id uuid, name text, avatar text, farbe text, ruhm int, stil jsonb, spiele int, siege int, punkte bigint, richtig int,
  sprints int, sprint_treffer int, rekorde jsonb, erstellt timestamptz, zuletzt timestamptz, letzte_anmeldung timestamptz,
  ruhm_extra int, gesperrt_bis timestamptz, sperr_grund text, versteckt boolean, deaktiviert boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  return query
    select p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, p.spiele, p.siege, p.punkte, p.richtig,
      p.sprints, p.sprint_treffer, p.rekorde, p.erstellt, p.zuletzt, u.last_sign_in_at,
      p.ruhm_extra, p.gesperrt_bis, p.sperr_grund, p.versteckt, p.deaktiviert
    from public.profile p left join auth.users u on u.id = p.id
    order by p.zuletzt desc;
end $$;

create or replace function public.admin_umbenennen(p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare alt text; n text := trim(coalesce(p_name, ''));
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  if char_length(n) < 3 or char_length(n) > 16 or n !~ '^[A-Za-zÄÖÜäöüß0-9_.-]+$' then
    raise exception 'Der Name braucht 3 bis 16 Zeichen: Buchstaben, Ziffern, Punkt, Strich oder Unterstrich.';
  end if;
  if lower(n) like '%admin%' then raise exception 'Dieser Name ist reserviert.'; end if;
  if exists (select 1 from public.profile where lower(name) = lower(n) and id <> p_id)
     or exists (select 1 from auth.users where lower(email) = public.qb_mail(n) and id <> p_id) then
    raise exception 'Den Namen gibt es schon.';
  end if;
  select name into alt from public.profile where id = p_id;
  if alt is null then raise exception 'Spieler nicht gefunden.'; end if;
  update public.profile set name = n where id = p_id;
  update auth.users set email = public.qb_mail(n),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', n)
  where id = p_id;
  -- alte Spiele auf den neuen Namen umschreiben, damit die Saison-Punkte bleiben
  update public.spiele set spieler = (
    select jsonb_agg(case when e->>'name' = alt then jsonb_set(e, '{name}', to_jsonb(n)) else e end)
    from jsonb_array_elements(spieler) e)
  where spieler @> jsonb_build_array(jsonb_build_object('name', alt));
  perform public.qb_admin_log('umbenennen', p_id, jsonb_build_object('alt', alt, 'neu', n));
end $$;

create or replace function public.admin_passwort(p_id uuid, p_pw text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  if char_length(coalesce(p_pw, '')) < 4 then raise exception 'Das Passwort braucht mindestens 4 Zeichen.'; end if;
  if exists (select 1 from public.admins where user_id = p_id) then raise exception 'Das Admin-Passwort änderst du im Supabase-Dashboard.'; end if;
  -- die Seite hängt an jedes Passwort #qb26 an (Supabase will mindestens 6 Zeichen)
  update auth.users set encrypted_password = extensions.crypt(p_pw || '#qb26', extensions.gen_salt('bf')) where id = p_id;
  if not found then raise exception 'Spieler nicht gefunden.'; end if;
  perform public.qb_admin_log('passwort', p_id, null);
end $$;

create or replace function public.admin_sperren(p_id uuid, p_stunden int, p_grund text) returns void
language plpgsql security definer set search_path = public as $$
declare bis timestamptz := case when coalesce(p_stunden, 0) <= 0 then '9999-12-31'::timestamptz else now() + make_interval(hours => p_stunden) end;
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  update public.profile set gesperrt_bis = bis, sperr_grund = left(nullif(trim(coalesce(p_grund, '')), ''), 200) where id = p_id;
  if not found then raise exception 'Spieler nicht gefunden.'; end if;
  perform public.qb_admin_log('sperren', p_id, jsonb_build_object('bis', bis, 'grund', p_grund));
end $$;

create or replace function public.admin_entsperren(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  update public.profile set gesperrt_bis = null, sperr_grund = null where id = p_id;
  perform public.qb_admin_log('entsperren', p_id, null);
end $$;

create or replace function public.admin_verstecken(p_id uuid, p_an boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  update public.profile set versteckt = coalesce(p_an, false) where id = p_id;
  perform public.qb_admin_log(case when p_an then 'aus_bestenliste' else 'in_bestenliste' end, p_id, null);
end $$;

create or replace function public.admin_deaktivieren(p_id uuid, p_an boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  update public.profile set deaktiviert = coalesce(p_an, false) where id = p_id;
  perform public.qb_admin_log(case when p_an then 'deaktivieren' else 'aktivieren' end, p_id, null);
end $$;

create or replace function public.admin_ruhm(p_id uuid, p_menge int) returns int
language plpgsql security definer set search_path = public as $$
declare r int;
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  if p_menge is null or p_menge = 0 or abs(p_menge) > 100000 then raise exception 'Menge zwischen -100000 und 100000, nicht 0.'; end if;
  update public.profile set ruhm_extra = ruhm_extra + p_menge where id = p_id returning ruhm into r;
  if r is null then raise exception 'Spieler nicht gefunden.'; end if;
  perform public.qb_admin_log('ruhm', p_id, jsonb_build_object('menge', p_menge, 'neu', r));
  return r;
end $$;

create or replace function public.admin_config(p_schluessel text, p_wert jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  if p_schluessel not in ('nachricht', 'neue_konten') then raise exception 'Unbekannte Einstellung.'; end if;
  if p_schluessel = 'nachricht' and char_length(coalesce(p_wert->>'text', '')) > 200 then raise exception 'Höchstens 200 Zeichen.'; end if;
  insert into public.config (schluessel, wert, geaendert) values (p_schluessel, p_wert, now())
  on conflict (schluessel) do update set wert = excluded.wert, geaendert = now();
  perform public.qb_admin_log('einstellung', null, jsonb_build_object('schluessel', p_schluessel, 'wert', p_wert));
end $$;

create or replace function public.admin_protokoll(p_anzahl int default 100) returns setof public.admin_log
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Kein Admin'; end if;
  return query select * from public.admin_log order by am desc limit least(greatest(coalesce(p_anzahl, 100), 1), 500);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_uebersicht()', 'admin_spieler()', 'admin_umbenennen(uuid, text)', 'admin_passwort(uuid, text)',
    'admin_sperren(uuid, int, text)', 'admin_entsperren(uuid)', 'admin_verstecken(uuid, boolean)',
    'admin_deaktivieren(uuid, boolean)', 'admin_ruhm(uuid, int)', 'admin_config(text, jsonb)', 'admin_protokoll(int)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
