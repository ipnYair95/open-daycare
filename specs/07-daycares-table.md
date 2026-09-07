# SPEC 07 — Tabla `daycares` con RLS y seed (primera migración Supabase)

> **Estado:** Approved
> **Depende de:** —
> **Fecha:** 2026-09-07
> **Objetivo:** Crear la tabla `daycares` como primera migración Supabase imperativa con RLS activado, políticas de lectura y escritura y 5 guarderías de ejemplo.

## Scope

**In:**

- Extensión `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`) para `gen_random_uuid()`.
- Tabla `public.daycares` con columnas exactas del schema de referencia (`07-DB-Schema` §1): `id uuid PK default gen_random_uuid()`, `name text NOT NULL CHECK (char_length(name) > 0)`, `created_at timestamptz NOT NULL default now()`.
- `ALTER TABLE public.daycares ENABLE ROW LEVEL SECURITY`.
- Políticas RLS de lectura y escritura para `authenticated`: `SELECT USING (true)`, `INSERT WITH CHECK (true)`, `UPDATE USING (true) WITH CHECK (true)`, `DELETE USING (true)` (permisivas hasta spec de auth/multitenant).
- Seed idempotente de 5 guarderías: "Guardería Sala Soles", "Guardería Arcoíris", "Guardería Pequeños Exploradores", "Guardería Mundo Mágico", "Guardería Estrellitas".
- Migración imperativa en `supabase/migrations/<timestamp>_create_daycares.sql` creada con `supabase migration new` y consolidada con `supabase db pull --local`.

**Out of scope (para futuros specs):**

