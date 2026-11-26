-- 010: Freunde (Anfrage per Name, annehmen/ablehnen, entfernen) und Sprint für Nachbarn und Buchstabensalat.
-- Mehrfach ausführbar. Online-Status und Einladungen laufen über Realtime (Kanal qb-online), nicht über Tabellen.

create table if not exists public.freunde (
  id bigint generated always as identity primary key,
  von uuid not null references public.profile(id) on delete cascade,
  an uuid not null references public.profile(id) on delete cascade,
  status text not null default 'offen' check (status in ('offen', 'ok')),
  am timestamptz not null default now(),
  unique (von, an),
  check (von <> an)
);
create index if not exists freunde_an on public.freunde (an);
alter table public.freunde enable row level security;
revoke all on public.freunde from anon, authenticated;
grant select on public.freunde to authenticated;
drop policy if exists "eigene freunde lesen" on public.freunde;
create policy "eigene freunde lesen" on public.freunde for select to authenticated using (von = auth.uid() or an = auth.uid());

-- Anfrage per Name. Gibt zurück: gesendet | angenommen (Gegenanfrage lag schon vor) | schon | unbekannt | selbst | voll
create or replace function public.freund_anfragen(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare ich uuid := auth.uid(); ziel uuid; vorhanden public.freunde;
begin
  if ich is null then raise exception 'Nicht angemeldet'; end if;
  select id into ziel from public.profile
    where lower(name) = lower(trim(p_name)) and not coalesce(deaktiviert, false) and not coalesce(versteckt, false) limit 1;
  if ziel is null then return 'unbekannt'; end if;
  if ziel = ich then return 'selbst'; end if;
  select * into vorhanden from public.freunde where (von = ich and an = ziel) or (von = ziel and an = ich) limit 1;
  if found then
    if vorhanden.status = 'offen' and vorhanden.an = ich then
      update public.freunde set status = 'ok', am = now() where id = vorhanden.id;
      return 'angenommen';
    end if;
    return 'schon';
  end if;
  if (select count(*) from public.freunde where von = ich or an = ich) >= 100 then return 'voll'; end if;
  insert into public.freunde (von, an) values (ich, ziel);
  return 'gesendet';
end $$;

-- Eingegangene Anfrage annehmen oder ablehnen
create or replace function public.freund_antworten(p_id bigint, p_annehmen boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if p_annehmen then
    update public.freunde set status = 'ok', am = now() where id = p_id and an = auth.uid() and status = 'offen';
  else
    delete from public.freunde where id = p_id and an = auth.uid() and status = 'offen';
  end if;
end $$;

-- Freundschaft oder eigene Anfrage zurückziehen (beide Richtungen)
create or replace function public.freund_entfernen(p_andere uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  delete from public.freunde where (von = auth.uid() and an = p_andere) or (von = p_andere and an = auth.uid());
end $$;

-- Eigene Liste mit Profil der anderen Seite. richtung: 'ein' (an mich), 'aus' (von mir)
create or replace function public.freunde_liste()
returns table (id bigint, andere uuid, name text, avatar text, farbe text, ruhm int, stil jsonb, status text, richtung text, am timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, p.id, p.name, p.avatar, p.farbe, p.ruhm, p.stil, f.status, case when f.an = auth.uid() then 'ein' else 'aus' end, f.am
  from public.freunde f
  join public.profile p on p.id = case when f.von = auth.uid() then f.an else f.von end
  where (f.von = auth.uid() or f.an = auth.uid()) and not coalesce(p.deaktiviert, false)
  order by f.status, p.name;
$$;

revoke all on function public.freund_anfragen(text) from public, anon;
revoke all on function public.freund_antworten(bigint, boolean) from public, anon;
revoke all on function public.freund_entfernen(uuid) from public, anon;
revoke all on function public.freunde_liste() from public, anon;
grant execute on function public.freund_anfragen(text) to authenticated;
grant execute on function public.freund_antworten(bigint, boolean) to authenticated;
grant execute on function public.freund_entfernen(uuid) to authenticated;
grant execute on function public.freunde_liste() to authenticated;

-- Sprint: Nachbarn und Buchstabensalat zulassen
create or replace function public.sprint_eintragen(p_wert int, p_kategorie text default 'flaggen') returns int
language plpgsql security definer set search_path = public as $$
declare
  k text := coalesce(p_kategorie, 'flaggen');
  w int := least(greatest(coalesce(p_wert, 0), 0), 300);
  r int;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if k not in ('flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben', 'groesser', 'wissen', 'emoji', 'gemischt') then
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

-- Kontrolle: erwartet freunde_da = t, 4 Funktionen
select to_regclass('public.freunde') is not null as freunde_da,
       (select count(*) from pg_proc where proname in ('freund_anfragen', 'freund_antworten', 'freund_entfernen', 'freunde_liste')) as funktionen;
