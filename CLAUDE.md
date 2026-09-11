# Papra receipts fork: working notes for Claude

Fork of papra-hq/papra, extended into a receipt and document capture app (mobile scan, AI extraction).

## Session workflow
1. Clone `YasamNik/papra_docs`, check out the active feature branch (see WORKLOG.md).
2. `pnpm install --ignore-scripts`, then `pnpm --filter "./packages/*" run build`.
3. Work, commit small, push after each milestone. Never push to `main`; merge via PR.
4. Before ending: append a WORKLOG.md entry and push.

## Environment
- Node 26 required (`Temporal` global). On older Node, run tests with a Temporal polyfill:
  `NODE_OPTIONS="--import <polyfill-setup>" npx vitest run`
- Server: `apps/papra-server` (Hono, Drizzle, SQLite/libsql, valibot). Typecheck: `npx tsc --noEmit -p .`
- Mobile: `apps/mobile` (Expo, document scanner plugin, share intent).
- Lint/format: `npx oxlint -c oxlint.config.ts <paths>`, `npx oxfmt <paths>`.

## Conventions
- New features live in their own module under `apps/papra-server/src/modules/<name>` so upstream rebases stay easy.
- Pure logic in `*.models.ts` with unit tests; orchestration in `*.usecases.ts`; background jobs in `tasks/`.
- Env config per module in `*.config.ts`, wired into `modules/config/config.ts`.
- No em dashes in docs or code comments.

## License
AGPL-3.0. Modified versions served over a network must publish source.
