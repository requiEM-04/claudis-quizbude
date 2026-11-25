-- Claudis Quizbude – Grundgerüst (Stand 0.3.0) (einmal im Supabase-SQL-Editor ausführen)
-- Konten laufen über Supabase Auth (Name@quizbude.app, E-Mail-Bestätigung aus).
-- Räume und Spiele laufen live über Realtime (Broadcast + Presence), dafür braucht es keine Tabellen.

-- Profile ---------------------------------------------------------------
create table if not exists public.profile (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 3 and 16),
  avatar text not null default '🦊' check (char_length(avatar) <= 8),
  farbe text not null default '#F2B531' check (farbe ~ '^#[0-9A-Fa-f]{6}$'),
  spiele int not null default 0,
  siege int not null default 0,
  punkte bigint not null default 0,
  richtig int not null default 0,
  sprints int not null default 0,
  sprint_rekord int not null default 0,
  rekorde jsonb not null default '{}'::jsonb,   -- Sprint-Rekord je Kategorie
  erstellt timestamptz not null default now(),
  zuletzt timestamptz not null default now()
);
create unique index if not exists profile_name_klein on public.profile (lower(name));
alter table public.profile enable row level security;
drop policy if exists "profile lesen" on public.profile;
create policy "profile lesen" on public.profile for select using (true);
drop policy if exists "eigenes profil aendern" on public.profile;
create policy "eigenes profil aendern" on public.profile for update using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profile from anon, authenticated;
grant select on public.profile to anon, authenticated;
grant update (avatar, farbe) on public.profile to authenticated;

-- Profil automatisch beim Registrieren anlegen
create or replace function public.qb_neuer_nutzer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Gast' || substr(new.id::text, 1, 4));
  a text := coalesce(new.raw_user_meta_data->>'avatar', '🦊');
  f text := coalesce(new.raw_user_meta_data->>'farbe', '#F2B531');
begin
  if char_length(a) > 8 then a := '🦊'; end if;
  if f !~ '^#[0-9A-Fa-f]{6}$' then f := '#F2B531'; end if;
  insert into public.profile (id, name, avatar, farbe) values (new.id, left(n, 16), a, f);
  return new;
end $$;
drop trigger if exists qb_neuer_nutzer on auth.users;
create trigger qb_neuer_nutzer after insert on auth.users for each row execute function public.qb_neuer_nutzer();

-- Statistik nach einem Raum-Spiel (jeder trägt sich selbst ein, mit Obergrenzen)
create or replace function public.spiel_eintragen(p_punkte int, p_richtig int, p_sieg boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  update public.profile set
    spiele = spiele + 1,
    siege = siege + case when p_sieg then 1 else 0 end,
    punkte = punkte + greatest(0, least(coalesce(p_punkte, 0), 6000)),
    richtig = richtig + greatest(0, least(coalesce(p_richtig, 0), 50)),
    zuletzt = now()
  where id = auth.uid();
end $$;
revoke all on function public.spiel_eintragen(int, int, boolean) from public, anon;
grant execute on function public.spiel_eintragen(int, int, boolean) to authenticated;

-- Sprint je Kategorie: gibt den (neuen) Rekord der Kategorie zurück
drop function if exists public.sprint_eintragen(int);
create or replace function public.sprint_eintragen(p_wert int, p_kategorie text default 'flaggen') returns int
language plpgsql security definer set search_path = public as $$
declare
  k text := coalesce(p_kategorie, 'flaggen');
  w int := least(greatest(coalesce(p_wert, 0), 0), 300);
  r int;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if k not in ('flaggen', 'umrisse', 'hauptstaedte', 'groesser', 'wissen', 'emoji', 'gemischt') then
    raise exception 'Unbekannte Kategorie';
  end if;
  update public.profile set
    sprints = sprints + 1,
    sprint_rekord = case when k = 'flaggen' then greatest(sprint_rekord, w) else sprint_rekord end,
    rekorde = jsonb_set(rekorde, array[k], to_jsonb(greatest(coalesce((rekorde->>k)::int, 0), w))),
    zuletzt = now()
  where id = auth.uid()
  returning (rekorde->>k)::int into r;
  return r;
end $$;
revoke all on function public.sprint_eintragen(int, text) from public, anon;
grant execute on function public.sprint_eintragen(int, text) to authenticated;

create or replace function public.sprint_bestenliste(p_kategorie text)
returns table (id uuid, name text, avatar text, farbe text, wert int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.avatar, p.farbe, (p.rekorde->>p_kategorie)::int as wert
  from public.profile p
  where coalesce((p.rekorde->>p_kategorie)::int, 0) > 0
  order by wert desc, p.name
  limit 15;
$$;
revoke all on function public.sprint_bestenliste(text) from public;
grant execute on function public.sprint_bestenliste(text) to anon, authenticated;

-- Verlauf der Raum-Spiele („Zuletzt gespielt") -------------------------
create table if not exists public.spiele (
  id bigint generated always as identity primary key,
  am timestamptz not null default now(),
  von uuid references auth.users on delete set null,
  code text,
  kategorie text,
  runden int,
  modus text,
  auswahl text,
  spieler jsonb not null default '[]'
);
alter table public.spiele enable row level security;
drop policy if exists "spiele lesen" on public.spiele;
create policy "spiele lesen" on public.spiele for select using (true);
revoke all on public.spiele from anon, authenticated;
grant select on public.spiele to anon, authenticated;

create or replace function public.spiel_loggen(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if octet_length(p::text) > 8000 then raise exception 'Eintrag zu groß'; end if;
  insert into public.spiele (von, code, kategorie, runden, modus, auswahl, spieler)
  values (auth.uid(), left(p->>'code', 8), left(p->>'kategorie', 24), least(coalesce((p->>'runden')::int, 0), 50),
          left(p->>'modus', 16), left(p->>'auswahl', 16), coalesce(p->'spieler', '[]'::jsonb));
end $$;
revoke all on function public.spiel_loggen(jsonb) from public, anon;
grant execute on function public.spiel_loggen(jsonb) to authenticated;

-- 0.3.0: Kategorie im Verlauf (für bestehende Datenbanken)
alter table public.spiele add column if not exists kategorie text;
