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
- Formulario estático con los campos exactos del mockup: NOMBRE COMPLETO (`Ej. Martina López`), FECHA DE NACIMIENTO (`dd/mm/aaaa`), SALA (estático `Soles` con chevron), ALERGIAS (ETIQUETAS) (`Ej. Maní, Lactosa`), NOTAS MÉDICAS (textarea `Indicaciones, medicación, contactos…`).
- Verificación visual con Playwright contra `agregar-nino.dc.html` (no existe screenshot de referencia).

**Out of scope (para specs futuros):**

- Guardar funcional (añadir un niño a la lista), persistencia ni estado del nuevo niño.
- Búsqueda funcional.
- Dropdown SALA funcional.
- Validación de campos.
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

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] En `/kids`, el botón "Agregar niño" abre el modal (overlay visible con la card de 520px) y el listado sigue intacto detrás.
- [ ] El modal replica el mockup con campos y placeholders exactos (NOMBRE COMPLETO `Ej. Martina López`, FECHA DE NACIMIENTO `dd/mm/aaaa`, SALA `Soles`, ALERGIAS `Ej. Maní, Lactosa`, NOTAS MÉDICAS `Indicaciones, medicación, contactos…`).
- [ ] "Cancelar" cierra el modal y clic en el backdrop también.
- [ ] "Guardar" es inerte (`href="#"`) y no añade ningún niño ni persiste nada.
- [ ] Estilos coinciden con el mockup (borde `#ECE0D0`, radio 24px, fondo `#FBF4EC`, inputs `#EADFD0`, tipografía Fredoka/Nunito).
- [ ] Sin errores en consola al abrir y cerrar el modal en `/kids`.

## Decisions

- **Sí:** Modal como overlay cliente en `/kids` en vez de una ruta o una intercepting route (decisión del usuario; es lo más simple y coincide con "modal que se abre desde /kids").
- **Sí:** "Guardar" inerte y "Cancelar"/backdrop cierran el modal (patrón estático del proyecto, igual que SPEC 01/02/03).
- **Sí:** Sin persistencia ni estado de niño nuevo; el modal es solo visual.
- **Sí:** SALA estático `Soles` con chevron, sin dropdown funcional.
- **No:** Añadir niño a la lista, búsqueda, validación, persistencia ni dropdown funcional.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| No existe screenshot de referencia del modal | Verificar contra `agregar-nino.dc.html` directamente (valores y estilos) |
| El mockup usa estilos inline | Reproducir con Tailwind v4 usando los mismos hex/radios/tipografías |