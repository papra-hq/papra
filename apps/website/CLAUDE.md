# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Papra website is a multilingual static website built with Astro, deployed on Cloudflare. It serves as the marketing site for Papra, a document management and archiving platform.

**Tech Stack:**
- **Framework:** Astro (static site generation)
- **Styling:** UnoCSS (atomic CSS with custom theme system, compatible with Tailwind CSS)
- **Deployment:** Cloudflare (using @astrojs/cloudflare adapter)
- **Package Manager:** pnpm (version 9.11.0)
- **Content:** MDX for blog posts and markdown pages
- **Testing:** Vitest

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (default port 4321)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm check

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Architecture & Key Concepts

### Internationalization (i18n)

The site supports multiple locales (currently `en` and `fr`) with a custom i18n system:

- **Locale Constants:** Defined in `src/i18n/i18n.constants.ts` (`LOCALES`, `DEFAULT_LOCALE`)
- **Translation Files:** `src/locales/{locale}.ts` - translations are strongly typed
- **i18n Utilities:** `src/i18n/i18n.ts` provides:
  - `getLocaleFromUrl(url)` - extracts locale from URL path
  - `useI18n({ locale })` - returns `{ t, locale }` for translations with @branchlet/core template interpolation
  - `getPathWithoutLocale(url)` - strips locale prefix from paths
  - `buildLocalizedPath({ locale, path })` - builds localized URLs

**Routing:**
- All pages are prefixed with locale: `/{locale}/path`
- Default locale (`en`) is also prefixed (not at root)
- Locale-specific pages live in `src/pages/[locale]/`
- Top-level pages (`src/pages/`) are for non-localized content (RSS, robots.txt, etc.)

### Configuration

**App Config** (`src/app.config.ts`):
- Site metadata, social links (Discord, sponsor)
- Launch discount configuration with date-based expiry
- Get started link to dashboard

**Astro Config** (`astro.config.ts`):
- Cloudflare adapter for static deployment
- Custom `createRedirectsFile` plugin generates `_redirects` file for Cloudflare
- UnoCSS, sitemap, MDX, and expressive-code integrations
- i18n routing configuration

### Styling System

**UnoCSS Configuration** (`uno.config.ts`):
- Custom theme using CSS variables (`hsl(var(--primary))` pattern)
- Theme switching via `[data-kb-theme="dark"]` and `[data-kb-theme="light"]` attributes
- Custom animations (accordion, collapsible, caret-blink, slideRight, slideDown)
- Typography preset, icon preset, web fonts (Inter via Bunny provider)
- Safelist for dynamic grid columns and specific icons

**Global Styles:** `src/styles/` directory

### Content Collections

**Blog Collection** (`src/content/config.ts`):
- Schema: `title`, `description`, `publishedAt`, optional `homepageCallout`, `lang`, `ogImage`, `coverImage`
- Posts live in `src/content/blog/`
- Currently only supports `lang: 'en'`

### Custom Plugins

**Redirects Plugin** (`src/plugins/redirects.ts`):
- Generates Cloudflare `_redirects` file at build time
- Used for short URLs like `/discord`, `/support`
- Accepts `redirects` object in astro.config.ts

### Utility Functions

**URL Utilities** (`src/utils/urls.ts`):
- Helper functions for URL manipulation
- Tested in `urls.test.ts`

**Class Name Utilities** (`src/utils/cn.ts`):
- `cn()` function using `clsx` and `tailwind-merge` for conditional class names

## Linting & Code Style

**ESLint Config** (`eslint.config.js`):
- Uses `@antfu/eslint-config` with Astro support
- Semicolons required
- Enforces curly braces for all control statements (`curly: 'all'`)
- Uses `test` (not `it`) for Vitest tests
- Type definitions prefer `type` over `interface`
- 1TBS brace style, no single-line blocks
- Ignores inline scripts in `PosthogAnalytics.astro` and `ContactForm.astro`

## Important Notes

- **Always use `pnpm`** - package manager is locked to pnpm@9.11.0
- **Translation updates:** When adding new UI text, update all locale files in `src/locales/`
- **Type safety:** Translations are strongly typed via `TranslationsDictionary`
- **Deployment:** Site is deployed to Cloudflare, builds are static
- **Redirects:** Use the astro.config.ts redirects object, not manual _redirects file
