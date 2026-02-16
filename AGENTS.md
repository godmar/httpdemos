# Repository Guidelines

## Project Structure & Module Organization
This is a Fastify + TypeScript HTTP demo application.

- `src/app.ts`: Fastify entry plugin; autoloads `src/plugins` and `src/routes`.
- `src/routes/root.ts`: home route.
- `src/routes/stations/*/index.ts`: station page routes (`/stations/...`).
- `src/routes/api/*/index.ts`: API behavior routes (`/api/...`).
- `src/plugins/*.ts`: shared Fastify plugins (cookies, formbody, static files, sensible).
- `src/public/`: static assets served at `/public/*` (HTML, JS, CSS).
- `src/lib/`: shared helpers/state (JWT helpers, in-memory stores).
- `test/routes/*.test.ts`: integration tests using Fastify inject.

Prefer adding new demos as a station + matching API module, not by growing one large route file.

## Build, Test, and Development Commands
- `npm run build:ts`: compile TypeScript to `dist/`.
- `npm test`: compile app + tests, run Node test suite with coverage (`c8`).
- `npm run dev`: watch TypeScript and run Fastify with reload.
- `npm start`: build and run production-style server on default host.
- `npm run start:lan`: build and run on `0.0.0.0` for LAN access.

## Coding Style & Naming Conventions
- Language: TypeScript, 2-space indentation, concise semicolon-free style (match existing files).
- Route/plugin modules export a single default `FastifyPluginAsync`.
- Use `kebab-case` directories for stations and API topics (e.g., `session-auth`, `fetch-json`).
- Keep UI minimal; use static assets in `src/public` instead of inline HTML/CSS/JS where practical.
- When committing, add a Co-Authored by line and state your model number

## Testing Guidelines
- Framework: Node’s built-in `node:test` + `assert`.
- Test behavior via `app.inject(...)`; assert status, headers, and payload.
- Name tests by observable behavior (e.g., `"cors preflight and allowed origin behavior"`).
- Add/adjust tests for every route or protocol behavior change.

## Commit & Pull Request Guidelines
- Follow existing commit style: imperative, concise summary (e.g., `Refactor ...`, `Clarify ...`, `Enhance ...`).
- Keep commits focused by concern (routing, assets, tests, docs).
- PRs should include:
  - what changed and why,
  - affected routes/pages,
  - test evidence (`npm test` output),
  - screenshots for UI/station-page changes where useful.

## Security & Configuration Tips
- JWT and auth demos are educational; do not treat defaults as production-hardening.
- Prefer env vars for secrets (`DEMO_JWT_ACCESS_SECRET`, `DEMO_JWT_REFRESH_SECRET`) in real deployments.
- In-memory stores reset on restart by design.
