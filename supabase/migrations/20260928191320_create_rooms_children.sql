-- SPEC 10 — Tablas public.rooms y public.children con RLS, trigger y seed de salas
-- Prerequisito: requiere `npx supabase start` (Docker) para `db pull --local`; este archivo se escribió manualmente con el mismo contenido aplicado vía execute_sql.

-- ENUM
create type public.child_status as enum ('active', 'archived');

-- public.rooms — salas de la guardería
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name text not null check (char_length(name) > 0),
  created_at timestamptz not null default now()
);

-- public.children — niños inscritos
create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  full_name text not null check (char_length(full_name) > 0),
  birth_date date not null,
  enrolled_at date not null default CURRENT_DATE,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index children_room_id_idx on public.children(room_id);

-- updated_at automático (función public.handle_updated_at ya creada en SPEC 08)
create trigger handle_children_updated_at
  before update on public.children
  for each row execute function public.handle_updated_at();

-- RLS permisiva (hasta spec de auth/multitenant)
alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_select_authenticated"
  on public.rooms for select to authenticated using (true);
create policy "rooms_insert_authenticated"
  on public.rooms for insert to authenticated with check (true);
create policy "rooms_update_authenticated"
  on public.rooms for update to authenticated using (true) with check (true);
create policy "rooms_delete_authenticated"
  on public.rooms for delete to authenticated using (true);

create policy "children_select_authenticated"
  on public.children for select to authenticated using (true);
create policy "children_insert_authenticated"
  on public.children for insert to authenticated with check (true);
create policy "children_update_authenticated"
  on public.children for update to authenticated using (true) with check (true);
create policy "children_delete_authenticated"
  on public.children for delete to authenticated using (true);

-- Seed idempotente de 3 salas (sin UNIQUE en name)
insert into public.rooms (daycare_id, name)
select d.id, v.name
from (values ('Soles'), ('Lunas'), ('Estrellas')) as v(name)
cross join (select id from public.daycares where name = 'Guardería Sala Soles') as d
where not exists (
  select 1 from public.rooms r where r.daycare_id = d.id and r.name = v.name
);
