-- 014: Köpfe als Profilbild. profile.stil bekommt
--   kopf:  die gewählten Teile als kurzer Text (z. B. "s=k3x9a;h=12;g=0;k=h"), frei für alle
--   geste: Hand und Handy frei; Zeigefinger/OK/OK hoch/Winken ab König der Farbe, Beide Hände ab Joker,
--          Finger hoch für Platz 3 oder besser, Nummer eins nur für einen Saisonsieg
-- Figur, Kreis und Rand bleiben wie in 009. Mehrfach ausführbar.

create or replace function public.qb_bild_frei(p_art text, p_wert text, p_stufe int, p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_rang text; v_ab int; v_platz int;
begin
  if p_art = 'kopf' then
    return p_wert ~ '^[a-z0-9=;]{1,80}$';
  elsif p_art = 'geste' then
    if p_wert in ('hand', 'handPhone') then return true; end if;
    v_rang := case p_wert when 'point' then 'karo' when 'ok' then 'herz' when 'okLongArm' then 'pik' when 'waveLongArm' then 'kreuz' when 'waveLongArms' then 'joker' end;
    v_platz := case p_wert when 'pointLongArm' then 3 when 'wavePointLongArms' then 1 end;
    v_ab := 2;
  elsif p_art = 'figur' then
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

-- Kontrolle: erwartet t, f, t, t, f, t, f, f
select public.qb_bild_frei('kopf', 's=k3x9a;h=12;g=0;k=h', 0, gen_random_uuid()) as kopf_ok,
       public.qb_bild_frei('kopf', 's=<script>', 0, gen_random_uuid()) as kopf_kaputt,
       public.qb_bild_frei('geste', 'handPhone', 0, gen_random_uuid()) as handy_frei,
       public.qb_bild_frei('geste', 'point', 2, gen_random_uuid()) as zeigen_ab_karo_koenig,
       public.qb_bild_frei('geste', 'point', 1, gen_random_uuid()) as zeigen_zu_frueh,
       public.qb_bild_frei('geste', 'waveLongArms', 16, gen_random_uuid()) as joker,
       public.qb_bild_frei('geste', 'wavePointLongArms', 16, gen_random_uuid()) as nummer_eins_ohne_medaille,
       public.qb_bild_frei('geste', 'unbekannt', 16, gen_random_uuid()) as unbekannt;
