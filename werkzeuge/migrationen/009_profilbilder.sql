-- 009: Profilbilder. Figur, bewegter Kreis und Rand stehen in profile.stil (figur, kreis, ring)
-- und werden beim Speichern geprüft. Mehrfach ausführbar.
--   Figur:  14 freie Tiere; Quizbot/Herzdrache/Sternwolf/Phönix ab König der Farbe, Hofnarr ab Joker, Löwe für einen Saisonsieg
--   Kreis:  Kupferglut/Herzschlag/Sternennacht/Sonnenrad ab Dame der Farbe, Holo ab Joker (sonst einfache Farbe aus profile.farbe)
--   Rand:   6 Grundfarben frei, Kartenfarben ab Bube, Regenbogen ab Joker, Bronze/Silber/Gold für Platz 3/2/1 in einer Saison

create or replace function public.qb_bild_frei(p_art text, p_wert text, p_stufe int, p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_rang text; v_ab int; v_platz int;
begin
  if p_art = 'figur' then
    if p_wert in ('fuchs', 'frosch', 'panda', 'eule', 'krake', 'pinguin', 'katze', 'igel', 'schildkroete', 'dino', 'biene', 'koala', 'wal', 'papagei') then return true; end if;
    v_rang := case p_wert when 'quizbot' then 'karo' when 'herzdrache' then 'herz' when 'sternwolf' then 'pik' when 'phoenix' then 'kreuz' when 'hofnarr' then 'joker' end;
    if p_wert = 'loewe' then v_platz := 1; end if;
    v_ab := 2;
  elsif p_art = 'kreis' then
    v_rang := case p_wert when 'glut' then 'karo' when 'herzschlag' then 'herz' when 'sternennacht' then 'pik' when 'sonnenrad' then 'kreuz' when 'holo' then 'joker' end;
    v_ab := 1;
  elsif p_art = 'ring' then
    if p_wert in ('weiss', 'sand', 'salbei', 'himmel', 'rose', 'flieder') then return true; end if;
    if p_wert in ('karo', 'herz', 'pik', 'kreuz', 'joker') then v_rang := p_wert; end if;
    v_platz := case p_wert when 'gold' then 1 when 'silber' then 2 when 'bronze' then 3 end;
    v_ab := 0;
  else
    return false;
  end if;
  if v_platz is not null then
    return exists (select 1 from public.abzeichen a where a.user_id = p_uid and a.platz <= v_platz);
  end if;
  if v_rang is null then return false; end if;
  if v_rang = 'joker' then return p_stufe >= 16; end if;
  return p_stufe >= (array_position(array['karo', 'herz', 'pik', 'kreuz'], v_rang) - 1) * 4 + v_ab;
end $$;
revoke all on function public.qb_bild_frei(text, text, int, uuid) from public, anon, authenticated;

-- Stil-Prüfung beim Speichern. Läuft als Besitzer (security definer), weil die Prüf-Funktionen
-- für Spieler gesperrt sind; sie fasst nur die neue Zeile an.
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
       or public.qb_bild_frei(k, v, st, new.id) then
      neu := neu || jsonb_build_object(k, v);
    elsif geaendert then raise exception 'Das ist noch nicht freigeschaltet.';
    end if;
  end loop;
  new.stil := neu;
  return new;
end $$;

-- Kontrolle: erwartet t, t, f, t, f, f
select public.qb_bild_frei('figur', 'fuchs', 0, gen_random_uuid()) as fuchs_frei,
       public.qb_bild_frei('figur', 'quizbot', 2, gen_random_uuid()) as quizbot_ab_karo_koenig,
       public.qb_bild_frei('figur', 'quizbot', 1, gen_random_uuid()) as quizbot_zu_frueh,
       public.qb_bild_frei('ring', 'sand', 0, gen_random_uuid()) as sand_frei,
       public.qb_bild_frei('ring', 'gold', 16, gen_random_uuid()) as gold_ohne_medaille,
       public.qb_bild_frei('kreis', 'unbekannt', 16, gen_random_uuid()) as unbekannt;
