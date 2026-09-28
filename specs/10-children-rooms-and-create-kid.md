# SPEC 10 — Salas y niños: tablas `rooms`/`children` con seed y crear niño desde `/kids`

> **Estado:** Implemented
> **Depende de:** SPEC 02, SPEC 04, SPEC 07, SPEC 08
> **Fecha:** 2026-09-28
> **Objetivo:** Crear las tablas `rooms` y `children` con RLS y 3 salas seed, conectar `/kids` a Supabase para listar y crear niños reales, y mostrar el perfil `/kids/[slug]` desde BD.

## Scope

**In:**

- Enum `child_status` (`active`, `archived`).
- Tabla `public.rooms` con columnas exactas del schema de referencia (`07-DB-Schema` §3): `id uuid PK default gen_random_uuid()`, `daycare_id uuid NOT NULL FK → public.daycares(id) ON DELETE RESTRICT`, `name text NOT NULL CHECK (char_length(name) > 0)`, `created_at timestamptz NOT NULL default now()`.
- Tabla `public.children` con columnas exactas del schema (`07-DB-Schema` §4): `id uuid PK default gen_random_uuid()`, `room_id uuid nullable FK → public.rooms(id) ON DELETE SET NULL`, `full_name text NOT NULL CHECK (char_length(full_name) > 0)`, `birth_date date NOT NULL`, `enrolled_at date NOT NULL default CURRENT_DATE`, `medical_notes text`, `allergy_tags text[] NOT NULL default '{}'`, `photo_consent boolean NOT NULL default true`, `status child_status NOT NULL default 'active'`, `created_at/updated_at timestamptz NOT NULL default now()` + trigger `handle_updated_at` reutilizado.
- Índice `CREATE INDEX children_room_id_idx ON public.children(room_id)`.
- RLS activado en ambas tablas con 4 políticas permisivas `TO authenticated` por tabla (SELECT/INSERT/UPDATE/DELETE con `USING`/`WITH CHECK (true)`), igual que SPEC 07/08.
- Seed idempotente de 3 salas en "Guardería Sala Soles": `Soles`, `Lunas`, `Estrellas` (vía `WHERE NOT EXISTS`, sin `UNIQUE` en `name`).
- Cero niños seed: `children` arranca vacía.
- `/kids` lee `children` y `rooms` reales de Supabase y arranca vacío ("0 niños") hasta crear el primero.
- Modal "Agregar niño" guarda real: `full_name` y `birth_date` obligatorios, `room` con default `Soles`, alergias como texto coma-separado que se guarda en minúsculas como `text[]`, `medical_notes` opcional, `photo_consent` default `true` sin UI.
- Migración imperativa en `supabase/migrations/<timestamp>_create_rooms_children.sql` (flujo `migration new` + `execute_sql`/`db query` + `db pull --local`).
- Perfil dinámico `/kids/[slug]`: lee el niño real (`children` + nombre de sala) por id (slug = uuid); si el slug no es uuid o no existe en BD, fallback al perfil estático; sin padres vinculados hasta su spec.
- Helpers de presentación del niño (edad, avatar, fechas) compartidos en `app/data/kids.ts` para listado y perfil.

**Out of scope (para futuros specs):**

- Editar niño y archivar (`status = 'archived'`).
- Búsqueda funcional del buscador.
- Vincular padres (`parent_children`, `invitations`).
- RLS con `auth.uid()` / aislamiento por `daycare_id`.
- Resto de tablas (`posts`, `post_children`, etc.).

## Data model

```sql
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
```

```ts
// app/data/kids.ts — se deja de usar como fuente del listado;
// /kids pasa a leer children + rooms desde Supabase.
// El tipo Kid se conserva solo si el perfil estático lo sigue usando.
```

Convenciones:

- Código e identificadores en inglés; nombres de salas (`Soles`, `Lunas`, `Estrellas`) en español como texto visible.
- Valores de `allergy_tags` en minúsculas en inglés (`peanut`, `lactose`); la UI traduce a MANÍ, LACTOSA.
- `room_id nullable` + `ON DELETE SET NULL` (borrar una sala no borra niños).
- `daycare_id NOT NULL` + `ON DELETE RESTRICT` (no borrar guardería con salas).

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
supabase/
└── migrations/
    └── <timestamp>_create_rooms_children.sql  # + NUEVO (migración imperativa)
app/
├── kids/
│   ├── page.tsx                               # ~ MODIFICAR (leer children + rooms reales)
│   └── [slug]/
│       └── page.tsx                           # ~ MODIFICAR (perfil dinámico desde BD con fallback estático)
├── components/
│   └── add-kid-modal.tsx                      # ~ MODIFICAR (Guardar crea el niño real)
└── data/
    └── kids.ts                                # ~ MODIFICAR (ChildDisplay + helpers compartidos; deja de ser fuente del listado)
