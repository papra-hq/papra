import type { APIRoute } from 'astro';
import { DOCS_LOCALES } from '../../docs/docs.constants';
import { createRedirectionToLocalizedPage } from '../../i18n/i18n.routes';

export const prerender = false;

// Matches both /docs and /docs/*, keeping deep links intact during locale negotiation.
export const GET: APIRoute = ({ preferredLocaleList, url }) =>
  createRedirectionToLocalizedPage(({ locale }) => `/${locale}${url.pathname}${url.search}`, {
    locales: DOCS_LOCALES,
  })({ preferredLocaleList });
