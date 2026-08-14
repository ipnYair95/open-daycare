# SPEC 05 — Modal "Vincular padre" (estático, idéntico al mockup)

> **Estado:** Approved
> **Depende de:** SPEC 02
> **Fecha:** 2026-08-14
> **Objetivo:** Implementar `references/pantallas/vincular-padre.dc.html` como un modal superpuesto en `/kids/[slug]`, abierto por "Vincular otro padre" del perfil del niño, con formulario que valida al salir del campo, selector de parentesco funcional y envío inerte, replicando el diseño de forma idéntica.

## Scope

**In:**

- El enlace "Vincular otro padre" del perfil de niño (hoy `href="#"`, solo visible en Mateo) pasa a abrir un modal superpuesto (overlay).
- Modal `vincular-padre.dc.html` como componente cliente: backdrop difuminado + card de 480px centrada, mismo patrón que `add-kid-modal`.
- Header: título "Vincular padre", subtítulo "a `<nombre del niño>`" (dinámico, prop del kid) y botón X que cierra el modal.
- Banner informativo: "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de `<nombre>`." (fondo `#E3ECFB`, texto `#3F5694`).
- Formulario: NOMBRE DEL PADRE/MADRE (placeholder `Ej. Diego Fernández`), EMAIL (placeholder `correo@ejemplo.com`), selector PARENTESCO funcional (Mamá/Papá/Tutor/a, selección cliente, default "Mamá").
- Validación on blur: NOMBRE obligatorio no vacío; EMAIL obligatorio y con formato válido. Error con borde `#D9583C` + mensaje + `aria-invalid`, que se limpia al escribir (patrón del campo fecha de SPEC 04).
- Código de invitación hardcodeado: `7K4P9` con "Vence en 7 días", box `#FBF1D6` con borde dashed `#E6D08A`.
- "Enviar invitación" inerte (`href="#"`), siempre activo, no cierra el modal.
- La X y el clic en el backdrop cierran el modal.
- Verificación visual con Playwright contra `vincular-padre.dc.html` (no existe screenshot de referencia).

**Out of scope (para specs futuros):**

- Envío real de la invitación, envío de emails ni generación real del código.
- Alta del padre en los datos ni persistencia.
- Mostrar la sección PADRES VINCULADOS ni el enlace en los otros 7 perfiles.
- Autenticación, BD.

## Data model

No se introduce ningún dato nuevo: el modal es presentacional y recibe el nombre del niño como prop del componente. Los valores (nombre, email, código) no se guardan.

## Implementation plan

**Árbol** (`+` crear · `~` modificar · sin marca = intocado):

```
app/
├── kids/
│   └── [slug]/
│       └── page.tsx                    # ~ MODIFICAR (reemplazar <a href="#"> por el componente)
└── components/
    └── link-parent-modal.tsx           # + NUEVO (trigger + modal overlay)
```

**Pasos** (cada uno deja el sistema funcional):

1. Crear `app/components/link-parent-modal.tsx`: componente cliente con prop `kidName: string`. Renderiza el enlace "Vincular otro padre" (mismo estilo actual: avatar dashed `#D8CBBA` + texto `#C5503A`) y, cuando `open` es `true`, el overlay + card de 480px con header (X cierra `setOpen(false)`), banner informativo con el nombre del kid, inputs NOMBRE/EMAIL con validación on blur, toggle PARENTESCO funcional con default "Mamá", código `7K4P9` hardcodeado y "Enviar invitación" como `<a href="#">`. Clic en el backdrop cierra el modal.
2. Modificar `app/kids/[slug]/page.tsx`: reemplazar el `<a href="#">` "Vincular otro padre" (línea 143) por `<LinkParentModal kidName={`${kid.firstName} ${kid.lastName}`} />`.
3. Verificación: `npm run lint` y `npm run build`. Captura Playwright en `.playwright-mcp/link-parent-modal-verification.png`, comparada contra `vincular-padre.dc.html`.

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] En `/kids/mateo-fernandez`, "Vincular otro padre" abre el modal (overlay visible con card de 480px) y el perfil sigue intacto detrás.
- [ ] El header muestra "Vincular padre" y el subtítulo "a Mateo Fernández" (nombre dinámico del kid).
- [ ] El modal replica el mockup: banner informativo, inputs con placeholders exactos, CÓDIGO DE INVITACIÓN `7K4P9` con "Vence en 7 días" y botón "Enviar invitación".
- [ ] El selector PARENTESCO es funcional: "Mamá" activa por defecto y al hacer clic el estado activo cambia entre Mamá/Papá/Tutor/a sin persistir.
- [ ] Con NOMBRE o EMAIL vacíos, o EMAIL con formato inválido, al salir del campo se muestra el error (mensaje + borde `#D9583C` + `aria-invalid`) y se limpia al escribir.
- [ ] Con ambos campos válidos no se muestra ningún error.
- [ ] "Enviar invitación" es inerte (`href="#"`), siempre activo, y no cierra el modal ni guarda nada.
- [ ] La X y el clic en el backdrop cierran el modal.
- [ ] Estilos coinciden con el mockup (card 480px, borde `#ECE0D0`, radio 24px, fondo `#FBF4EC`, código Fredoka 34px con 7px de interletrado `#8A7234`, banner `#E3ECFB`/`#3F5694`).
- [ ] Sin errores en consola al abrir y cerrar el modal en `/kids/mateo-fernandez`.

## Decisions

- **Sí:** Modal overlay cliente en `/kids/[slug]` en vez de una ruta; mismo patrón que `add-kid-modal` de SPEC 04.
- **Sí:** "Enviar invitación" inerte (`href="#"`) y siempre activo; la validación solo informa en los campos (on blur) y no bloquea el envío. Decisión del usuario.
- **Sí:** Toggle PARENTESCO funcional con selección cliente (default "Mamá"), sin persistir; coherente con el dropdown SALA de SPEC 04.
- **Sí:** Validación on blur de NOMBRE (obligatorio no vacío) y EMAIL (obligatorio + formato), reutilizando el patrón de error del campo fecha de SPEC 04.
- **Sí:** Nombre del niño pasado como prop y usado también en el banner ("Solo verá el feed de Mateo").
- **Sí:** Código de invitación hardcodeado `7K4P9` con "Vence en 7 días".
- **No:** Envío real, generación de código, persistencia, validación del parentesco, ni enlace/abrir en los otros 7 perfiles.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| No existe screenshot de referencia del modal | Verificar contra `vincular-padre.dc.html` directamente (valores y estilos) |
| El mockup usa estilos inline | Reproducir con Tailwind v4 usando los mismos hex/radios/tipografías |
