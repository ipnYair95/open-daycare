# SPEC 11 — Vincular padre: invitación con código, email con Resend y activación de cuenta

> **Estado:** Approved
> **Depende de:** SPEC 03, SPEC 05, SPEC 08, SPEC 09, SPEC 10
> **Fecha:** 2026-09-28
> **Objetivo:** Volver funcional el modal "Vincular padre": genera una invitación con código único, la envía por email con Resend desde Next.js y permite al padre activar su cuenta con email + código + contraseña, creando su usuario y el vínculo con el niño.

## Scope

**In:**

- Enums `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`).
- Tablas `public.invitations` y `public.parent_children` según `07-DB-Schema` §5–§6, con RLS permisiva `TO authenticated` (4 políticas por tabla, como SPEC 07/08/10) y migración versionada en `supabase/migrations/`.
- Mapeo parentesco UI → enum: Mamá → `mother`, Papá → `father`, Tutor/a → `guardian`.
- Modal `link-parent-modal.tsx` funcional: valida nombre/email, genera código de 5 caracteres alfanuméricos (tipo `7K4P9`, UNIQUE, `expires_at = now() + 7 días`), guarda la invitación en `pending` y muestra el código real generado en vez del hardcodeado.
- Envío del correo desde Next.js con el SDK npm `resend` en una Server Action, con `RESEND_API_KEY` e `INVITATION_EMAIL_FROM` en `.env.local` (gitignored, solo servidor); email simple (texto plano + HTML mínimo) con el código, el nombre del niño y la expiración.
- Re-invitar al mismo (niño + email) con invitación `pending` vigente: regenera código y expiración (la anterior queda `cancelled`).
- `/auth/activate-account` funcional: formulario email + código + crear contraseña (mínimo 8 caracteres); si el código es válido, vigente y el email coincide, crea `auth.users` + `public.users` (rol `parent`) + `parent_children`, marca la invitación `accepted` (`accepted_at = now()`) e inicia sesión redirigiendo a `/`.
- Error genérico en español si el email ya tiene cuenta o el código es inválido/vencido (sin revelar cuál falló).

**Out of scope (para futuros specs):**

- Recuperación / cambio de contraseña.
- Reenvío manual, cancelación desde UI y listado de invitaciones pendientes.
- Parent feed y roles/permisos por rol.
- RLS con `auth.uid()` y aislamiento multitenant por `daycare_id`.
- Plantilla HTML elaborada del correo (se usa texto + HTML mínimo).

## Data model

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

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
-- RLS: enable + 4 políticas TO authenticated por tabla (patrón SPEC 10).
```

Convenciones:

- Código: 5 caracteres `[A-Z0-9]` sin caracteres ambiguos (`0/O`, `1/I`), generado en servidor con reintento ante colisión del `UNIQUE`.
- Expiración fija: 7 días desde la creación/regeneración.
- `RESEND_API_KEY` e `INVITATION_EMAIL_FROM` solo en servidor (Server Action); nunca expuestas al cliente.
- Comparación de email case-insensitive en la activación.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
supabase/
└── migrations/
    └── <timestamp>_create_invitations_parent_children.sql  # + NUEVO (migración imperativa)
app/
├── auth/
│   └── activate-account/
│       ├── page.tsx                                       # ~ MODIFICAR (formulario real: email + código + password)
│       └── actions.ts                                     # + NUEVO (canjear código + signup + vínculo + login)
└── components/
    └── link-parent-modal.tsx                              # ~ MODIFICAR (funcional: genera código + envía email)
.env.local                                                 # ~ MODIFICAR (agregar RESEND_API_KEY + INVITATION_EMAIL_FROM, gitignored)
```

**Pasos** (cada uno deja el sistema funcional):

