# SPEC 01 — Home: feed estático idéntico al mockup

> **Estado:** Approved
> **Depende de:** —
> **Fecha:** 2026-08-12
> **Objetivo:** Implementar la plantilla `references/pantallas/feed.dc.html` como home (`/`) con datos estáticos, sin autenticación ni base de datos, replicando el estilo de forma idéntica.

## Scope

**In:**

- Reemplazar el starter de `app/page.tsx` por el feed replicado del mockup.
- Contenido estático idéntico al mockup: encabezado "Buenas, Caro", composer "Compartí un momento…", separador "Publicado hoy" y los 3 posts (logro de Mateo, actividad con foto, anuncio general) con nombres, horas, textos y conteos exactos.
- Sidebar de 248px fija con logo OpenDayCare, botón "Nueva publicación", nav (Feed activo + Niños, Avisos, Mi cuenta) y bloque de perfil "Caro Giménez" con cerrar sesión. Todos los enlaces inertes (`href="#"`), solo Feed marcado como activo.
- Fuentes Fredoka y Nunito vía `next/font/google`.
- Estilo con Tailwind v4 usando los valores exactos del mockup (colores, radios, sombras, layout).
- Responsive básico: la sidebar se oculta en viewports < 1024px.
- Verificación visual con Playwright contra `references/screenshots/feed.png`.

**Out of scope (para specs futuros):**

- Autenticación y cerrar sesión real.
- Base de datos o persistencia de cualquier tipo.
- Rutas Niños, Avisos, Mi cuenta, Crear publicación, detalle de publicación ni foto.
- Interacciones (likes, comentarios, "Editar").
- Carga de datos reales desde API.

## Data model

```ts
// app/data/feed.ts
export type PostKind = "achievement" | "activity" | "announcement";

export interface FeedPost {
  id: number;
  kind: PostKind;
  authorInitial: string;   // "M" (Mateo)
  authorBg: string;        // color de fondo del avatar
  authorColor: string;     // color del texto del avatar
  authorName: string;
  time: string;            // "14:20 · publicado por vos"
  audience: string;        // "Para: familia de Mateo" | "Para: toda la sala"
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;     // solo en posts de tipo "activity"
}

export const posts: FeedPost[];  // los 3 posts exactos del mockup
```

Convenciones:

- Código e identificadores en inglés (`kind: "achievement" | "activity" | "announcement"`). Solo el texto renderizado en pantalla va en español (nombres, fechas, badges).
- El badge del post mapea el `kind` a su etiqueta en español: `achievement` → "LOGRO", `activity` → "ACTIVIDAD", `announcement` → "ANUNCIO".
- El avatar de Mateo es "M" sobre `#A9D9E8`/`#1F7A93`; el de Caro es "C" sobre `#F2937A`.

## Implementation plan

**Árbol de directorios** (leyenda: `+` crear · `~` modificar · sin marca = intocado):

```
06-open-daycare/
├── AGENTS.md                                  # sin cambios
├── CLAUDE.md                                  # sin cambios
├── README.md                                  # sin cambios
├── next.config.ts                             # sin cambios
├── eslint.config.mjs                          # sin cambios
├── tsconfig.json                              # sin cambios
├── opencode.json                              # sin cambios
├── package.json                               # sin cambios (sin dependencias nuevas)
├── package-lock.json                          # sin cambios
├── next-env.d.ts                              # sin cambios
├── .gitignore                                 # sin cambios
│
├── public/                                    # sin cambios (assets del starter)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── app/                                       # ÚNICA zona de código tocada
│   ├── layout.tsx                             # ~ MODIFICAR  (fuentes next/font, lang="es", metadata, fondo body)
│   ├── globals.css                            # ~ MODIFICAR  (reset, scrollbar, tokens color, quitar dark-mode)
│   ├── page.tsx                               # ~ REEMPLAZAR (home = feed)
│   ├── favicon.ico                            # sin cambios
│   ├── components/                            # + NUEVO (crear)
│   │   ├── sidebar.tsx                        #   + sidebar 248px, enlaces inertes (href="#")
│   │   └── feed-post.tsx                      #   + card de post, variantes logro|actividad|anuncio
│   └── data/                                  # + NUEVO (crear)
│       └── feed.ts                            #   + tipos + array estático de 3 posts
│
├── references/                                # fuente de verdad — sin cambios
│   ├── pantallas/
│   │   ├── feed.dc.html
│   │   ├── support.js                         # generado, no tocar
│   │   └── *.dc.html                          # resto de mockups
│   └── screenshots/
│       ├── feed.png                           # referencia visual para verificación
│       └── *.png
│
├── .playwright-mcp/                           # ya existe — se añade 1 captura de verificación
│   ├── console-*.log                          # artefactos existentes
│   ├── page-*.yml
│   └── feed-verification.png                  # + NUEVO (screenshot generado en paso 8)
│
└── specs/                                     # + NUEVO (crear)
    ├── .spec-config.yml                       # + config workflow (AutoCreateBranch: true)
    └── 01-home-feed.md                        # + este spec
```

