-- 004 Vitrine: bis zu drei Abzeichen auf der Spielerkarte (0.10.0). Darf mehrfach laufen.
alter table public.profile add column if not exists vitrine jsonb not null default '[]'::jsonb;
alter table public.profile drop constraint if exists profile_vitrine_ok;
alter table public.profile add constraint profile_vitrine_ok check (jsonb_typeof(vitrine) = 'array' and jsonb_array_length(vitrine) <= 3 and octet_length(vitrine::text) <= 200);
grant update (avatar, farbe, stil, vitrine) on public.profile to authenticated;
