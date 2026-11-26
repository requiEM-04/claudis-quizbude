-- 0.15.0: Sprint-Rekorde auch für Mehr oder weniger und Bombe
create or replace function public.sprint_eintragen(p_wert int, p_kategorie text default 'flaggen') returns int
language plpgsql security definer set search_path = public as $$
declare
  k text := coalesce(p_kategorie, 'flaggen');
  w int := least(greatest(coalesce(p_wert, 0), 0), 300);
  r int;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if k not in ('flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben', 'kennzeichen', 'groesser', 'mehr', 'schaetzen', 'bombe', 'wissen', 'emoji', 'gemischt') then
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

-- Kontrolle: erwartet true
select position('bombe' in pg_get_functiondef('public.sprint_eintragen(int, text)'::regprocedure)) > 0 as kennt_bombe;