1. Pre-check: `npx supabase --version`, `ls supabase/migrations/` y `npx supabase migration list --local` (si no hay stack local, usar `execute_sql` contra remoto y documentar `npx supabase start` como prerequisito).
2. Crear borrador `npx supabase migration new create_invitations_parent_children` e iterar SQL vía `execute_sql`/`db query` sin `apply_migration`: enums, tablas con FKs/checks/defaults, `UNIQUE (parent_id, child_id)`, `UNIQUE (code)`, RLS + 8 políticas `TO authenticated`. Verificar: `pg_type`, `pg_class`, `pg_policies`.
3. Ejecutar `get_advisors` (`security`/`performance`) y corregir hallazgos; consolidar con `npx supabase db pull --local --yes` (o archivo manual si no hay Docker, documentando el prerequisito).
4. Instalar `resend` (`npm i resend`) y documentar `RESEND_API_KEY` + `INVITATION_EMAIL_FROM` (ej. `Guardería Sala Soles <hola@tu-dominio>`) en `.env.local`.
5. Server Action de invitación: valida nombre/email/parentesco, genera código único (reintento ante colisión), cancela `pending` previa del mismo niño+email, inserta la nueva `pending`, envía el email simple con Resend; el modal muestra el código real y el estado de envío/error.
6. Server Action de activación: valida email + código + password (mínimo 8 caracteres), verifica invitación `pending` no vencida con email coincidente, crea usuario Auth con metadata (`full_name`, rol `parent`), crea el vínculo `parent_children` con el parentesco, marca `accepted` (`accepted_at = now()`), inicia sesión y redirige a `/`; errores genéricos en español.
7. Verificación final: `npm run lint` y `npm run build`; E2E Playwright (invitar → activar con el código → vínculo visible en el perfil); capturas en `.playwright-mcp/`.

## Acceptance criteria

- [ ] Migración existe con los 2 enums y las 2 tablas según columnas del schema; RLS activo con 8 políticas `TO authenticated`.
- [ ] "Enviar invitación" genera un código real de 5 caracteres (ya no `7K4P9` fijo), lo muestra y guarda la invitación `pending` con `expires_at` ≈ +7 días.
- [ ] El padre recibe el email simple con el código, el nombre del niño y la expiración (o el log de Resend lo confirma en dev sin dominio verificado); el remitente es el de `INVITATION_EMAIL_FROM`.
- [ ] Re-invitar regenera el código y cancela el anterior; el código viejo ya no activa.
- [ ] Activar con email + código vigente + contraseña crea el usuario, el vínculo `parent_children` con el parentesco elegido y marca la invitación `accepted`.
- [ ] Código inválido, vencido o email no coincidente muestra error genérico sin crear nada.
- [ ] Email ya registrado muestra error genérico (sin revelar que la cuenta existe).
- [ ] `npm run build` y `npm run lint` pasan; sin errores en consola en ambos flujos.

## Decisions

- **Sí:** Flujo completo en un spec (invitar + email + registro), decisión del usuario.
- **Sí:** Envío desde Next.js con el SDK npm `resend` en Server Action, decisión del usuario.
- **Sí:** Email simple (texto + HTML mínimo), remitente configurable vía `INVITATION_EMAIL_FROM`, decisión del usuario.
- **Sí:** Código formato mockup `7K4P9`, UNIQUE, vence en 7 días, decisión del usuario.
- **Sí:** Password mínima de 8 caracteres en la activación, confirmado por el usuario.
- **Sí:** Re-invitar regenera y cancela la previa; email existente → error genérico, decisión del usuario.
- **Sí:** Tablas según `07-DB-Schema` §5–§6 con RLS permisiva temporal y `invited_by` nullable (`ON DELETE SET NULL`), consistencia con SPEC 07/08/10.
- **No:** Recuperación de contraseña, gestión de invitaciones desde UI, parent feed, RLS por `auth.uid()`, plantilla HTML elaborada.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Resend sin dominio verificado no entrega a terceros | En dev usar email de prueba del remitente; documentar verificación del dominio para prod |
| Colisión del código (`UNIQUE`) | Generación en servidor con reintento (máx. 5) |
| Signup + vínculo + `accepted` en pasos separados deja estado parcial | Misma Server Action tras el signup; error visible si algo falla |
| Enumeración de emails vía mensajes distintos | Un solo mensaje genérico para código inválido/vencido/email distinto/existente |
| `apply_migration` genera historial prematuro y `db pull` queda vacío | Iterar con `execute_sql`/`db query` y `db pull --local` solo al final (patrón SPEC 10) |

## What is **not** in this spec

- Recuperación / cambio de contraseña.
- Reenvío, cancelación y listado de invitaciones desde UI.
- Parent feed y permisos por rol.
- RLS con ownership (`auth.uid()`) y multitenant por `daycare_id`.
- Plantilla HTML elaborada del correo.

Cada uno, si llega, va en su propio spec.
