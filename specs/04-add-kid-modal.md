# SPEC 04 — Modal "Agregar niño" (estático, idéntico al mockup)

> **Estado:** Approved
> **Depende de:** SPEC 02
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar `references/pantallas/agregar-nino.dc.html` como un modal superpuesto en `/kids`, abierto por el botón superior "Agregar niño", con formulario estático y acciones inertes, replicando el diseño de forma idéntica.

## Scope

**In:**

- Botón "Agregar niño" del header de `/kids` (hoy `href="#"`) pasa a abrir un modal superpuesto (overlay).
- Modal `agregar-nino.dc.html` como componente cliente: backdrop difuminado + card de 520px centrada.
- Header del modal: "Cancelar" (cierra el modal), título "Agregar niño", "Guardar" inerte (`href="#"`).
- Formulario con los campos exactos del mockup: NOMBRE COMPLETO (`Ej. Martina López`), FECHA DE NACIMIENTO (`dd/mm/aaaa`, con formato obligatorio), SALA (dropdown funcional con chevron, opciones derivadas de las salas existentes), ALERGIAS (ETIQUETAS) (`Ej. Maní, Lactosa`), NOTAS MÉDICAS (textarea `Indicaciones, medicación, contactos…`).
- Verificación visual con Playwright contra `agregar-nino.dc.html` (no existe screenshot de referencia).

**Out of scope (para specs futuros):**

- Guardar funcional (añadir un niño a la lista), persistencia ni estado del nuevo niño.
- Búsqueda funcional.
- Validación de campos en general (solo el formato de fecha es obligatorio, ver In).
- Autenticación, BD.

## Data model

No se introduce ningún dato nuevo: el modal es puramente presentacional, los campos van hardcodeados en el componente y no se guarda nada.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
app/
├── kids/
│   └── page.tsx                    # ~ MODIFICAR (reemplazar <a href="#"> por el componente)
└── components/
    └── add-kid-modal.tsx           # + NUEVO (botón trigger + modal overlay)
```

**Pasos** (cada uno deja el sistema funcional):

1. Crear `app/components/add-kid-modal.tsx`: componente cliente que renderiza el botón "Agregar niño" (mismo estilo actual) y, cuando el estado `open` es `true`, el overlay + card del modal con los campos exactos del mockup. `Cancelar` cierra (`setOpen(false)`); `Guardar` inerte (`href="#"`); SALA muestra `Soles` estático con chevron. Clic en el backdrop cierra el modal.
2. Modificar `app/kids/page.tsx`: reemplazar el `<a href="#">` "Agregar niño" por `<AddKidModal />`.
3. Verificación: `npm run lint` y `npm run build`. Captura Playwright en `.playwright-mcp/add-kid-modal-verification.png`, comparada contra `agregar-nino.dc.html`.

## Acceptance criteria

- [] `npm run build` y `npm run lint` pasan sin errores. — Verificado: build OK (15 rutas) y eslint sin errores.
- [] En `/kids`, el botón "Agregar niño" abre el modal (overlay visible con la card de 520px) y el listado sigue intacto detrás. — Verificado con Playwright: card 520px, listado "8 niños" y cards presentes detrás del overlay.
- [] El modal replica el mockup con campos y placeholders exactos (NOMBRE COMPLETO `Ej. Martina López`, FECHA DE NACIMIENTO `dd/mm/aaaa`, SALA `Soles`, ALERGIAS `Ej. Maní, Lactosa`, NOTAS MÉDICAS `Indicaciones, medicación, contactos…`). — Verificado vía snapshot accesible y computed styles.
- [] SALA es un dropdown funcional: al abrirlo muestra las salas existentes, permite seleccionar y refleja la opción elegida. — `<select>` nativo estilizado con chevron; opciones derivadas de `kids.ts` (solo `Soles` existe hoy); refleja la selección.
- [] FECHA DE NACIMIENTO obliga al formato `dd/mm/aaaa`: solo admite dígitos y barras, auto-inserta las `/` y muestra error si el valor no coincide con el formato. — Verificado: `12122022`→`12/12/2022`; `01012026x`→`01/01/2026` (letras descartadas); al blur con `01/01` muestra "Formato inválido: usa dd/mm/aaaa", borde `#D9583C` y `aria-invalid`.
- [] "Cancelar" cierra el modal y clic en el backdrop también. — Ambos verificados con Playwright (el modal desaparece del DOM).
- [] "Guardar" es inerte (`href="#"`) y no añade ningún niño ni persiste nada. — `href="#"` (URL pasa a `/kids#` sin navegación), sigue "8 niños" en el listado.
- [] Estilos coinciden con el mockup (borde `#ECE0D0`, radio 24px, fondo `#FBF4EC`, inputs `#EADFD0`, tipografía Fredoka/Nunito). — Verificado: border `rgb(236,224,208)`, radius 24px, bg `rgb(251,244,236)`, inputs border `rgb(234,223,208)`/radius 14px, título Fredoka 600, body Nunito, placeholder `#B6A99B`, sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- [] Sin errores en consola al abrir y cerrar el modal en `/kids`. — 0 errores/0 warnings en consola durante apertura, cierre y clics.

## Decisions

- **Sí:** Modal como overlay cliente en `/kids` en vez de una ruta o una intercepting route (decisión del usuario; es lo más simple y coincide con "modal que se abre desde /kids").
- **Sí:** "Guardar" inerte y "Cancelar"/backdrop cierran el modal (patrón estático del proyecto, igual que SPEC 01/02/03).
- **Sí:** Sin persistencia ni estado de niño nuevo; el modal es solo visual.
- **Sí:** SALA es un dropdown funcional (`<select>` nativo estilizado, con chevron), cuyas opciones provienen de las salas existentes en los datos (hoy solo `Soles`).
- **No:** Añadir niño a la lista, búsqueda, validación de campos en general ni persistencia.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| No existe screenshot de referencia del modal | Verificar contra `agregar-nino.dc.html` directamente (valores y estilos) |
| El mockup usa estilos inline | Reproducir con Tailwind v4 usando los mismos hex/radios/tipografías |