-- public.daycares — entidad raíz
create extension if not exists "pgcrypto";

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) > 0),
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create policy "daycares_select_authenticated"
  on public.daycares for select
  to authenticated
  using (true);

create policy "daycares_insert_authenticated"
  on public.daycares for insert
  to authenticated
  with check (true);

create policy "daycares_update_authenticated"
  on public.daycares for update
  to authenticated
  using (true)
  with check (true);

create policy "daycares_delete_authenticated"
  on public.daycares for delete
  to authenticated
  using (true);

-- Seed idempotente (sin UNIQUE en name)
insert into public.daycares (name)
select v.name from (values
  ('Guardería Sala Soles'),
  ('Guardería Arcoíris'),
  ('Guardería Pequeños Exploradores'),
  ('Guardería Mundo Mágico'),
  ('Guardería Estrellitas')
) as v(name)
where not exists (select 1 from public.daycares d where d.name = v.name);
