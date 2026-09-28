-- SPEC 11 — Tablas public.invitations y public.parent_children con RLS
-- Prerequisito: requiere `npx supabase start` (Docker) para `db pull --local`; este archivo se escribió manualmente con el mismo contenido aplicado vía execute_sql.

-- ENUMs
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- public.parent_children — vínculo padre ↔ niño
create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

-- public.invitations — invitaciones con código
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid references public.users(id) on delete set null,
  full_name text not null check (char_length(full_name) > 0),
  email text not null check (char_length(email) > 0),
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index parent_children_parent_id_idx on public.parent_children(parent_id);
create index parent_children_child_id_idx on public.parent_children(child_id);
create index invitations_child_id_idx on public.invitations(child_id);
create index invitations_invited_by_idx on public.invitations(invited_by);

-- RLS permisiva (hasta spec de auth/multitenant)
alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;

create policy "parent_children_select_authenticated"
  on public.parent_children for select to authenticated using (true);
create policy "parent_children_insert_authenticated"
  on public.parent_children for insert to authenticated with check (true);
create policy "parent_children_update_authenticated"
  on public.parent_children for update to authenticated using (true) with check (true);
create policy "parent_children_delete_authenticated"
  on public.parent_children for delete to authenticated using (true);

create policy "invitations_select_authenticated"
  on public.invitations for select to authenticated using (true);
create policy "invitations_insert_authenticated"
  on public.invitations for insert to authenticated with check (true);
create policy "invitations_update_authenticated"
  on public.invitations for update to authenticated using (true) with check (true);
create policy "invitations_delete_authenticated"
  on public.invitations for delete to authenticated using (true);
