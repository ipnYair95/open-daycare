# SPEC 02 — Niños: listado y perfil de niño (estáticos, idénticos al mockup)

> **Estado:** Approved
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-12
> **Objetivo:** Implementar `references/pantallas/ninos.dc.html` como `/kids` y `references/pantallas/perfil-nino.dc.html` como `/kids/[slug]`, con datos estáticos, solo interfaces y componentes, replicando el diseño de forma idéntica.

## Scope

**In:**

- Ruta `/kids`: réplica de `ninos.dc.html` — header "GESTIÓN · Niños", botón "Agregar niño", buscador "Buscar niño…", separador "SALA SOLES · 8 niños" y grid de 2 columnas con las 8 tarjetas (avatar con inicial, nombre, "N años · X padres vinculados", badge MANÍ/LACTOSA/VINCULAR o chevron).
- Ruta `/kids/[slug]`: réplica de `perfil-nino.dc.html` con los datos de Mateo — "Volver a Niños", avatar 84px, nombre, "3 años · Sala Soles", botón "Editar", alerta "Alergias y notas", card de info (nacimiento, sala, ingreso), columna derecha con "Resumen del día", "PADRES VINCULADOS" (Lucía ACTIVA, Diego PENDIENTE, "Vincular otro padre").
- Sidebar compartido con prop de sección activa: en `/kids` y `/kids/[slug]` marca **Niños** (`#FBE3D8`/`#D9583C`); la home sigue marcando **Feed**.
- `app/data/kids.ts` con los 8 niños del mockup. Solo Mateo lleva los campos extra de perfil (alergia, nacimiento, ingreso, padres listados).
- Las 8 tarjetas navegan a `/kids/<slug>`; los slugs de los otros 7 renderizan solo el encabezado del perfil (avatar, nombre, edad · Sala Soles, Editar) sin datos inventados.
- Verificación visual con Playwright contra `references/screenshots/ninos.png` y contra `perfil-nino.dc.html` (no existe screenshot de perfil).

**Out of scope (para specs futuros):**

- Agregar niño, Editar, Vincular padre y Resumen del día (enlaces inertes `href="#"`).
- Autenticación, cierre de sesión real, BD o persistencia.
- Búsqueda funcional del buscador.
- Rutas Avisos, Mi cuenta, Crear publicación, resumen del día.
- Cualquier interacción o carga de datos desde API.

## Data model

```ts
// app/data/kids.ts
export interface Kid {
  id: number;
  slug: string;              // "mateo-fernandez"
  firstName: string;         // "Mateo"
  lastName: string;          // "Fernández"
  age: number;               // 3
  initial: string;           // "M"
  avatarBg: string;          // "#A9D9E8"
  avatarColor: string;       // "#1F7A93"
  linkedParentsCount: number;// 2
  badge?: "peanut" | "lactose" | "link";  // mapea a MANÍ / LACTOSA / VINCULAR
}

export interface KidProfile extends Kid {
  room: string;              // "Soles"
  birthDate?: string;        // "12 mar 2022"   (solo Mateo)
  joinedAt?: string;         // "feb 2025"      (solo Mateo)
  allergyNote?: string;      // "Alergia al maní…" (solo Mateo)
  linkedParents?: { name: string; role: string; status: "active" | "pending" }[];  // solo Mateo
}

export const kids: KidProfile[];  // los 8 niños exactos del mockup
```

Convenciones (igual que SPEC 01): código e identificadores en inglés, solo el texto renderizado en español; badges mapean el enum a su etiqueta.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
app/
├── layout.tsx                       # sin cambios
├── globals.css                      # sin cambios
├── page.tsx                         # ~ MODIFICAR (pasar active="feed" al Sidebar)
├── components/
│   ├── sidebar.tsx                  # ~ MODIFICAR (prop active: "feed" | "kids")
│   ├── feed-post.tsx                # sin cambios
│   └── kid-card.tsx                 # + NUEVO (tarjeta del grid)
├── data/
│   ├── feed.ts                      # sin cambios
│   └── kids.ts                      # + NUEVO (tipos + 8 niños, Mateo completo)
└── kids/
    ├── page.tsx                     # + NUEVO (listado /kids)
    └── [slug]/
        └── page.tsx                 # + NUEVO (perfil, generateStaticParams con 8 slugs)
```

**Pasos** (cada uno deja el sistema funcional):

1. Modificar `app/components/sidebar.tsx`: prop `active: "feed" | "kids"` para marcar el ítem correcto. → la home sigue igual visualmente.
2. Actualizar `app/page.tsx`: `<Sidebar active="feed" />`.
3. Crear `app/data/kids.ts` con tipos y los 8 niños; Mateo con perfil completo.
4. Crear `app/components/kid-card.tsx`: card con avatar, nombre, "N años · X padres vinculados" y badge/chevron.
5. Crear `app/kids/page.tsx`: header, "Agregar niño" (`href="#"`), buscador (input estático), separador y grid de 2 columnas con las 8 cards.
6. Crear `app/kids/[slug]/page.tsx`: `generateStaticParams` con los 8 slugs; si el kid tiene campos de perfil renderiza el perfil completo de Mateo, si no solo el encabezado; enlaces secundarios inertes.
7. Verificación: `npm run lint` y `npm run build`. Capturas con Playwright en `.playwright-mcp/kids-verification.png` y `.playwright-mcp/profile-verification.png`, comparando `/kids` contra `references/screenshots/ninos.png` y el perfil contra `perfil-nino.dc.html`.

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] `/kids` muestra los 8 niños con contenido exacto del mockup (nombres, edades, conteos de padres, badges) en grid de 2 columnas.
- [ ] `/kids` coincide visualmente con `references/screenshots/ninos.png`.
- [ ] En `/kids` y `/kids/[slug]` el sidebar marca "Niños" activo; en `/` sigue marcando "Feed".
- [ ] Las 8 tarjetas navegan a `/kids/<slug>`.
- [ ] `/kids/mateo-fernandez` replica el perfil del mockup: alergia al maní, nacimiento "12 mar 2022", sala "Soles", ingreso "feb 2025", padres "Lucía Fernández · ACTIVA" y "Diego Fernández · PENDIENTE", botón "Resumen del día".
- [ ] Los otros 7 slugs renderizan solo el encabezado (avatar, nombre, edad · Sala Soles, Editar) sin datos inventados.
- [ ] "Agregar niño", "Editar", "Vincular otro padre", "Resumen del día", "Nueva publicación" y cerrar sesión son inertes (`href="#"`).
- [ ] No hay errores en consola al cargar `/kids` y `/kids/mateo-fernandez`.

## Decisions

- **Sí:** Rutas `/kids` y `/kids/[slug]` navegables (decisión del usuario). El perfil es estático porque solo existe el mockup de Mateo.
- **Sí:** Prop `active` en el sidebar compartido en vez de duplicar el componente.
- **Sí:** `data/kids.ts` con tipos + array estático, mismo patrón que `data/feed.ts`.
- **Sí:** Los 8 slugs navegables; los 7 sin mockup renderizan solo el encabezado para no inventar contenido.
- **Sí:** Enlaces secundarios inertes (`href="#"`), igual que en SPEC 01.
- **No:** Búsqueda funcional, agregar/editar/vincular padre, resumen del día, autenticación ni BD.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| No existe screenshot de referencia del perfil | Verificar contra `perfil-nino.dc.html` directamente (valores y estilos) |
| Hover de las cards (`.kid:hover` del mockup) no se ve en screenshot estático | Incluir la transición/hover en `kid-card.tsx` |