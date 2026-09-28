# SPEC 09 — Login real con Supabase y protección de rutas

> **Estado:** Implemented
> **Depende de:** SPEC 03 (páginas `/auth/login` y `/auth/activate-account` estáticas), SPEC 08 (tabla `public.users`, trigger de signup, seed staff `yair@mail.com`)
> **Fecha:** 2026-09-28
> **Objetivo:** Conectar `/auth/login` a Supabase Auth (email + password) mediante Server Action y proteger todas las rutas salvo `/auth/*` redirigiendo al login cuando no hay sesión.

## Scope

**In:**

- Formulario `/auth/login` funcional: envía email + password a una Server Action que llama `signInWithPassword` con el cliente server de Supabase y redirige a `/` si es válido.
- Error inline en español sobre el formulario cuando las credenciales son inválidas (sin navegar).
- Protección de rutas en `proxy.ts` / `utils/supabase/middleware.ts`: sin sesión, toda ruta salvo `/auth/*` (y assets) redirige a `/auth/login`; con sesión, visitar `/auth/login` redirige a `/`.
- Botón "Cerrar sesión" en el sidebar que ejecuta una Server Action `signOut` y redirige a `/auth/login`.
- Tarjeta de usuario del sidebar con datos reales: `full_name` y sala desde `public.users` (+ `daycares`) según la sesión; fallback al email de los claims si no hay perfil.
- Patrón de protección según documentación vigente de Supabase + Next.js 16 vía Context7: archivo `proxy.ts` en raíz (Next 16 renombró `middleware.ts` → `proxy.ts` y la función exportada `middleware` → `proxy`; en Next ≤15 `proxy.ts` nunca se ejecuta) que delega a `updateSession`, el cual crea el server client con `createServerClient`, verifica la sesión y redirige al login si no hay usuario.

**Out of scope (para specs futuros):**

- Activación de cuenta real, códigos de invitación y envío de emails (`/auth/activate-account` queda intacta).
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" sigue inerte).
- Registro público / signup desde la app.
- RLS con `auth.uid()` y aislamiento multitenant por `daycare_id` (SPEC 08 lo difiere aquí también).
- Roles (staff/parent) y parent feed.

## Data model