- Resto de tablas (`users`, `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.) y enums (`user_role`, `post_type`, etc.).
- Políticas RLS con `auth.uid()` / aislamiento por `daycare_id` y `security_invoker` en vistas.
- Cliente Supabase (`@supabase/ssr`, `supabase-js`) e integración Next.js.
- `supabase init` / `supabase link` / `supabase start`; se documentan como prerequisito si `supabase/` no existe.
- Storage, Realtime, Edge Functions, `updated_at` en `daycares`.

## Data model

```sql
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
```

Convenciones:

- Código e identificadores en inglés; texto de `name` en español (nombre visible de la guardería).
- `id` y `created_at` siguen la convención del repo (`uuid` + `gen_random_uuid()`, `timestamptz`).

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
supabase/
├── config.toml                              # existe o prerequisito `npx supabase init`
└── migrations/
    └── <timestamp>_create_daycares.sql      # + NUEVO (migración imperativa)
```

**Pasos** (cada uno deja el sistema funcional):

1. Pre-check: `npx supabase --version` (2.117.0), `ls supabase/` y `npx supabase status` / `npx supabase migration list --local`. Si no existe `supabase/config.toml`, documentar `npx supabase init` como prerequisito sin bloquear el spec.
2. Crear borrador `npx supabase migration new create_daycares` (genera archivo vacío con timestamp).
3. Iterar SQL vía `execute_sql` (MCP) o `npx supabase db query` sin usar `apply_migration` (evita historial prematuro): crear extensión, tabla, `ENABLE ROW LEVEL SECURITY`, 4 políticas y seed idempotente. Verificar con `SELECT relrowsecurity FROM pg_class WHERE relname='daycares'` y `SELECT * FROM pg_policies WHERE tablename='daycares'`.
4. Ejecutar `npx supabase db advisors` (o MCP `get_advisors` `security`/`performance`) y corregir hallazgos; verificar `security_invoker` no aplica (no hay vistas) y RLS activo.
5. Consolidar migración limpia `npx supabase db pull create_daycares --local --yes` y verificar `npx supabase migration list --local` contiene la nueva migración.
6. Verificación final: `npx supabase db query "select name from public.daycares order by name;"` retorna 5 filas; `npm run build` y `npm run lint` pasan sin errores.

## Acceptance criteria

- [ ] `supabase/migrations/*_create_daycares.sql` existe y contiene `CREATE TABLE public.daycares` con `id uuid PK default gen_random_uuid()`, `name text NOT NULL CHECK (char_length(name)>0)`, `created_at timestamptz NOT NULL default now()`.
- [ ] `SELECT extname FROM pg_extension WHERE extname='pgcrypto'` retorna 1 fila.
- [ ] `SELECT relrowsecurity FROM pg_class WHERE relname='daycares'` es `true`.
- [ ] `SELECT count(*) FROM pg_policies WHERE tablename='daycares'` es 4 y `SELECT policyname, cmd FROM pg_policies WHERE tablename='daycares'` contiene `daycares_select_authenticated` (SELECT), `daycares_insert_authenticated` (INSERT), `daycares_update_authenticated` (UPDATE), `daycares_delete_authenticated` (DELETE), todas `TO authenticated`.
- [ ] `SELECT count(*) FROM public.daycares` es 5 y `SELECT name FROM public.daycares` contiene los 5 nombres exactos del seed.
- [ ] Re-aplicar el seed no duplica filas (idempotente vía `WHERE NOT EXISTS`).
- [ ] `npx supabase db advisors` no reporta hallazgos `security` para `daycares` (RLS habilitado).
- [ ] `npm run build` y `npm run lint` pasan sin errores.

## Decisions

- **Sí:** Patrón imperativo (`supabase migration new` + `execute_sql`/`db query` + `db pull`). No existe `supabase/schemas/` en el repo, así que el declarativo no aplica (skill `supabase` Option B).
- **Sí:** `pgcrypto` + `gen_random_uuid()` para `id`. Convención del `07-DB-Schema` y estándar del repo.
- **Sí:** `CHECK (char_length(name) > 0)` y `NOT NULL` en `name`. Evita guarderías vacías sin costo.
- **Sí:** `ENABLE ROW LEVEL SECURITY` sin `FORCE`. Cumple checklist Supabase: toda tabla en `public` con RLS (skill `supabase` §5).
- **Sí:** 4 políticas permisivas `TO authenticated USING/WITH CHECK (true)` para lectura y escritura. `daycares` es entidad raíz sin `owner_id`; el aislamiento por `daycare_id` con `auth.uid()` llegará con `users`/`rooms` en specs siguientes. Usar `TO authenticated` (no `auth.role() = 'authenticated'`) según deprecación Supabase.
- **Sí:** Seed de 5 guarderías idempotente con `WHERE NOT EXISTS`. Permite FKs futuras (`users.daycare_id`, `rooms.daycare_id`) sin `NULL` y sin duplicar al re-ejecutar.
- **Sí:** `created_at default now()` sin `updated_at`. Fiel a `07-DB-Schema` §1 para `daycares`; `updated_at` se añade si un spec futuro lo requiere.
- **No:** Políticas para `anon` ni `public` lectura abierta. Hasta definir auth, `anon` queda bloqueado por RLS.
- **No:** `SECURITY DEFINER`, vistas ni `security_invoker` en este spec. No hay vistas/funciones.
- **No:** Cliente Supabase ni cambios en `app/`. Solo esquema, como pidió el usuario ("solamente implementación del esquema").

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| `supabase/` no inicializado (`No such file or directory`) | Documentar `npx supabase init` y `npx supabase start` como prerequisito; usar MCP `execute_sql` contra proyecto remoto si está linkeado |
| `gen_random_uuid()` falla sin `pgcrypto` | `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` en la misma migración, antes del `CREATE TABLE` |
| Seed duplica filas al re-aplicar | `WHERE NOT EXISTS (select 1 from daycares where name = v.name)` en vez de `ON CONFLICT` (no hay UNIQUE en `name`) |
| Políticas `TO authenticated` sin `USING`/`WITH CHECK` bloquean UPDATE/INSERT | UPDATE con `USING`+`WITH CHECK`, INSERT solo `WITH CHECK`; verificado con `pg_policies` |
| `supabase db pull` genera diff vacío si se usó `apply_migration` | Usar `execute_sql`/`db query` para iterar y `db pull` solo al final (skill `supabase` §Making Schema Changes) |

## What is **not** in this spec

- Resto de tablas y enums del schema (`users`, `rooms`, `children`, etc.).
- Políticas RLS con ownership (`auth.uid() = user_id`) y aislamiento multitenant.
- Cliente Supabase e integración Next.js.
- Storage, Realtime, Edge Functions.

Cada uno, si llega, va en su propio spec.
