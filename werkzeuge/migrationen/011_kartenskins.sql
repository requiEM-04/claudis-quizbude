-- 011: Kartenskins (profile.stil.skin), freigeschaltet über Abzeichen. Mehrfach ausführbar.
-- Die Grenzen müssen zu ERFOLGE in js/abzeichen.js passen (Bronze … Diamant = Stufe 1 … 5).

-- Wie viele Abzeichen hat ein Profil mindestens in Stufe p_stufe?
create or replace function public.qb_abzeichen_anzahl(p public.profile, p_stufe int) returns int
language sql stable security definer set search_path = public as $$
  with w(wert, grenzen) as (values
    (p.spiele::bigint, array[5, 25, 75, 200, 500]),
    (p.siege::bigint, array[1, 10, 30, 100, 250]),
    (p.richtig::bigint, array[25, 150, 500, 1500, 4000]),
    (p.punkte::bigint, array[2500, 15000, 50000, 150000, 400000]),
    (p.sprints::bigint, array[5, 25, 75, 200, 500]),
    (coalesce(p.sprint_treffer, 0)::bigint, array[50, 300, 1000, 3000, 8000]),
    ((select count(*) from public.abzeichen a where a.user_id = p.id)::bigint, array[1, 3, 6, 12, 24]),
    (greatest(coalesce(p.sprint_rekord, 0), coalesce((p.rekorde->>'flaggen')::int, 0))::bigint, array[8, 14, 20, 26, 32]),
    (coalesce((p.rekorde->>'karte')::int, 0)::bigint, array[4, 8, 12, 16, 20]),
    (coalesce((p.rekorde->>'umrisse')::int, 0)::bigint, array[5, 10, 15, 20, 25]),
    (coalesce((p.rekorde->>'hauptstaedte')::int, 0)::bigint, array[5, 10, 15, 20, 25]),
    (coalesce((p.rekorde->>'stadtland')::int, 0)::bigint, array[5, 10, 15, 20, 25]),
    (coalesce((p.rekorde->>'nachbarn')::int, 0)::bigint, array[5, 10, 15, 20, 25]),
    (coalesce((p.rekorde->>'buchstaben')::int, 0)::bigint, array[4, 8, 12, 16, 20]),
    (coalesce((p.rekorde->>'groesser')::int, 0)::bigint, array[10, 16, 22, 28, 34]),
    (coalesce((p.rekorde->>'wissen')::int, 0)::bigint, array[4, 8, 12, 16, 20]),
    (coalesce((p.rekorde->>'gemischt')::int, 0)::bigint, array[6, 12, 18, 24, 30])
  )
  select count(*)::int from w where (select count(*) from unnest(grenzen) g where g <= wert) >= p_stufe;
$$;
revoke all on function public.qb_abzeichen_anzahl(public.profile, int) from public, anon, authenticated;

create or replace function public.qb_skin_frei(p_wert text, p public.profile) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_wert
    when 'gewitter' then public.qb_abzeichen_anzahl(p, 2) >= 5
    when 'matrix' then public.qb_abzeichen_anzahl(p, 3) >= 1
    when 'frost' then public.qb_abzeichen_anzahl(p, 3) >= 3
    when 'toxisch' then public.qb_abzeichen_anzahl(p, 4) >= 1
    when 'lava' then public.qb_abzeichen_anzahl(p, 4) >= 3
    when 'galaxie' then public.qb_abzeichen_anzahl(p, 5) >= 1
    when 'meister' then exists (select 1 from public.abzeichen a where a.user_id = p.id)
    else false end;
$$;
revoke all on function public.qb_skin_frei(text, public.profile) from public, anon, authenticated;

-- Stil-Prüfung beim Speichern: jetzt auch mit Skin
create or replace function public.qb_profil_ruhm() returns trigger
language plpgsql security definer set search_path = public as $$
declare st int; k text; v text; neu jsonb := '{}'::jsonb; geaendert boolean;
begin
  new.ruhm := public.qb_ruhm_aus(new);
  if new.stil is null or jsonb_typeof(new.stil) <> 'object' then new.stil := '{}'::jsonb; end if;
  st := public.qb_ruhm_stufe(new.ruhm);
  if tg_op = 'INSERT' then geaendert := true; else geaendert := new.stil is distinct from old.stil; end if;
  for k, v in select key, value from jsonb_each_text(new.stil) loop
    if v is null or v = '' then continue; end if;
    if public.qb_stil_frei(k, v, st)
       or public.qb_sonder_frei(k, v, new.id, new.name, new.erstellt)
       or public.qb_bild_frei(k, v, st, new.id)
       or (k = 'skin' and public.qb_skin_frei(v, new)) then
      neu := neu || jsonb_build_object(k, v);
    elsif geaendert then raise exception 'Das ist noch nicht freigeschaltet.';
    end if;
  end loop;
  new.stil := neu;
  return new;
end $$;

-- Kontrolle: Abzeichen je Stufe für alle Konten (soll zur Seite passen)
select name, public.qb_abzeichen_anzahl(p, 1) as bronze_plus, public.qb_abzeichen_anzahl(p, 2) as silber_plus,
       public.qb_abzeichen_anzahl(p, 3) as gold_plus, public.qb_skin_frei('gewitter', p) as gewitter
from public.profile p order by name;
