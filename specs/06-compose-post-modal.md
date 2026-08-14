# SPEC 06 — Modal "Nueva publicación" (estático, idéntico al mockup)

> **Estado:** Implemented
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar `references/pantallas/crear-publicacion.dc.html` como un modal superpuesto abierto por el botón "Nueva publicación" del sidebar, con selector de destinatarios (PARA), tipo de publicación (TIPO), descripción, subida funcional de una foto y envío inerte, replicando el diseño de forma idéntica.

## Scope

**In:**

- El botón "Nueva publicación" del sidebar (hoy `href="#"`) pasa a abrir un modal superpuesto (overlay).
- Modal `crear-publicacion.dc.html` como componente cliente: backdrop difuminado + card de 580px centrada, mismo patrón que `add-kid-modal` y `link-parent-modal`.
- Header: "Cancelar" (cierra el modal), título "Nueva publicación", "Publicar" inerte (`href="#"`). No hay botón X en este mockup.
- Sección PARA: chips de los 8 niños derivados de `app/data/kids.ts` con avatar circular (inicial + `avatarBg`/`avatarColor`), selección múltiple con toggle, sin selección inicial. Chip "Toda la sala" exclusivo: activarlo deselecciona a los niños y seleccionar un niño lo desactiva.
- Sección TIPO: píldoras de selección única con las 7 opciones del mockup (Comida/Siesta/Actividad/Logro/Ánimo/Foto/Anuncio) con sus colores exactos, default "Comida".
- Sección DESCRIPCIÓN: textarea vacío con placeholder `Contá cómo le fue hoy…`.
- Sección FOTOS: subida funcional en cliente (input file oculto `accept="image/*"`), máximo 1 foto; la preview ocupa el slot de 96px y una nueva subida la reemplaza (object URL, se revoca la anterior).
- La X no aplica (no existe en el mockup); "Cancelar" y el clic en el backdrop cierran el modal.
- Al cerrar, el modal se reinicia (sin selección, textarea vacío, sin foto).
- Verificación visual con Playwright contra `references/screenshots/compose.png` y `compose2.png`.

**Out of scope (para specs futuros):**

- Publicar real: crear un post en el feed, persistencia ni estado del post nuevo.
- Subida de fotos a un servidor ni persistencia de la imagen.
- Validación de campos ni limitaciones de texto.
- Autenticación, BD.

## Data model

No se introduce ningún dato nuevo: el modal es presentacional. Los destinatarios provienen de `kids.ts` (solo lectura), las selecciones y el texto viven en estado local del componente, y la foto usa un object URL transitorio. Nada se guarda.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
app/
└── components/
    ├── sidebar.tsx                # ~ MODIFICAR (reemplazar <a href="#"> por el componente)
    └── compose-post-modal.tsx     # + NUEVO (botón trigger + modal overlay)