No se introduce ningún dato nuevo: la sesión vive en las cookies que gestiona `@supabase/ssr`; el perfil sigue en `public.users` (SPEC 08). Verificación manual con el seed `yair@mail.com` / `Abc123@`.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
app/
├── auth/
│   ├── login/
│   │   ├── page.tsx                 # ~ MODIFICAR (form real + error inline)
│   │   └── actions.ts               # + NUEVO (signIn Server Action)
│   └── activate-account/page.tsx    # sin cambios
├── components/
│   └── sidebar.tsx                  # ~ MODIFICAR (botón logout + Server Action signOut)
proxy.ts                             # ~ MODIFICAR (ya delega a updateSession; sin cambios de estructura)
utils/supabase/middleware.ts         # ~ RENOMBRAR a utils/supabase/proxy.ts (nomenclatura oficial Next 16) + añadir redirects por sesión
```

**Pasos** (cada uno deja el sistema funcional):

1. Ampliar `updateSession` (renombrado a `utils/supabase/proxy.ts`) con el patrón oficial Supabase: tras `getClaims()` (antes `getUser()`; `getClaims` lee el JWT local sin llamada de red en cada request), si no hay usuario y la ruta no empieza con `/auth`, redirigir a `/auth/login` copiando las cookies refrescadas a la respuesta de redirect; si hay usuario en `/auth/login`, redirigir a `/`. `proxy.ts` en raíz ya delega correctamente y su `matcher` ya coincide con el oficial.
2. Crear la Server Action de login (`app/auth/login/actions.ts`): `signInWithPassword`, `revalidatePath`, redirect a `/` en éxito y retorno de mensaje de error en fallo.
3. Convertir `app/auth/login/page.tsx` en formulario real (mismo diseño SPEC 03, sin valores hardcodeados como sesión) con `useActionState` o equivalente para el error inline en español.
4. Añadir logout: Server Action `signOut` + botón en `sidebar.tsx` con el estilo existente.
5. Tarjeta de usuario real en `sidebar.tsx`: el Server Component lee los claims y consulta `public.users` (join `daycares`) con el cliente server; muestra `full_name`, inicial del avatar y nombre de la sala; fallback al email si no hay perfil.
6. Verificación: `npm run lint` y `npm run build`; Playwright: login válido → `/`, login inválido → error inline sin navegar, ruta `/` sin sesión → `/auth/login`, `/auth/login` con sesión → `/`, logout → `/auth/login`, sidebar muestra `full_name` y sala reales.

## Acceptance criteria

- [x] `npm run build` y `npm run lint` pasan sin errores. — verificado 2026-09-28 (0 errores; solo warning preexistente de `<img>`).
- [x] Login con `yair@mail.com` / `Abc123@` redirige a `/` y crea sesión (recargar `/` mantiene la sesión). — verificado en Playwright; requirió reparar el seed (migración `20260928125004_fix_seed_app_metadata`: `raw_app_meta_data`, fila en `auth.identities`, tokens `''` en vez de NULL).
- [x] Login con credenciales inválidas muestra error inline en español y permanece en `/auth/login`. — verificado en Playwright (`nadie@example.com`).
- [x] Sin sesión, visitar `/` (y cualquier ruta fuera de `/auth/*`) redirige a `/auth/login`. — verificado en Playwright (`/` y `/kids`, 307).
- [x] Con sesión, visitar `/auth/login` redirige a `/`. — verificado en Playwright.
- [x] El botón de logout cierra la sesión y redirige a `/auth/login`; después, `/` vuelve a redirigir al login. — verificado en Playwright (mismo browser).
- [x] Con sesión de `yair@mail.com`, el sidebar muestra `Caro Giménez`, inicial `C` y la sala real; sin perfil muestra el email. — verificado en Playwright (ambos casos: con perfil y con fila `public.users` eliminada temporalmente + restaurada).
- [x] `/auth/activate-account` sigue idéntica a SPEC 03 (visual y comportamiento). — archivo intacto (fuera del diff), responde 200, screenshot `.playwright-mcp/activate-account-verify.png`.
- [x] Sin errores en consola en los flujos de login, redirect y logout (Playwright). — 0 errores en todos los flujos.
- [x] No se expone información sensible en el mensaje de error (mensaje genérico, sin distinguir "usuario inexistente" vs "password incorrecta"). — una sola constante `INVALID_CREDENTIALS_MESSAGE` para todos los fallos (`actions.ts`).

## Decisions

- **Sí:** Solo email + password con Supabase Auth (decisión del usuario).
- **Sí:** Solo login real; activación y recuperación quedan fuera (respuestas Phase 2).
- **Sí:** Server Action con cliente server (`utils/supabase/server.ts`) en vez de cliente browser; es el patrón documentado por Supabase para App Router.
- **Sí:** Protección en `proxy.ts` (Next 16 renombró `middleware.ts` → `proxy.ts`; verificado en docs Next.js v16.0.3 y guía Supabase vía Context7). El repo ya usa `proxy.ts` en raíz con el `matcher` oficial; el helper se renombra a `utils/supabase/proxy.ts`.
- **Sí:** Verificación de sesión con `getClaims()` en vez de `getUser()` (patrón oficial vigente: evita una llamada al Auth server por request; quitarlo causa logouts aleatorios con SSR).
- **Sí:** Todo menos `/auth/*` protegido; no autenticado → `/auth/login`, autenticado en `/auth/login` → `/`.
- **Sí:** Logout como Server Action con botón en el sidebar.
- **Sí:** Error inline genérico en español (no revela si el email existe).
- **No:** Signup, activación real, recuperación, roles ni RLS por `auth.uid()` en este spec.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| La API de `@supabase/ssr` / Next 16 cambió respecto al boilerplate actual | Consultar Context7 primero (paso 1 del plan) y seguir la doc vigente |
| `proxy.ts` vs `middleware.ts` en Next 16 | Verificar convención del repo (`proxy.ts` en raíz) contra la doc de Next 16 vía Context7 |
| Seed `yair@mail.com` no existe en el proyecto remoto | Verificar `auth.users` antes de la demo; el seed es local (SPEC 08) |

## What is **not** in this spec

- Activación de cuenta real e invitaciones.
- Recuperación / cambio de contraseña.
- Registro público de usuarios.
- RLS con ownership (`auth.uid() = id`) y multitenant por `daycare_id`.
- Roles, permisos y parent feed.

Cada uno, si llega, va en su propio spec.
