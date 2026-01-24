import type { APIRoute } from 'astro';
import { createRedirectionToLocalizedPage } from '../i18n/i18n.routes';

export const prerender = false;

export const GET: APIRoute = createRedirectionToLocalizedPage(({ locale }) => `/${locale}/contact`);
