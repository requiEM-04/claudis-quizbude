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

-- Sprint je Kategorie, jeder Lauf mit Datum (Saison-Wertung)
create table if not exists public.sprint_laeufe (
  id bigint generated always as identity primary key,
  am timestamptz not null default now(),
  von uuid not null references auth.users on delete cascade,
  kategorie text not null,
  wert int not null
);
create index if not exists sprint_laeufe_kat_am on public.sprint_laeufe (kategorie, am);
alter table public.sprint_laeufe enable row level security;
revoke all on public.sprint_laeufe from anon, authenticated;

create or replace function public.sprint_eintragen(p_wert int, p_kategorie text default 'flaggen') returns int
language plpgsql security definer set search_path = public as $$
declare
  k text := coalesce(p_kategorie, 'flaggen');
  w int := least(greatest(coalesce(p_wert, 0), 0), 300);
  r int;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if k not in ('flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'groesser', 'wissen', 'emoji', 'gemischt') then
    raise exception 'Unbekannte Kategorie';
  end if;
  insert into public.sprint_laeufe (von, kategorie, wert) values (auth.uid(), k, w);
  update public.profile set
    sprints = sprints + 1,
    sprint_treffer = sprint_treffer + w,
    sprint_rekord = case when k = 'flaggen' then greatest(sprint_rekord, w) else sprint_rekord end,
    rekorde = jsonb_set(rekorde, array[k], to_jsonb(greatest(coalesce((rekorde->>k)::int, 0), w))),
    zuletzt = now()
  where id = auth.uid()
  returning (rekorde->>k)::int into r;
  return r;
end $$;

-- sprint_bestenliste: siehe Ruhm-Abschnitt unten (liefert seit 0.8.0 auch ruhm und stil)

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

-- 0.8.0: Ruhm ------------------------------------------------------------
-- Ruhm wird aus der Statistik berechnet (Trigger), damit er immer stimmt und rückwirkend für alle gilt.
alter table public.profile add column if not exists ruhm int not null default 0;
alter table public.profile add column if not exists stil jsonb not null default '{}'::jsonb;

-- Mitspielen 10, richtige Antwort 3, Sieg 20, Sprint 4, Sprint-Treffer 1, dazu die Summe der Sprint-Rekorde
alter table public.profile add column if not exists sprint_treffer int not null default 0;
create or replace function public.qb_ruhm_aus(p public.profile) returns int
language sql immutable as $$
  select (p.spiele * 10 + p.richtig * 3 + p.siege * 20 + p.sprints * 4 + p.sprint_treffer
    + greatest(p.sprint_rekord, coalesce((p.rekorde->>'flaggen')::int, 0))
    + coalesce((select sum(v::int) from jsonb_each_text(p.rekorde) as e(k, v) where k <> 'flaggen' and v ~ '^[0-9]+$'), 0))::int;
$$;

-- Stufe 0 bis 16: Karo-Bube … Karo-Ass, Herz-Bube … Herz-Ass, Pik-…, Kreuz-…, dann Joker
create or replace function public.qb_ruhm_stufe(r int) returns int
language sql immutable as $$
  select (count(*) - 1)::int from unnest(array[0,100,250,450,700,1000,1350,1750,2200,2700,3250,3850,4500,5200,5950,6750,8000]) s where s <= r;
$$;

-- Was ist ab welcher Stufe frei? Je Kartenfarbe: Namensfarbe ab Bube, Titel ab Dame, Effekt ab König, Rahmen und Hintergrund ab Ass
create or replace function public.qb_stil_frei(art text, rang text, stufe int) returns boolean
language sql immutable as $$
  select case
    when art not in ('farbe', 'titel', 'effekt', 'rahmen', 'hintergrund') then false
    when rang = 'joker' then stufe >= 16
    when array_position(array['karo', 'herz', 'pik', 'kreuz'], rang) is null then false
    else stufe >= (array_position(array['karo', 'herz', 'pik', 'kreuz'], rang) - 1) * 4
      + case art when 'farbe' then 0 when 'titel' then 1 when 'effekt' then 2 else 3 end
  end;
$$;

create or replace function public.qb_profil_ruhm() returns trigger
language plpgsql as $$
declare st int; k text; v text;
begin
  new.ruhm := public.qb_ruhm_aus(new);
  if new.stil is null or jsonb_typeof(new.stil) <> 'object' then new.stil := '{}'::jsonb; end if;
  st := public.qb_ruhm_stufe(new.ruhm);
  for k, v in select key, value from jsonb_each_text(new.stil) loop
    if v is null or v = '' then continue; end if;
    if not public.qb_stil_frei(k, v, st) then raise exception 'Das ist noch nicht freigeschaltet.'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists qb_profil_ruhm on public.profile;
create trigger qb_profil_ruhm before insert or update on public.profile for each row execute function public.qb_profil_ruhm();
grant update (avatar, farbe, stil) on public.profile to authenticated;

-- alle Konten nachrechnen (der Trigger setzt den Wert)
update public.profile set ruhm = 0;

-- Sprint-Bestenliste liefert jetzt auch Ruhm und Stil
drop function if exists public.sprint_bestenliste(text, timestamptz);
create or replace function public.sprint_bestenliste(p_kategorie text, p_seit timestamptz default null)
returns table (id uuid, name text, avatar text, farbe text, ruhm int, stil jsonb, wert int)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, x.wert
    from (select von, max(wert)::int as wert from public.sprint_laeufe
          where kategorie = p_kategorie and p_seit is not null and am >= p_seit group by von) x
    join public.profile p on p.id = x.von
    where x.wert > 0
    union all
    select p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, (p.rekorde->>p_kategorie)::int
    from public.profile p
    where p_seit is null and coalesce((p.rekorde->>p_kategorie)::int, 0) > 0
  ) t order by wert desc, name limit 15;
$$;
revoke all on function public.sprint_bestenliste(text, timestamptz) from public;
grant execute on function public.sprint_bestenliste(text, timestamptz) to anon, authenticated;
