-- 005 Winterzauber (0.10.0): Hintergrund „weihnacht“ ab 1.12.2026 für alle Konten, die vor dem 1.1.2027 angelegt wurden.
-- Bleibt danach für immer. Darf mehrfach laufen.
create or replace function public.qb_sonder_frei(art text, wert text, erstellt timestamptz) returns boolean
language sql stable as $$
  select art = 'hintergrund' and wert = 'weihnacht'
    and now() >= make_timestamptz(2026, 12, 1, 0, 0, 0, 'Europe/Berlin')
    and erstellt < make_timestamptz(2027, 1, 1, 0, 0, 0, 'Europe/Berlin');
$$;

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
    if public.qb_stil_frei(k, v, st) or public.qb_sonder_frei(k, v, new.erstellt) then neu := neu || jsonb_build_object(k, v);
    elsif geaendert then raise exception 'Das ist noch nicht freigeschaltet.';
    end if;
  end loop;
  new.stil := neu;
  return new;
end $$;

select public.qb_sonder_frei('hintergrund', 'weihnacht', now()) as heute_schon_frei;
