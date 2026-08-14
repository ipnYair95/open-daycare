# SPEC 03 — Login y activación de cuenta (estáticos, idénticos a los mockups)

> **Estado:** Implemented
> **Depende de:** SPEC 01 (el login navega al feed `/`)
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar `references/pantallas/login.dc.html` como `/auth/login` (sin el selector Personal/Familia) y `references/pantallas/activar-cuenta.dc.html` como `/auth/activate-account`, estáticas y con valores hardcodeados, replicando el diseño de forma idéntica.

## Scope

**In:**

- Ruta `/auth/login`: réplica de `login.dc.html` **sin** la sección "INGRESO COMO" (Personal/Familia). Columna izquierda con gradiente, logo OpenDayCare, "El día de cada niño, compartido con su familia.", "🌿 Guardería Sala Soles". Columna derecha: "Iniciar sesión", "Ingresá para ver el día de hoy.", campo EMAIL (valor estático `caro@opendaycare.com`), campo CONTRASEÑA (placeholder `••••••••`), "¿Olvidaste tu contraseña?" inerte (`href="#"`), botón "Iniciar sesión" que navega a `/`, y "¿Te invitó la guardería? Activá tu cuenta" que navega a `/auth/activate-account`.
- Ruta `/auth/activate-account`: réplica de `activar-cuenta.dc.html` — logo, "Bienvenida a OpenDayCare", card "Mateo · Sala Soles" (avatar M), CÓDIGO DE INVITACIÓN `7K4P9`, EMAIL `lucia.fernandez@gmail.com`, CREAR CONTRASEÑA, checkbox "Autorizo a la guardería…" tildado (estático), botón "Activar mi cuenta" inerte (`href="#"`), y "¿Ya tenés cuenta? Iniciar sesión" que navega a `/auth/login`.
- Fuentes Fredoka/Nunito ya disponibles vía `next/font` en el layout (sin cambios).
- Verificación visual con Playwright contra `login.dc.html` y `activar-cuenta.dc.html` (no existen screenshots de referencia).

**Out of scope (para specs futuros):**

- Autenticación real, validación de credenciales ni "¿Olvidaste tu contraseña?" funcional.
- Código de invitación funcional, envío de emails ni activación real.
- Parent feed (`familia-feed.dc.html`).
- Persistencia, BD o sesión.

## Data model

No se introduce ningún dato nuevo: los valores (email, código, nombres) van hardcodeados en cada página.

## Implementation plan

**Árbol** (`+` crear · sin marca = intocado):

```
app/
├── layout.tsx                       # sin cambios
├── globals.css                      # sin cambios
├── page.tsx                         # sin cambios
├── login/                           # no existe
├── auth/
│   ├── login/
│   │   └── page.tsx                 # + NUEVO (/auth/login)
│   └── activate-account/
│       └── page.tsx                 # + NUEVO (/auth/activate-account)
└── kids/                            # sin cambios
```

**Pasos** (cada uno deja el sistema funcional):

1. Crear `app/auth/login/page.tsx`: layout grid de 2 columnas (gradiente izquierdo `#F6A98E→#EC7E62`, formulario derecho), sin selector de rol; email/contraseña estáticos; enlaces secundarios inertes (`href="#"`); "Iniciar sesión" como `Link` a `/` y "Activá tu cuenta" como `Link` a `/auth/activate-account`. Fondo `#FBF4EC`.
2. Crear `app/auth/activate-account/page.tsx`: card centrada de 440px con valores exactos del mockup; checkbox de consentimiento `checked` sin lógica; "Activar mi cuenta" inerte (`href="#"`); "Iniciar sesión" como `Link` a `/auth/login`.
3. Verificación: `npm run lint` y `npm run build`. Capturas Playwright en `.playwright-mcp/login-verification.png` y `.playwright-mcp/activate-verification.png`, comparadas contra los `.dc.html`.

## Acceptance criteria

- [x] `npm run build` y `npm run lint` pasan sin errores. — Verificado: `next build` compila (15 páginas estáticas, ambas rutas `○ Static`) y `eslint` sin salida.
- [x] `/auth/login` replica el mockup sin el selector Personal/Familia (formulario con solo EMAIL, CONTRASEÑA e "Iniciar sesión"). — Verificado con Playwright: sin sección "INGRESO COMO"; EMAIL `caro@opendaycare.com`, CONTRASEÑA placeholder `••••••••`.
- [x] "Iniciar sesión" navega a `/`. — Verificado: click en el `Link` → URL `http://localhost:3000/`.
- [x] "¿Olvidaste tu contraseña?" es inerte (`href="#"`). — Verificado: `a[href="#"]`, color `#C5503A`, 13.5px.
- [x] "Activá tu cuenta" (login) navega a `/auth/activate-account` y "Iniciar sesión" (activar-cuenta) navega a `/auth/login`. — Verificado: ambos clicks navegan correctamente.
- [x] `/auth/activate-account` replica el mockup con valores exactos (Mateo · Sala Soles, `7K4P9`, `lucia.fernandez@gmail.com`) y el checkbox de consentimiento marcado. — Verificado: `checkbox.checked === true`; inputs con los valores hardcodeados.
- [x] "Activar mi cuenta" es inerte (`href="#"`). — Verificado: `a[href="#"]` con gradiente/sombra del mockup.
- [x] Estilos coinciden con los `.dc.html` (gradientes, colores, radios, tipografías). — Verificado vía computed styles: gradiente `155deg #F6A98E→#F2937A→#EC7E62`, fondo `#FBF4EC`, radios 14/15/16px, bordes `#EADFD0`/`#F2A78E`, avatar `#A9D9E8`/`#1F7A93`, Fredoka/Nunito vía `next/font` (h1 42px, h2 30px, código 18px/3px/700).
- [x] Sin errores en consola al cargar `/auth/login` y `/auth/activate-account`. — Verificado: 0 errores y 0 warnings en ambas rutas (Playwright).

## Decisions

- **Sí:** Rutas `/auth/login` y `/auth/activate-account` agrupadas bajo una carpeta `auth` (decisión del usuario).
- **Sí:** Eliminar el selector Personal/Familia del login (decisión del usuario); el login asume rol staff.
- **Sí:** "Iniciar sesión" navega a `/` (feed ya implementado en SPEC 01).
- **Sí:** Valores hardcodeados en las páginas; sin archivo de datos (solo 2 inputs y 1 código).
- **Sí:** Enlaces cruzados entre las 2 rutas reales; enlaces secundarios inertes (`href="#"`), igual que SPEC 01/02.
- **No:** Autenticación, validación, olvidé contraseña, activación real, parent feed ni persistencia.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| No existen screenshots de referencia de login ni activar-cuenta | Verificar contra los `.dc.html` directamente (valores y estilos) |
| Los mockups usan estilos inline | Reproducir con Tailwind v4 usando los mismos hex/gradientes |