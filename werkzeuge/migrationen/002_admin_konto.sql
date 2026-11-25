-- 002 Admin-Konto anlegen, Passwort legt Colin beim ersten Anmelden selbst fest (einmalig, 3 Stunden offen). Darf mehrfach laufen.

-- Konto ohne bekanntes Passwort (zufälliger Wert, den niemand kennt)
do $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = 'requiem-admin@quizbude.app';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change_token, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'requiem-admin@quizbude.app',
      extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', 'requiem-admin@quizbude.app', 'email_verified', true),
      'email', now(), now(), now());
  end if;
  insert into public.admins (user_id) values (uid) on conflict do nothing;
  delete from public.profile where id = uid;
end $$;

-- Einrichtung offen: die nächsten 3 Stunden lässt sich das Passwort genau einmal festlegen
insert into public.config (schluessel, wert, geaendert)
values ('admin_einrichtung', jsonb_build_object('offen', true, 'bis', now() + interval '3 hours'), now())
on conflict (schluessel) do update set wert = excluded.wert, geaendert = now();

create or replace function public.admin_einrichten(p_pw text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare e jsonb;
begin
  select wert into e from public.config where schluessel = 'admin_einrichtung' for update;
  if e is null or not coalesce((e->>'offen')::boolean, false) or (e->>'bis')::timestamptz < now() then
    raise exception 'Das Admin-Passwort ist schon festgelegt.';
  end if;
  if char_length(coalesce(p_pw, '')) < 4 then raise exception 'Das Passwort braucht mindestens 4 Zeichen.'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_pw || '#qb26', extensions.gen_salt('bf')), updated_at = now()
  where lower(email) = 'requiem-admin@quizbude.app';
  update public.config set wert = jsonb_build_object('offen', false, 'am', now()), geaendert = now() where schluessel = 'admin_einrichtung';
  insert into public.admin_log (admin, aktion, details) values (null, 'einrichtung', jsonb_build_object('was', 'Admin-Passwort festgelegt'));
end $$;
revoke all on function public.admin_einrichten(text) from public;
grant execute on function public.admin_einrichten(text) to anon, authenticated;

select u.id, u.email, (select count(*) from public.admins a where a.user_id = u.id) as ist_admin,
  (select wert from public.config where schluessel = 'admin_einrichtung') as einrichtung
from auth.users u where lower(u.email) = 'requiem-admin@quizbude.app';