```

**Pasos** (cada uno deja el sistema funcional):

1. Pre-check: `npx supabase --version`, `ls supabase/migrations/` y `npx supabase migration list --local` / `npx supabase status` (si no hay stack local, usar `execute_sql` contra remoto y documentar `npx supabase start` como prerequisito).
2. Crear borrador `npx supabase migration new create_rooms_children` (genera archivo vacío con timestamp).
3. Iterar SQL vía `execute_sql` (MCP) o `npx supabase db query` sin usar `apply_migration`: crear `child_status`, crear `public.rooms` y `public.children` con FKs/checks/defaults, índice `children_room_id_idx`, trigger `handle_children_updated_at`, `ENABLE ROW LEVEL SECURITY`, 8 políticas `TO authenticated` y seed de 3 salas. Verificar tras cada bloque: `SELECT typname FROM pg_type WHERE typname = 'child_status'`, `SELECT relrowsecurity FROM pg_class WHERE relname IN ('rooms','children')`, `SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('rooms','children')`.
4. Ejecutar `get_advisors` (`security`/`performance`) y corregir hallazgos.
5. Consolidar migración limpia `npx supabase db pull --local --yes` y verificar `npx supabase migration list --local` contiene la nueva migración (si Docker no está disponible, escribir el archivo manualmente con el mismo contenido y documentar el prerequisito).
6. Modificar `app/kids/page.tsx`: leer `rooms` y `children` reales de Supabase; el listado arranca vacío ("0 niños"); cada sala agrupa a sus niños.
7. Modificar `app/components/add-kid-modal.tsx`: "Guardar" inserta el niño real (`full_name` + `birth_date` obligatorios, `room` default `Soles`, alergias coma-separadas a `text[]` en minúsculas, `medical_notes` opcional); el listado refleja el niño creado sin recargar datos de mentira.
8. Verificación final: `npm run lint` y `npm run build`; crear un niño desde el modal aparece en el listado; captura Playwright en `.playwright-mcp/kids-supabase-verification.png`.
9. Modificar `app/kids/[slug]/page.tsx`: si el slug es uuid, leer el niño real (`children` + nombre de sala) y mostrar nombre, edad, sala, nacimiento, ingreso, notas/alergias; si no, fallback al perfil estático; mover helpers de presentación a `app/data/kids.ts` para compartir con el listado.
10. Verificación del detalle: abrir `/kids/<uuid>` del niño creado muestra datos reales sin 404; captura Playwright en `.playwright-mcp/kid-detail-supabase-verification.png`; `npm run lint` y `npm run build`.

## Acceptance criteria

- [x] `supabase/migrations/*_create_rooms_children.sql` existe y contiene `CREATE TYPE public.child_status` con `active,archived`. _(verificado: archivo `20260928191320_create_rooms_children.sql`, grep OK)_
- [x] La migración contiene `CREATE TABLE public.rooms` con `id uuid PK default gen_random_uuid()`, `daycare_id uuid NOT NULL FK → daycares ON DELETE RESTRICT`, `name text NOT NULL CHECK (char_length(name)>0)`, `created_at timestamptz NOT NULL default now()`. _(verificado: grep OK)_
- [x] La migración contiene `CREATE TABLE public.children` con `room_id uuid nullable FK → rooms ON DELETE SET NULL`, `full_name NOT NULL CHECK`, `birth_date date NOT NULL`, `enrolled_at date NOT NULL default CURRENT_DATE`, `allergy_tags text[] NOT NULL default '{}'`, `photo_consent boolean NOT NULL default true`, `status child_status NOT NULL default 'active'`, `created_at/updated_at` e índice `children_room_id_idx`. _(verificado: grep OK)_
- [x] `SELECT relrowsecurity FROM pg_class WHERE relname IN ('rooms','children')` es `true` en ambas. _(verificado: `true`/`true` vía execute_sql)_
- [x] `SELECT count(*) FROM pg_policies WHERE tablename IN ('rooms','children')` es 8 (4 por tabla), todas `TO authenticated`. _(verificado: count 8, SELECT/INSERT/UPDATE/DELETE por tabla)_
- [x] `SELECT name FROM public.rooms` contiene exactamente `Soles`, `Lunas`, `Estrellas` con `daycare_id` de "Guardería Sala Soles". _(verificado vía execute_sql)_
- [x] Re-aplicar el seed no duplica salas (count estable en 3). _(verificado: re-insert + count 3)_
- [x] `SELECT count(*) FROM public.children` es 0 tras migrar (sin niños seed). _(verificado: 0 al migrar; hay 2 filas de prueba creadas por el usuario después, no seed)_
- [x] `/kids` muestra "0 niños" con la tabla vacía y sin errores en consola. _(verificado: snapshot Playwright con 3 salas en "0 niños", consola 0 errores/0 warnings)_
- [x] Crear un niño desde "Agregar niño" (nombre + fecha + sala) lo inserta en `public.children` y aparece en el listado. _(verificado: E2E "Martina López" → SALA SOLES "1 niños" + fila en BD con `allergy_tags` en minúsculas, `photo_consent true`, `status active`)_
- [x] Guardar sin nombre o sin fecha no inserta nada y muestra error en el modal. _(verificado 2 veces: "Ingresá el nombre del niño" + "Fecha inválida")_
- [x] `/kids/<uuid>` muestra el perfil real (nombre, edad, sala, nacimiento, ingreso, notas/alergias) sin 404. _(verificado: la URL reportada `.../a21a017b...` renderiza nombre/edad/sala/fechas/notas+etiquetas/panel padres; estilos `#FBDAD6`, h1 28px `#3F362E`)_
- [x] Slugs estáticos viejos (`/kids/mateo-fernandez`) siguen funcionando (fallback). _(verificado: título y datos de Mateo intactos)_
- [x] Captura Playwright del detalle en `.playwright-mcp/kid-detail-supabase-verification.png`. _(verificado: archivo guardado)_
- [x] `npm run build` y `npm run lint` pasan sin errores. _(verificado: build OK con `/kids/[slug]` dinámica; lint 0 errores)_

## Decisions

- **Sí:** Alcance BD + listar + crear (decisión del usuario). Editar/archivar va en otro spec para mantener el spec pequeño.
- **Sí:** Salas `Soles`, `Lunas`, `Estrellas` en "Guardería Sala Soles" (nombres y daycare confirmados por el usuario).
- **Sí:** Cero niños seed (decisión del usuario). `/kids` arranca vacío contra Supabase real, sin fallback a los 8 estáticos.
- **Sí:** RLS permisiva `TO authenticated` (4 políticas por tabla) + trigger `handle_updated_at` reutilizado + índice `children_room_id_idx`. Consistencia total con SPEC 07/08; el aislamiento por `daycare_id` llega con auth/multitenant.
- **Sí:** `room_id nullable` + `ON DELETE SET NULL`. Fiel a `07-DB-Schema` §4; borrar una sala no borra niños.
- **Sí:** `daycare_id NOT NULL` + `ON DELETE RESTRICT` en `rooms`. Igual que `users.daycare_id` en SPEC 08.
- **Sí:** `full_name` + `birth_date` obligatorios, `room` default `Soles` (decisión del usuario). Resto opcional según schema.
- **Sí:** Alergias como texto coma-separado a `text[]` en minúsculas, `photo_consent` sin UI (default `true`). Opción simple confirmada por el usuario; chips y checkbox quedan para otro spec si hacen falta.
- **Sí:** Perfil dinámico incluido en este spec (pedido del usuario tras el 404): lee por id con fallback estático; padres vinculados siguen pendientes.
- **No:** Editar, archivar, búsqueda funcional y vincular padres.
- **No:** Políticas con `auth.uid()` en este spec. Se difiere a spec de auth.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| `daycare_id` del seed no existe (nombre distinto en remoto) | Resolver con subquery por nombre exacto `'Guardería Sala Soles'`; verificar `SELECT id FROM public.daycares` antes del seed |
| `CREATE TYPE child_status` no es idempotente (`already exists`) | Migración única; no re-ejecutar sin `DROP TYPE` previo |
| `/kids` hoy depende de `app/data/kids.ts` estático | La migración de UI es parte de este spec; el perfil `/kids/[slug]` sigue estático hasta su spec |
| `supabase db pull` genera diff vacío si se usó `apply_migration` | Usar `execute_sql`/`db query` para iterar y `db pull` solo al final |
| Slugs estáticos viejos (`mateo-fernandez`) no existen en BD | Fallback al perfil estático cuando el slug no es uuid o no está en BD |

## What is **not** in this spec

- Editar niño y archivado lógico (`status = 'archived'`).
- Búsqueda funcional, vincular padres.
- Políticas RLS con ownership (`auth.uid()`) y aislamiento multitenant.
- Resto de tablas del schema (`posts`, `post_children`, etc.).
- Storage, Realtime, Edge Functions.

Cada uno, si llega, va en su propio spec.