```

**Pasos** (cada uno deja el sistema funcional):

1. Crear `app/components/compose-post-modal.tsx`: componente cliente que renderiza el botón "Nueva publicación" (mismo estilo actual) y, cuando el estado `open` es `true`, el overlay + card de 580px. Header con "Cancelar" (cierra con `setOpen(false)`), título y "Publicar" inerte. Chips PARA derivados de `kids.ts` (multi-select, chip "Toda la sala" exclusivo, sin selección inicial). Píldoras TIPO de selección única con default "Comida". Textarea vacío con placeholder. Input file oculto para FOTOS con preview de 1 foto reemplazable (object URL revocado al reemplazar). Clic en el backdrop cierra el modal; al cerrar se resetea el estado.
2. Modificar `app/components/sidebar.tsx`: reemplazar el `<a href="#">` "Nueva publicación" por `<ComposePostModal />`.
3. Verificación: `npm run lint` y `npm run build`. Captura Playwright en `.playwright-mcp/compose-post-modal-verification.png`, comparada contra `compose.png`/`compose2.png` y `crear-publicacion.dc.html`.

## Acceptance criteria

- [x] `npm run build` y `npm run lint` pasan sin errores. _Verificado: build Next.js 16.3.0 OK (15 rutas), eslint 0 errores (1 warning `no-img-element`, intencional: el object URL blob no es optimizable por `next/image`)._
- [x] En `/`, el botón "Nueva publicación" del sidebar abre el modal (overlay visible con card de 580px) y el feed sigue intacto detrás. _Verificado con Playwright: overlay + card, sidebar y feed presentes._
- [x] El modal replica el mockup: header ("Cancelar" · "Nueva publicación" · "Publicar"), labels PARA/TIPO/DESCRIPCIÓN/FOTOS, placeholders y colores exactos (card `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`). _Verificado por snapshot accesible y estilos computados._
- [x] PARA: los 8 niños de `kids.ts` aparecen como chips con avatar; la selección es múltiple y "Toda la sala" es exclusivo (activarlo limpia los niños; seleccionar un niño lo desactiva). Sin selección inicial. _Verificado: Mateo y Sofía seleccionables a la vez; al activar "Toda la sala" se limpian los niños y viceversa._
- [x] TIPO: selección única con las 7 píldoras y sus colores exactos; "Comida" activa por defecto y el estado activo cambia al hacer clic sin persistir. _Verificado: default Comida; clic en Anuncio mueve el estado._
- [x] DESCRIPCIÓN: textarea vacío con placeholder `Contá cómo le fue hoy…`. _Verificado._
- [x] FOTOS: "Agregar" abre el selector de archivos, la imagen elegida se previsualiza en el slot de 96px y subir otra reemplaza la anterior (siempre máximo 1 foto). _Verificado: subida real con `setInputFiles` (img renderizada con object URL), segunda subida reemplaza la preview (1 img, src distinto)._
- [x] "Cancelar" y el clic en el backdrop cierran el modal; al reabrirlo el estado vuelve a cero (sin destinatarios, textarea vacío, sin foto). _Verificado: Cancelar y backdrop cierran; al reabrir sin foto, sin chips activos._
- [x] "Publicar" es inerte (`href="#"`), siempre activo, y no crea ningún post ni persiste nada. _Verificado: modal sigue abierto, feed sin posts nuevos; el clic nativo del anchor añade `/#` a la URL (comportamiento esperado de `href="#"`)._
- [x] Sin errores en consola al abrir, interactuar y cerrar el modal en `/`. _Verificado: 0 errores, 0 warnings._

> Re-verificado el 2026-08-14 por el spec-verifier (build/lint + Playwright sobre `npm run start`): los 10 criterios pasan.

## Decisions

- **Sí:** Modal como overlay cliente desde el botón del sidebar en vez de una ruta; mismo patrón que `add-kid-modal` de SPEC 04 y `link-parent-modal` de SPEC 05.
- **Sí:** "Publicar" inerte (`href="#"`) y siempre activo; "Cancelar" y el backdrop cierran el modal. No hay X en el mockup, así que no se añade.
- **Sí:** PARA derivado de `kids.ts` (los 8 niños) en multi-select con chip "Toda la sala" exclusivo y sin selección inicial.
- **Sí:** TIPO de selección única (una publicación tiene un solo tipo) con default "Comida", como el mockup.
- **Sí:** Textarea vacío con placeholder; el texto del mockup es solo un ejemplo.
- **Sí:** Subida funcional en cliente (input file + object URL), 1 foto que se reemplaza. Sin servidor no hay otra opción real de preview.
- **No:** Crear el post en el feed, persistencia, validación de campos, subida a servidor ni backend.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| El mockup pre-llena el textarea y nosotros lo dejamos vacío | Verificar estructura/estilos contra `compose.png` y valores/placeholders contra `crear-publicacion.dc.html` |
| Verificar la subida de foto con Playwright | Usar `browser_file_upload` con una imagen de prueba y comprobar la preview en el slot |
| El mockup usa estilos inline | Reproducir con Tailwind v4 usando los mismos hex/radios/tipografías |
