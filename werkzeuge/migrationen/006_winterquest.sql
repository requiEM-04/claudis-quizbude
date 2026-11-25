-- 006 Winter und Winterquest (0.10.1). Darf mehrfach laufen.
-- Winterzauber (hintergrund 'winter'): ab 1.12.2026 für alle Konten, die vor dem 1.1.2027 angelegt wurden.
-- Winterquest im Dezember 2026, drei Stufen nacheinander:
--   1) 10 Raumspiele        -> Rahmen 'eis' (Eiskristall)
--   2) zusätzlich 15 Sprints -> Effekt 'schnee' (Schneegestöber)
--   3) zusätzlich 3 Siege    -> Hintergrund 'weihnacht' (Weihnachtsnacht)
-- Gezählt wird nur, was im Dezember 2026 (Europe/Berlin) gespielt wurde. Einmal erreicht, bleibt es.

create or replace function public.qb_winterquest(p_uid uuid, p_name text) returns table (raumspiele int, siege int, sprints int)
language sql stable security definer set search_path = public as $$
  with zeit as (select make_timestamptz(2026, 12, 1, 0, 0, 0, 'Europe/Berlin') as v, make_timestamptz(2027, 1, 1, 0, 0, 0, 'Europe/Berlin') as b),
  sp as (
    select e.ord, s.spieler, e.val
    from public.spiele s cross join zeit
    cross join lateral jsonb_array_elements(s.spieler) with ordinality as e(val, ord)
    where s.am >= zeit.v and s.am < zeit.b and coalesce(s.kategorie, '') <> 'spiele' and lower(e.val->>'name') = lower(p_name)
  )
  select (select count(*) from sp)::int,
    (select count(*) from sp where ord = 1 and jsonb_array_length(spieler) > 1 and coalesce((val->>'pkt')::int, 0) > 0)::int,
    (select count(*) from public.sprint_laeufe l, zeit where l.von = p_uid and l.am >= zeit.v and l.am < zeit.b)::int;
$$;
revoke all on function public.qb_winterquest(uuid, text) from public, anon, authenticated;

-- Stand für die Seite (nur das eigene Konto)
create or replace function public.winterquest_stand() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare n text; r record;
begin
  if auth.uid() is null then return null; end if;
  select name into n from public.profile where id = auth.uid();
  if n is null then return null; end if;
  select * into r from public.qb_winterquest(auth.uid(), n);
  return jsonb_build_object('raumspiele', r.raumspiele, 'siege', r.siege, 'sprints', r.sprints);
end $$;
revoke all on function public.winterquest_stand() from public, anon;
grant execute on function public.winterquest_stand() to authenticated;

drop function if exists public.qb_sonder_frei(text, text, timestamptz);
create or replace function public.qb_sonder_frei(art text, wert text, p_uid uuid, p_name text, p_erstellt timestamptz) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if art = 'hintergrund' and wert = 'winter' then
    return now() >= make_timestamptz(2026, 12, 1, 0, 0, 0, 'Europe/Berlin') and p_erstellt < make_timestamptz(2027, 1, 1, 0, 0, 0, 'Europe/Berlin');
  end if;
  if not ((art = 'rahmen' and wert = 'eis') or (art = 'effekt' and wert = 'schnee') or (art = 'hintergrund' and wert = 'weihnacht')) then return false; end if;
  select * into r from public.qb_winterquest(p_uid, p_name);
  if r.raumspiele < 10 then return false; end if;
  if art = 'rahmen' then return true; end if;
  if r.sprints < 15 then return false; end if;
  if art = 'effekt' then return true; end if;
  return r.siege >= 3;
end $$;
revoke all on function public.qb_sonder_frei(text, text, uuid, text, timestamptz) from public, anon, authenticated;

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
    if public.qb_stil_frei(k, v, st) or public.qb_sonder_frei(k, v, new.id, new.name, new.erstellt) then neu := neu || jsonb_build_object(k, v);
    elsif geaendert then raise exception 'Das ist noch nicht freigeschaltet.';
    end if;
  end loop;
  new.stil := neu;
  return new;
end $$;

select public.qb_sonder_frei('hintergrund', 'winter', gen_random_uuid(), 'x', now()) as winter_heute,
       (select count(*) from public.qb_winterquest(gen_random_uuid(), 'requiEM')) as probe;
