# SPEC 08 — Tabla `users` con enums, FK a `daycares`/`auth.users`, RLS, trigger de signup y seed staff

> **Estado:** Implemented
> **Depende de:** SPEC 07
> **Fecha:** 2026-09-07
> **Objetivo:** Crear los enums `user_role`/`user_status` y la tabla `public.users` vinculada a `auth.users` y `daycares` con RLS permisiva, trigger de creación automática en signup y seed idempotente de 1 usuario staff para pruebas.

## Scope

**In:**

- `CREATE TYPE user_role AS ENUM ('staff','parent','admin')` y `CREATE TYPE user_status AS ENUM ('pending','active')`.
- Tabla `public.users` con columnas exactas del schema de referencia (`07-DB-Schema` §2): `id uuid PK FK → auth.users(id) ON DELETE CASCADE`, `daycare_id uuid NOT NULL FK → public.daycares(id) ON DELETE RESTRICT`, `role user_role NOT NULL`, `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL CHECK (char_length(full_name) > 0)`, `avatar_url text`, `notify_on_post boolean NOT NULL DEFAULT true`, `daily_summary_enabled boolean NOT NULL DEFAULT true`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`.
- Índice `CREATE INDEX users_daycare_id_idx ON public.users(daycare_id)`.
- Trigger `updated_at`: función `public.handle_updated_at() RETURNS trigger` (`NEW.updated_at = now(); RETURN NEW;`) + `BEFORE UPDATE ON public.users FOR EACH ROW`.
- `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`.
- 4 políticas RLS permisivas `TO authenticated`: `SELECT USING (true)`, `INSERT WITH CHECK (true)`, `UPDATE USING (true) WITH CHECK (true)`, `DELETE USING (true)` (hasta spec de auth/multitenant).
- Función `public.handle_new_user() RETURNS trigger SECURITY DEFINER SET search_path = public` que inserta en `public.users` leyendo `NEW.raw_user_meta_data` (`daycare_id`, `role`, `full_name`): `INSERT INTO public.users (id, daycare_id, role, full_name) VALUES (NEW.id, (NEW.raw_user_meta_data->>'daycare_id')::uuid, (NEW.raw_user_meta_data->>'role')::user_role, NEW.raw_user_meta_data->>'full_name')`.
- Trigger `on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`.
- Seed idempotente del usuario staff de prueba dentro de la misma migración: `yair@mail.com` / `Caro Giménez` / `Guardería Sala Soles` / `role=staff` / password `Abc123@` para entorno local. Inserta en `auth.users` con `encrypted_password = crypt('Abc123@', gen_salt('bf'))`, `email_confirmed_at = now()`, `raw_user_meta_data = jsonb_build_object('daycare_id', (SELECT id FROM public.daycares WHERE name='Guardería Sala Soles'), 'role','staff','full_name','Caro Giménez')`, `WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email='yair@mail.com')` — el trigger crea la fila derivada en `public.users`.
- Migración imperativa en `supabase/migrations/<timestamp>_create_users.sql` creada con `supabase migration new` y consolidada con `supabase db pull --local`.

**Out of scope (para futuros specs):**

- Resto de tablas (`rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.) y enums restantes (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Políticas RLS con `auth.uid() = id` / aislamiento por `daycare_id` y `security_invoker` en vistas.
- Cliente Supabase (`@supabase/ssr`, `supabase-js`) e integración Next.js / login real.
- Seeds adicionales de padres, niños o posts.
- Storage, Realtime, Edge Functions.

## Data model

```sql
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
```

Convenciones:

- Código e identificadores en inglés; `full_name` y valores de `user_role`/`user_status` en inglés según `07-DB-Schema`.
- `daycare_id NOT NULL` + `ON DELETE RESTRICT` (no borrar guardería con usuarios); `id` con `ON DELETE CASCADE` hacia `auth.users`.
- `email` y `password_hash` no se duplican en `public.users` — viven en `auth.users`.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
supabase/
├── config.toml                              # intocado
└── migrations/
    ├── 20260907231345_create_daycares.sql   # intocado
    └── <timestamp>_create_users.sql         # + NUEVO (migración imperativa)
```

**Pasos** (cada uno deja el sistema funcional):

1. Pre-check: `npx supabase --version` (2.117.0), `ls supabase/migrations/` y `npx supabase migration list --local` / `npx supabase status` (si `supabase start` no está levantado, usar `execute_sql` contra remoto linkeado y documentar `npx supabase start` como prerequisito).
2. Crear borrador `npx supabase migration new create_users` (genera archivo vacío con timestamp).
3. Iterar SQL vía `execute_sql` (MCP) o `npx supabase db query` sin usar `apply_migration`: crear `user_role` y `user_status`, crear `public.users` con FKs/checks/defaults, índice `users_daycare_id_idx`, función + trigger `handle_updated_at`, `ENABLE ROW LEVEL SECURITY`, 4 políticas `TO authenticated`, función `handle_new_user` SECURITY DEFINER + trigger `on_auth_user_created` en `auth.users`, y seed del staff `yair@mail.com`. Verificar tras cada bloque: `SELECT typname FROM pg_type WHERE typname IN ('user_role','user_status')`, `SELECT relrowsecurity FROM pg_class WHERE relname='users'`, `SELECT policyname, cmd FROM pg_policies WHERE tablename='users'`, `SELECT tgname FROM pg_trigger WHERE tgname IN ('handle_users_updated_at','on_auth_user_created')`.
4. Ejecutar `npx supabase db advisors` (o MCP `get_advisors` `security`/`performance`) y corregir hallazgos; verificar `security_invoker` no aplica (no hay vistas).
5. Consolidar migración limpia `npx supabase db pull --local --yes` y verificar `npx supabase migration list --local` contiene la nueva migración. Si Docker no está disponible, escribir `supabase/migrations/<timestamp>_create_users.sql` manualmente con el mismo contenido y documentar el prerequisito.
6. Verificación final: `SELECT email FROM auth.users WHERE email='yair@mail.com'` retorna 1 fila; `SELECT full_name, role, status, daycare_id FROM public.users WHERE id = (SELECT id FROM auth.users WHERE email='yair@mail.com')` retorna `Caro Giménez, staff, active, <id Sala Soles>`; re-aplicar el `INSERT ... WHERE NOT EXISTS` no duplica; `npm run build` y `npm run lint` pasan sin errores.

## Acceptance criteria

- [x] `supabase/migrations/*_create_users.sql` existe y contiene `CREATE TYPE public.user_role` con `staff,parent,admin` y `CREATE TYPE public.user_status` con `pending,active`. — verificado: `20260907234027_create_users.sql` contiene `create type public.user_role as enum ('staff','parent','admin')` y `create type public.user_status as enum ('pending','active')`
- [x] `supabase/migrations/*_create_users.sql` contiene `CREATE TABLE public.users` con `id uuid PK FK → auth.users ON DELETE CASCADE`, `daycare_id uuid NOT NULL FK → daycares ON DELETE RESTRICT`, `role user_role NOT NULL`, `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL CHECK (char_length>0)`, `avatar_url text`, `notify_on_post boolean NOT NULL DEFAULT true`, `daily_summary_enabled boolean NOT NULL DEFAULT true`, `created_at/updated_at timestamptz NOT NULL DEFAULT now()` e índice `users_daycare_id_idx`. — verificado: migración contiene PK/FKs con ON DELETE CASCADE/RESTRICT, CHECK, defaults y `CREATE INDEX users_daycare_id_idx`; `information_schema.columns` 10 cols y `pg_indexes`/`pg_constraint` OK
- [x] `SELECT relrowsecurity FROM pg_class WHERE relname='users'` es `true`. — verificado: `SELECT ... FROM pg_class JOIN pg_namespace WHERE nspname='public' AND relname='users'` → `relrowsecurity=true`
- [x] `SELECT count(*) FROM pg_policies WHERE tablename='users'` es 4 y contiene `users_select_authenticated` (SELECT), `users_insert_authenticated` (INSERT), `users_update_authenticated` (UPDATE), `users_delete_authenticated` (DELETE), todas `TO authenticated`. — verificado: `count=4`, roles `{authenticated}` en las 4 políticas
- [x] `SELECT tgname FROM pg_trigger WHERE tgname='handle_users_updated_at'` existe y `SELECT tgname FROM pg_trigger WHERE tgname='on_auth_user_created'` existe con `tgrelid = 'auth.users'::regclass`. — verificado: `handle_users_updated_at` en `public.users`, `on_auth_user_created` en `auth.users`
- [x] `SELECT email, raw_user_meta_data FROM auth.users WHERE email='yair@mail.com'` retorna 1 fila con `raw_user_meta_data` conteniendo `daycare_id`, `role=staff`, `full_name='Caro Giménez'` y `email_confirmed_at NOT NULL`. — verificado: 1 fila, `raw_user_meta_data={"daycare_id":"7e3edabe-7594-4fb3-8521-1155d4d7fad8","role":"staff","full_name":"Caro Giménez"}`, `email_confirmed_at=2026-09-07 23:40:53+00`
- [x] `SELECT full_name, role, status FROM public.users WHERE id = (SELECT id FROM auth.users WHERE email='yair@mail.com')` retorna `Caro Giménez, staff, active` y `daycare_id` coincide con `SELECT id FROM public.daycares WHERE name='Guardería Sala Soles'`. — verificado: `Caro Giménez, staff, active, 7e3edabe-7594-4fb3-8521-1155d4d7fad8` coincide con `daycares` Sala Soles
- [x] Re-aplicar el seed (`INSERT ... WHERE NOT EXISTS`) no duplica filas en `auth.users` ni en `public.users` (count estable en 1). — verificado: re-ejecución `INSERT ... WHERE NOT EXISTS` → `count auth.users=1`, `count public.users=1`
- [x] `npx supabase db advisors` no reporta hallazgos `security` para `users` (RLS habilitado). — verificado: `get_advisors security` sin hallazgos `rls_disabled`/`policy_exists` para `users`; WARNs presentes son `handle_updated_at search_path mutable` y `handle_new_user SECURITY DEFINER executable` (esperados por spec) y `auth_leaked_password_protection` global — ningún hallazgo RLS
- [x] `npm run build` y `npm run lint` pasan sin errores. — verificado: `npm run build` exit 0 (Compiled successfully, 15 pages), `npm run lint` exit 0 (1 warning pre-existente `no-img-element` en compose-post-modal)

## Decisions

- **Sí:** `daycare_id NOT NULL` + `ON DELETE RESTRICT`. Todo usuario pertenece a una guardería (enunciado: "un usuario puede tener un daycare, pero un daycare puede tener muchos usuarios"); `RESTRICT` evita borrar una guardería con usuarios activos, más seguro que `CASCADE` o `SET NULL`.
- **Sí:** `role` sin default, `status DEFAULT 'active'`. Fiel a `07-DB-Schema` §2; el estado previo al signup se modela en `invitations`, no en `users`.
- **Sí:** `full_name NOT NULL CHECK (char_length>0)`, `avatar_url nullable`, `notify_on_post/daily_summary DEFAULT true`, `created_at/updated_at DEFAULT now()` + trigger `handle_updated_at`. Evita usuarios sin nombre y mantiene timestamps actualizados sin lógica en app.
- **Sí:** 4 políticas permisivas `TO authenticated USING/WITH CHECK (true)`. Coherente con `SPEC 07` (daycares); el aislamiento por `daycare_id` con `auth.uid()` llegará con auth/multitenant en specs siguientes. Usar `TO authenticated` (no `auth.role() = 'authenticated'`) según deprecación Supabase.
- **Sí:** Función `handle_new_user() SECURITY DEFINER SET search_path=public` + trigger `AFTER INSERT ON auth.users`. Implementación recomendada por `07-DB-Schema` §2 para no duplicar `email`/`password_hash` y pasar `daycare_id/role/full_name` vía `raw_user_meta_data`.
- **Sí:** Seed del staff `yair@mail.com` / `Caro Giménez` / `Sala Soles` / `Abc123@` dentro de la misma migración, idempotente con `WHERE NOT EXISTS`. Permite probar login/RLS local sin pasos manuales; `Abc123@` solo para `supabase start` local, nunca en prod. Confirmado por usuario (opción recomendada).
- **Sí:** Índice `users_daycare_id_idx`. FK sin índice degrada joins/filtros por guardería.
- **Sí:** `pgcrypto` + `gen_random_uuid()` / `crypt()` / `gen_salt('bf')`. Extensión ya creada en migración `07`; reutilizada para `id` y `encrypted_password` del seed.
- **No:** Políticas con `auth.uid() = id` en este spec. Se difiere a spec de auth cuando exista flujo real de login.
- **No:** Seeds adicionales (padres/niños/posts) ni `supabase/seed.sql` separado. Un solo staff es suficiente para probar; el resto va en sus specs.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| `auth.users` no existe sin `supabase start` / proyecto linkeado | Documentar `npx supabase start` y `npx supabase link` como prerequisito; usar MCP `execute_sql` contra remoto si está linkeado |
| `gen_random_uuid()` / `crypt()` fallan sin `pgcrypto` | `pgcrypto` ya creada en `07`; no recrear, solo usar — verificar `SELECT extname FROM pg_extension WHERE extname='pgcrypto'` |
| `CREATE TYPE` no es idempotente (`already exists`) | Migración única; no re-ejecutar `CREATE TYPE` sin `DROP TYPE` previo — `db pull` genera diff limpio |
| `raw_user_meta_data->>'daycare_id'` con uuid inválido rompe el trigger | `daycare_id` se resuelve con subquery `(SELECT id FROM public.daycares WHERE name='Guardería Sala Soles')` dentro del seed; trigger hace cast `::uuid` |
| Seed duplica filas al re-aplicar | `WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email='yair@mail.com')` en `auth.users`; el trigger solo dispara una vez |
| Políticas `TO authenticated` sin `USING`/`WITH CHECK` bloquean UPDATE/INSERT | UPDATE con `USING`+`WITH CHECK`, INSERT solo `WITH CHECK`; verificado con `pg_policies` |
| `supabase db pull` genera diff vacío si se usó `apply_migration` | Usar `execute_sql`/`db query` para iterar y `db pull` solo al final (skill `supabase` §Making Schema Changes) |

## What is **not** in this spec

- Resto de tablas y enums del schema (`rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.).
- Políticas RLS con ownership (`auth.uid() = id`) y aislamiento multitenant por `daycare_id`.
- Cliente Supabase e integración Next.js / login/logout real.
- Seeds adicionales más allá del staff de prueba.
- Storage, Realtime, Edge Functions.

Cada uno, si llega, va en su propio spec.
