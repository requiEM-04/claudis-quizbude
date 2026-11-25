-- 007 Winterquest gegen Nebenkonten absichern (0.10.2). Darf mehrfach laufen.
-- Ein Raumspiel zählt nur, wenn mindestens zwei andere Konten dabei waren, die älter als 7 Tage sind,
-- und alle anderen im Raum (auch Gäste) Punkte geholt haben. Ein Sieg zählt nur in so einem Raum mit mindestens 1.000 Punkten.
-- Stufe 2 zählt Sprint-Treffer (selbst erspielt) statt Sprints.
drop function if exists public.qb_winterquest(uuid, text);
create or replace function public.qb_winterquest(p_uid uuid, p_name text) returns table (raumspiele int, siege int, treffer int)
language sql stable security definer set search_path = public as $$
  with zeit as (select make_timestamptz(2026, 12, 1, 0, 0, 0, 'Europe/Berlin') as v, make_timestamptz(2027, 1, 1, 0, 0, 0, 'Europe/Berlin') as b),
  sp as (
    select s.am, s.spieler from public.spiele s, zeit
    where s.am >= zeit.v and s.am < zeit.b and coalesce(s.kategorie, '') <> 'spiele'
      and exists (select 1 from jsonb_array_elements(s.spieler) e where lower(e->>'name') = lower(p_name))
  ),
  bewertet as (
    select sp.spieler,
      (select count(*) from jsonb_array_elements(sp.spieler) e join public.profile p on lower(p.name) = lower(e->>'name')
        where lower(e->>'name') <> lower(p_name) and p.erstellt < sp.am - interval '7 days' and coalesce((e->>'pkt')::int, 0) > 0) as andere,
      (select count(*) from jsonb_array_elements(sp.spieler) e
        where lower(e->>'name') <> lower(p_name) and coalesce((e->>'pkt')::int, 0) <= 0) as leer
    from sp
  )
  select
    (select count(*) from bewertet where andere >= 2 and leer = 0)::int,
    (select count(*) from bewertet where andere >= 2 and leer = 0
       and lower(spieler->0->>'name') = lower(p_name) and coalesce((spieler->0->>'pkt')::int, 0) >= 1000)::int,
    (select coalesce(sum(l.wert), 0) from public.sprint_laeufe l, zeit where l.von = p_uid and l.am >= zeit.v and l.am < zeit.b)::int;
$$;
revoke all on function public.qb_winterquest(uuid, text) from public, anon, authenticated;

create or replace function public.winterquest_stand() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare n text; r record;
begin
  if auth.uid() is null then return null; end if;
  select name into n from public.profile where id = auth.uid();
  if n is null then return null; end if;
  select * into r from public.qb_winterquest(auth.uid(), n);
  return jsonb_build_object('raumspiele', r.raumspiele, 'siege', r.siege, 'treffer', r.treffer);
end $$;
revoke all on function public.winterquest_stand() from public, anon;
grant execute on function public.winterquest_stand() to authenticated;

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
  if r.treffer < 250 then return false; end if;
  if art = 'effekt' then return true; end if;
  return r.siege >= 3;
end $$;
revoke all on function public.qb_sonder_frei(text, text, uuid, text, timestamptz) from public, anon, authenticated;

select * from public.qb_winterquest(gen_random_uuid(), 'requiEM');
