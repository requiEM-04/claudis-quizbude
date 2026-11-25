-- 008 Winterquest mit Tagesaufgaben (0.10.3). Darf mehrfach laufen.
-- Jeden Tag im Dezember 2026 drei Aufgaben für alle (leicht 8, mittel 10, schwer 12 Schneeflocken, zusammen 30).
-- Stufen: 100 Schneeflocken -> Rahmen Eiskristall, 200 -> Effekt Schneegestöber, 300 -> Hintergrund Weihnachtsnacht.
-- Gezählt wird je Berliner Kalendertag aus spiele (Raumspiele mit mind. 2 Leuten) und sprint_laeufe.
create table if not exists public.winter_aufgaben (
  tag date not null, nr int not null, stufe text not null, typ text not null, ziel int not null, kategorie text, flocken int not null,
  primary key (tag, nr)
);
alter table public.winter_aufgaben enable row level security;
drop policy if exists "winter_aufgaben lesen" on public.winter_aufgaben;
create policy "winter_aufgaben lesen" on public.winter_aufgaben for select using (true);
revoke all on public.winter_aufgaben from anon, authenticated;
grant select on public.winter_aufgaben to anon, authenticated;
delete from public.winter_aufgaben;
insert into public.winter_aufgaben (tag, nr, stufe, typ, ziel, kategorie, flocken) values
  ('2026-12-01', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-01', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-01', 3, 'schwer', 'sprint_kat', 12, 'groesser', 12),
  ('2026-12-02', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-02', 2, 'mittel', 'raumpunkte', 2000, null, 10),
  ('2026-12-02', 3, 'schwer', 'sprint_kat', 12, 'groesser', 12),
  ('2026-12-03', 1, 'leicht', 'sprint_kat', 5, 'gemischt', 8),
  ('2026-12-03', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-03', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-04', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-04', 2, 'mittel', 'sprint_kat', 8, 'flaggen', 10),
  ('2026-12-04', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-05', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-05', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-05', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-06', 1, 'leicht', 'sprint_kat', 3, 'wissen', 8),
  ('2026-12-06', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-06', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-07', 1, 'leicht', 'sprint_kat', 5, 'umrisse', 8),
  ('2026-12-07', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-07', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-08', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-08', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-08', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-09', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-09', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-09', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-10', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-10', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-10', 3, 'schwer', 'treffer', 100, null, 12),
  ('2026-12-11', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-11', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-11', 3, 'schwer', 'sprint_kat', 12, 'groesser', 12),
  ('2026-12-12', 1, 'leicht', 'sprint_kat', 5, 'gemischt', 8),
  ('2026-12-12', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-12', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-13', 1, 'leicht', 'sprint_kat', 5, 'hauptstaedte', 8),
  ('2026-12-13', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-13', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-14', 1, 'leicht', 'sprint_kat', 5, 'groesser', 8),
  ('2026-12-14', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-14', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-15', 1, 'leicht', 'treffer', 30, null, 8),
  ('2026-12-15', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-15', 3, 'schwer', 'sprint_kat', 7, 'wissen', 12),
  ('2026-12-16', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-16', 2, 'mittel', 'sprint_kat', 8, 'hauptstaedte', 10),
  ('2026-12-16', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-17', 1, 'leicht', 'treffer', 30, null, 8),
  ('2026-12-17', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-17', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-18', 1, 'leicht', 'raumspiele', 2, null, 8),
  ('2026-12-18', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-18', 3, 'schwer', 'sprint_kat', 12, 'umrisse', 12),
  ('2026-12-19', 1, 'leicht', 'sprint_kat', 3, 'wissen', 8),
  ('2026-12-19', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-19', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-20', 1, 'leicht', 'sprint_kat', 5, 'hauptstaedte', 8),
  ('2026-12-20', 2, 'mittel', 'raumpunkte', 2000, null, 10),
  ('2026-12-20', 3, 'schwer', 'treffer', 100, null, 12),
  ('2026-12-21', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-21', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-21', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-22', 1, 'leicht', 'treffer', 30, null, 8),
  ('2026-12-22', 2, 'mittel', 'sprint_kat', 8, 'hauptstaedte', 10),
  ('2026-12-22', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-23', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-23', 2, 'mittel', 'raumpunkte', 2000, null, 10),
  ('2026-12-23', 3, 'schwer', 'treffer', 100, null, 12),
  ('2026-12-24', 1, 'leicht', 'sprint_kat', 5, 'hauptstaedte', 8),
  ('2026-12-24', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-24', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-25', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-25', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-25', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-26', 1, 'leicht', 'sprint_kat', 3, 'wissen', 8),
  ('2026-12-26', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-26', 3, 'schwer', 'sprint_best', 16, null, 12),
  ('2026-12-27', 1, 'leicht', 'treffer', 30, null, 8),
  ('2026-12-27', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-27', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-28', 1, 'leicht', 'sprint_best', 8, null, 8),
  ('2026-12-28', 2, 'mittel', 'treffer', 60, null, 10),
  ('2026-12-28', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-29', 1, 'leicht', 'treffer', 30, null, 8),
  ('2026-12-29', 2, 'mittel', 'sprint_best', 12, null, 10),
  ('2026-12-29', 3, 'schwer', 'raumpunkte', 4000, null, 12),
  ('2026-12-30', 1, 'leicht', 'sprint_kat', 5, 'flaggen', 8),
  ('2026-12-30', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-30', 3, 'schwer', 'raumsieg', 1, null, 12),
  ('2026-12-31', 1, 'leicht', 'sprint_kat', 5, 'groesser', 8),
  ('2026-12-31', 2, 'mittel', 'raumspiele', 4, null, 10),
  ('2026-12-31', 3, 'schwer', 'raumpunkte', 4000, null, 12);

-- Wert einer Aufgabe für ein Konto an ihrem Tag
create or replace function public.qb_aufgabe_wert(p_uid uuid, p_name text, p_typ text, p_kat text, p_tag date) returns int
language sql stable security definer set search_path = public as $$
  with zeit as (select make_timestamptz(extract(year from p_tag)::int, extract(month from p_tag)::int, extract(day from p_tag)::int, 0, 0, 0, 'Europe/Berlin') as v),
  z as (select v, v + interval '1 day' as b from zeit),
  raum as (
    select e.ord, s.spieler, e.val from public.spiele s, z
    cross join lateral jsonb_array_elements(s.spieler) with ordinality as e(val, ord)
    where s.am >= z.v and s.am < z.b and coalesce(s.kategorie, '') <> 'spiele' and jsonb_array_length(s.spieler) >= 2
      and lower(e.val->>'name') = lower(p_name)
  ),
  lauf as (select l.wert, l.kategorie from public.sprint_laeufe l, z where l.von = p_uid and l.am >= z.v and l.am < z.b)
  select (case p_typ
    when 'raumspiele' then (select count(*) from raum)
    when 'raumpunkte' then (select coalesce(sum(coalesce((val->>'pkt')::int, 0)), 0) from raum)
    when 'raumsieg' then (select count(*) from raum where ord = 1 and coalesce((val->>'pkt')::int, 0) > 0)
    when 'treffer' then (select coalesce(sum(wert), 0) from lauf)
    when 'sprint_best' then (select coalesce(max(wert), 0) from lauf)
    when 'sprint_kat' then (select coalesce(max(wert), 0) from lauf where kategorie = p_kat)
    else 0 end)::int;
$$;
revoke all on function public.qb_aufgabe_wert(uuid, text, text, text, date) from public, anon, authenticated;

-- Schneeflocken gesamt (alle Dezembertage bis heute)
create or replace function public.qb_winter_flocken(p_uid uuid, p_name text) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(a.flocken), 0)::int from public.winter_aufgaben a
  where a.tag <= (now() at time zone 'Europe/Berlin')::date
    and public.qb_aufgabe_wert(p_uid, p_name, a.typ, a.kategorie, a.tag) >= a.ziel;
$$;
revoke all on function public.qb_winter_flocken(uuid, text) from public, anon, authenticated;

-- Stand für die Seite: Schneeflocken gesamt und die Aufgaben von heute mit Fortschritt
drop function if exists public.winterquest_stand();
create or replace function public.winterquest_stand() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare n text; heute date := (now() at time zone 'Europe/Berlin')::date;
begin
  if auth.uid() is null then return null; end if;
  select name into n from public.profile where id = auth.uid();
  if n is null then return null; end if;
  return jsonb_build_object(
    'flocken', public.qb_winter_flocken(auth.uid(), n),
    'heute', coalesce((select jsonb_agg(jsonb_build_object('nr', a.nr, 'stufe', a.stufe, 'typ', a.typ, 'ziel', a.ziel, 'kategorie', a.kategorie, 'flocken', a.flocken,
        'wert', public.qb_aufgabe_wert(auth.uid(), n, a.typ, a.kategorie, a.tag)) order by a.nr)
      from public.winter_aufgaben a where a.tag = heute), '[]'::jsonb));
end $$;
revoke all on function public.winterquest_stand() from public, anon;
grant execute on function public.winterquest_stand() to authenticated;

create or replace function public.qb_sonder_frei(art text, wert text, p_uid uuid, p_name text, p_erstellt timestamptz) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare f int;
begin
  if art = 'hintergrund' and wert = 'winter' then
    return now() >= make_timestamptz(2026, 12, 1, 0, 0, 0, 'Europe/Berlin') and p_erstellt < make_timestamptz(2027, 1, 1, 0, 0, 0, 'Europe/Berlin');
  end if;
  if not ((art = 'rahmen' and wert = 'eis') or (art = 'effekt' and wert = 'schnee') or (art = 'hintergrund' and wert = 'weihnacht')) then return false; end if;
  f := public.qb_winter_flocken(p_uid, p_name);
  return case art when 'rahmen' then f >= 100 when 'effekt' then f >= 200 else f >= 300 end;
end $$;
revoke all on function public.qb_sonder_frei(text, text, uuid, text, timestamptz) from public, anon, authenticated;

select count(*) as aufgaben, sum(flocken) as flocken_moeglich from public.winter_aufgaben;
