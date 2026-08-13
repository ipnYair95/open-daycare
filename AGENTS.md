<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright: Screenshots y cualquier cosa relacionada con Playwright tienen que estar en la carpeta `.playwright-mcp`
- Context7: Usaremos este MCP para traer la documentación actualizada del framework

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 (`@tailwindcss/postcss`)
- Scripts: `npm run dev` | `npm run build` | `npm run lint` (eslint). No hay test framework ni script de typecheck; `next build` valida los tipos.

## Estado del proyecto

- Home feed implementado (`app/`, `app/components/`, `app/data/`) replicando `references/pantallas/feed.dc.html`. Spec `specs/01-home-feed.md` marcado como **Implemented**.
- `references/pantallas/*.dc.html` son la **fuente de verdad del diseño** (UI de la guardería, en español). `support.js` es **generado** (dc-runtime) — no editarlo.
- `references/screenshots/*.png` son capturas de referencia de las pantallas (feed, ninos, compose, post-detail, parent-feed).
- Todo el contenido de UI está en **español**. El código e identificadores van en inglés.

## Convenciones

- Para features grandes: usar el flujo `/spec` → `/spec-impl` (skills en `.agents/skills/`). Los specs viven en `specs/`.
- Verificación visual y de criterios de aceptación: agente `spec-verifier` (`.opencode/agent/spec-verifier.md`) usando Playwright MCP con visión y Context7.
- Path alias `@/*` → raíz del repo (ej. `@/app/...`).
- `.env*` está en `.gitignore`.

# Spec Driven Development

- /spec Usaremos esta habilidad para crear especificaciones.
- /spec-impl Usaremos esta skill para crear las implementaciones

## Reglas de código

- Usar código limpio y todo en ingles.