**Pasos** (cada uno deja el sistema funcional):

1. Actualizar `app/layout.tsx`: fuentes Fredoka y Nunito con `next/font/google`, `lang="es"`, metadata (título "OpenDayCare") y fondo `#F6ECDF` en el body. → `npm run dev`, la página starter sigue cargando.
2. Actualizar `app/globals.css`: reset base, color de fondo, estilos de scrollbar del mockup y eliminar el override de dark mode del starter.
3. Crear `app/data/feed.ts` con los tipos y los 3 posts estáticos.
4. Crear `app/components/sidebar.tsx`: sidebar 248px, sticky, con logo, "Nueva publicación", nav y perfil, todo con `href="#"`.
5. Crear `app/components/feed-post.tsx`: card de post con variantes logro/actividad/anuncio, badge de tipo, contadores y footer (like/comentario/Editar) estáticos.
6. Reescribir `app/page.tsx`: layout flex (sidebar + main de 760px), encabezado, composer, separador y render de posts desde `feed.ts`.
7. Responsive: sidebar `hidden` bajo `lg` (`hidden lg:flex`).
8. Verificación: `npm run lint` y `npm run build`. Captura con Playwright en `.playwright-mcp/feed-verification.png` y comparación con `references/screenshots/feed.png`.

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] `/` muestra los 3 posts del mockup con contenido exacto (nombres, horas, textos, conteos de likes/comentarios).
- [ ] El estilo coincide con `references/screenshots/feed.png` (colores, tipografías, radios, sombras, layout).
- [ ] El sidebar muestra los 5 enlaces del mockup y solo "Feed" aparece activo (fondo `#FBE3D8`, color `#D9583C`).
- [ ] Ningún enlace del sidebar navega a una ruta real (todos inertes con `href="#"`).
- [ ] La sidebar se oculta en viewports < 1024px.
- [ ] No hay errores en consola al cargar `/`.

## Decisions

- **Sí:** `next/font/google` para Fredoka y Nunito. Vía idiomática en Next 16, sin requests externos.
- **Sí:** Tailwind v4 con valores exactos. Reutiliza el stack ya instalado.
- **Sí:** Contenido 100% hardcodeado igual al mockup. Sin BD no hay otra fuente.
- **Sí:** Enlaces inertes (`href="#"`). Las pantallas destino van en specs propios.
- **Sí:** Responsive básico ocultando la sidebar < lg. El mockup es desktop y ocultar es el mínimo viable.
- **Sí:** Split en componentes (sidebar, feed-post, data). Reutilizables para las próximas pantallas.
- **No:** Autenticación ni cierre de sesión real. No hay backend.
- **No:** localStorage/IndexedDB. Nada se persiste aún.
- **No:** Interacciones de like/comentario/editar. Contadores estáticos.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Fredoka/Nunito vía next/font difieren sutilmente de Google Fonts | Comparación visual con screenshot de referencia |
| Diferencias de render (scrollbar, antialiasing) entre mockup y app | Ajustar `globals.css` según la captura |

## What is **not** in this spec

- Autenticación y logout real.
- Base de datos o persistencia.
- Rutas Niños, Avisos, Mi cuenta, Crear publicación, detalle o foto.
- Likes, comentarios y edición funcionales.
- Carga de datos desde API.

Cada uno, si llega, va en su propio spec.