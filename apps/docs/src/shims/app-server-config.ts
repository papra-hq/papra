import type { ConfigDefinition } from 'figue';

/**
 * Type-check stand-in for `@papra/app-server/config`.
 *
 * Astro/Vite resolves the real package export at build time. Mapping this shim
 * in `tsconfig.json` keeps `tsc --noEmit` from pulling the server module graph
 * into the docs project (see #87).
 */
export const configDefinition = {} as ConfigDefinition;
