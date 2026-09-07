-- SPEC 08 — Tabla public.users con enums, FK a daycares/auth.users, RLS, triggers y seed staff

-- ENUMs
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

-- Tabla public.users — perfil de dominio vinculado a Supabase Auth
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null check (char_length(full_name) > 0),
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_daycare_id_idx on public.users(daycare_id);

-- updated_at automático
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.users enable row level security;

create policy "users_select_authenticated"
  on public.users for select to authenticated using (true);
create policy "users_insert_authenticated"
  on public.users for insert to authenticated with check (true);
create policy "users_update_authenticated"
  on public.users for update to authenticated using (true) with check (true);
create policy "users_delete_authenticated"
  on public.users for delete to authenticated using (true);

-- Trigger signup: auth.users → public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed idempotente: staff de prueba (solo local/testing)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'yair@mail.com',
  crypt('Abc123@', gen_salt('bf')),
  now(),
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Caro Giménez'
  ),
  now(), now(), '', ''
where not exists (select 1 from auth.users where email = 'yair@mail.com');
