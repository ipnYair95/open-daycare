-- Reparación del seed staff (SPEC 08): el INSERT original omitió
-- raw_app_meta_data y GoTrue responde 500 en el password-grant sin ese
-- campo, por lo que el login con yair@mail.com / Abc123@ nunca funcionaba.
-- Idempotente: cubre filas existentes y futuros setups frescos (corre
-- después de 20260907234027_create_users).
update auth.users
set raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    updated_at = now()
where email = 'yair@mail.com'
  and coalesce(raw_app_meta_data::text, '') <>
    '{"provider": "email", "providers": ["email"]}';

-- El INSERT original tampoco creó la fila en auth.identities que GoTrue
-- exige en el password-grant; sin ella el login falla aunque el password
-- sea correcto. Idempotente.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email = 'yair@mail.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- GoTrue escanea email_change/phone_change como string no-nulo; el INSERT
-- original los dejó en NULL y todo /token, /recover y /admin/users sobre
-- este usuario responde 500 ("converting NULL to string is unsupported").
-- Los signups reales los crean como ''. Idempotente.
update auth.users
set email_change = coalesce(email_change, ''),
    phone_change = coalesce(phone_change, ''),
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    updated_at = now()
where email = 'yair@mail.com';
