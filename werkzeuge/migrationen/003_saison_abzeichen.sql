-- 003 Saison-Abzeichen (0.10.0). Darf mehrfach laufen.
-- Eine Saison ist ein Kalendermonat (Europe/Berlin). Nach Monatsende bekommen die Top 3 je Wertung ein Abzeichen:
-- punkte, siege (aus den Raumspielen) und sprint:<kategorie> (bester Sprint im Monat). Erste Saison: 2026-11.

create table if not exists public.abzeichen (
  id bigint generated always as identity primary key,
  saison text not null,                 -- 'JJJJ-MM'
  wertung text not null,                -- 'punkte' | 'siege' | 'sprint:<kategorie>'
  platz int not null check (platz between 1 and 3),
  user_id uuid not null references public.profile(id) on delete cascade,
  wert int not null,
  vergeben timestamptz not null default now(),
  unique (saison, wertung, platz)
);
create index if not exists abzeichen_user on public.abzeichen (user_id);
alter table public.abzeichen enable row level security;
drop policy if exists "abzeichen lesen" on public.abzeichen;
create policy "abzeichen lesen" on public.abzeichen for select using (true);
revoke all on public.abzeichen from anon, authenticated;
grant select on public.abzeichen to anon, authenticated;

create table if not exists public.saisons (
  saison text primary key,
  abgeschlossen timestamptz not null default now(),
  von uuid
);
alter table public.saisons enable row level security;
drop policy if exists "saisons lesen" on public.saisons;
create policy "saisons lesen" on public.saisons for select using (true);
revoke all on public.saisons from anon, authenticated;
grant select on public.saisons to anon, authenticated;

-- Schließt eine beendete Saison ab und vergibt die Abzeichen. Jeder darf das auslösen (die Seite macht es von selbst),
-- es passiert aber nur einmal und nur für Monate, die vorbei sind. Rückgabe: Anzahl neuer Abzeichen.
create or replace function public.saison_abschliessen(p_saison text) returns int
language plpgsql security definer set search_path = public as $$
declare
  j int; m int; v timestamptz; b timestamptz; n int := 0; k text; z int;
begin
  if coalesce(p_saison, '') !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Saison im Format JJJJ-MM angeben.'; end if;
  j := split_part(p_saison, '-', 1)::int; m := split_part(p_saison, '-', 2)::int;
  if m < 1 or m > 12 then raise exception 'Ungültiger Monat.'; end if;
  if p_saison < '2026-11' then return 0; end if;
  v := make_timestamptz(j, m, 1, 0, 0, 0, 'Europe/Berlin');
  b := make_timestamptz(case when m = 12 then j + 1 else j end, case when m = 12 then 1 else m + 1 end, 1, 0, 0, 0, 'Europe/Berlin');
  if now() < b then raise exception 'Die Saison läuft noch.'; end if;
  perform pg_advisory_xact_lock(hashtext('qb-saison:' || p_saison));
  if exists (select 1 from public.saisons where saison = p_saison) then return 0; end if;

  -- Raumspiele des Monats je sichtbarem Spieler (Zuordnung über den Namen, wie auf der Seite)
  create temp table if not exists qb_je (uid uuid, punkte int, siege int) on commit drop;
  delete from qb_je;
  insert into qb_je
  select p.id, sum(coalesce((e.val->>'pkt')::int, 0))::int,
    (count(*) filter (where e.ord = 1 and jsonb_array_length(s.spieler) > 1 and coalesce((e.val->>'pkt')::int, 0) > 0))::int
  from public.spiele s
  cross join lateral jsonb_array_elements(s.spieler) with ordinality as e(val, ord)
  join public.profile p on lower(p.name) = lower(e.val->>'name')
  where s.am >= v and s.am < b and coalesce(s.kategorie, '') <> 'spiele'
    and not p.versteckt and not p.deaktiviert and (p.gesperrt_bis is null or p.gesperrt_bis < now())
  group by p.id;

  insert into public.abzeichen (saison, wertung, platz, user_id, wert)
  select p_saison, 'punkte', rn, uid, punkte
  from (select uid, punkte, row_number() over (order by punkte desc, siege desc, uid) as rn from qb_je where punkte > 0) x
  where rn <= 3;
  get diagnostics z = row_count; n := n + z;

  insert into public.abzeichen (saison, wertung, platz, user_id, wert)
  select p_saison, 'siege', rn, uid, siege
  from (select uid, siege, row_number() over (order by siege desc, punkte desc, uid) as rn from qb_je where siege > 0) x
  where rn <= 3;
  get diagnostics z = row_count; n := n + z;

  -- Sprints: bester Lauf je Spieler und Kategorie, bei Gleichstand zählt, wer ihn zuerst hatte
  for k in select distinct kategorie from public.sprint_laeufe where am >= v and am < b loop
    insert into public.abzeichen (saison, wertung, platz, user_id, wert)
    select p_saison, 'sprint:' || k, rn, uid, wert
    from (
      select bl.von as uid, bl.wert, row_number() over (order by bl.wert desc, bl.am asc) as rn
      from (select distinct on (l.von) l.von, l.wert, l.am from public.sprint_laeufe l
            where l.kategorie = k and l.am >= v and l.am < b and l.wert > 0
            order by l.von, l.wert desc, l.am asc) bl
      join public.profile p on p.id = bl.von
      where not p.versteckt and not p.deaktiviert and (p.gesperrt_bis is null or p.gesperrt_bis < now())
    ) x where rn <= 3;
    get diagnostics z = row_count; n := n + z;
  end loop;

  insert into public.saisons (saison, von) values (p_saison, auth.uid());
  if public.is_admin() then
    insert into public.admin_log (admin, aktion, details) values (auth.uid(), 'saison', jsonb_build_object('saison', p_saison, 'abzeichen', n));
  end if;
  return n;
end $$;
revoke all on function public.saison_abschliessen(text) from public;
grant execute on function public.saison_abschliessen(text) to anon, authenticated;

select (select count(*) from public.abzeichen) as abzeichen, (select count(*) from public.saisons) as saisons;
