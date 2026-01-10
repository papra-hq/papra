# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Papra is a minimalistic document management and archiving platform built as a monorepo using PNPM workspaces. The project includes a SolidJS frontend, HonoJS backend, CLI tools, and supporting packages.
It's open-source and designed for easy self-hosting using Docker, and also offers a cloud-hosted SaaS version.

## Architecture

### Monorepo Structure

- **apps/papra-server**: Backend API server (HonoJS + Drizzle ORM + Better Auth)
- **apps/papra-client**: Frontend application (SolidJS + UnoCSS + Shadcn Solid)
- **apps/docs**: Documentation site (Astro + Starlight)
- **packages/lecture**: Text extraction library for documents
- **packages/api-sdk**: API client SDK
- **packages/cli**: Command-line interface
- **packages/webhooks**: Webhook types and utilities

### Backend Architecture (apps/papra-server)

The backend follows a modular architecture with feature-based modules:

- **Module pattern**: Each feature lives in `src/modules/<feature>/` with:
  - `*.repository.ts`: Database access layer (Drizzle ORM queries)
  - `*.usecases.ts`: Business logic and orchestration
  - `*.routes.ts`: HTTP route handlers (Hono)
  - `*.services.ts`: Service layer for external integrations
  - `*.table.ts`: Drizzle schema definitions
  - `*.types.ts`: TypeScript type definitions
  - `*.errors.ts`: Error definitions

- **Core modules**: `app`, `shared`, `config`, `tasks`
- **Feature modules**: `documents`, `organizations`, `users`, `tags`, `tagging-rules`, `intake-emails`, `ingestion-folders`, `webhooks`, `api-keys`, `subscriptions`, etc.

- **Database**: Uses Drizzle ORM with SQLite/Turso (libsql). Schema is in `*.table.ts` files, migrations in `src/migrations/`

- **Authentication**: Better Auth library for user auth

- **Task system**: Background job processing using Cadence MQ, a custom made queue system (papra-hq/cadence-mq)

- **Document storage**: Abstracted storage supporting local filesystem, S3, and Azure Blob

### Frontend Architecture (apps/papra-client)

- **SolidJS** for reactivity with router (`@solidjs/router`)
- **Module pattern**: Features in `src/modules/<feature>/` with:
  - `components/`: UI components
  - `pages/`: Route components
  - `*.services.ts`: API client calls
  - `*.provider.tsx`: Context providers
  - `*.types.ts`: Type definitions

- **Routing**: Defined in `src/routes.tsx`
- **Styling**: UnoCSS for atomic CSS with Shadcn Solid components
- **State**: TanStack Query for server state, local storage for client state
- **i18n**: TypeScript-based translations in `src/locales/*.dictionary.ts`

### Dependency Injection Pattern

The server uses a dependency injection pattern with `@corentinth/chisels/injectArguments` to create testable services that accept dependencies as parameters.

## Development Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Build all packages (required before running apps)
pnpm build:packages
```

### Backend Development

```bash
cd apps/papra-server

# Run database migrations
pnpm migrate:up

# Start development server (localhost:1221)
pnpm dev

# Run tests
pnpm test              # All tests
pnpm test:watch        # Watch mode
pnpm test:unit         # Unit tests only
pnpm test:int          # Integration tests only

# Lint and typecheck
pnpm lint
pnpm typecheck

# Database management
pnpm db:studio         # Open Drizzle Studio
pnpm migrate:create "migration_name"  # Create new migration
```

### Frontend Development

```bash
cd apps/papra-client

# Start development server (localhost:3000)
pnpm dev

# Run tests
pnpm test
pnpm test:watch

# Lint and typecheck
pnpm lint
pnpm typecheck

# i18n key synchronization
pnpm script:sync-i18n-key-order
```

### Package Development

```bash
cd packages/<package-name>

# Build package
pnpm build
pnpm build:watch       # Watch mode (or pnpm dev)

# Run tests
pnpm test
pnpm test:watch
```

### Root-level Commands

```bash
# Run tests across all packages
pnpm test
pnpm test:watch

# Build all packages
pnpm build:packages

# Version management (changesets)
pnpm changeset         # Create changeset
pnpm version           # Apply changesets and bump versions

# Docker builds
pnpm docker:build:root
pnpm docker:build:root:amd64
pnpm docker:build:root:arm64
```

### Documentation Development

```bash
cd apps/docs
pnpm dev               # localhost:4321
```

## Testing Guidelines

- Use **Vitest** for all testing
- Test files: `*.test.ts` for unit tests, `*.int.test.ts` for integration tests
- Integration tests may use Testcontainers (Azurite, LocalStack)
- All new features require test coverage

### Writing Good Test Names

Test names should explain the **why** (business logic, user scenario, or expected behavior), not the **how** (implementation details or return values).

**Key principles:**
- **Describe blocks** should explain the business goal or rule being tested
- **Test names** should explain the scenario, context, and reason for the behavior
- Avoid implementation details like "returns X", "should be Y", "calls Z method"
- Focus on user scenarios and business rules
- Make tests readable as documentation - someone unfamiliar with the code should understand what's being tested and why

## Code Style

- **ESLint config**: `@antfu/eslint-config` (auto-fix on save recommended)
- **Conventions**:
  - Use functional programming where possible
  - Prefer clarity and maintainability over performance
  - Use meaningful names for variables, functions, and components
  - Follow Conventional Commits for commit messages
- **Type safety**: Strict TypeScript throughout

## i18n

- Language files in `apps/papra-client/src/locales/*.dictionary.ts`
- Reference `en.dictionary.ts` for all keys (English is fallback)
- Fully type-safe with TypeScript
- Update `i18n.constants.ts` when adding new languages
- Use `pnpm script:sync-i18n-key-order` to sync key order
- **Branchlet/core**: Uses `@branchlet/core` for pluralization and conditional i18n string templates (variant of ICU message format)
  - Basic interpolation: `'Hello {{ name }}!'` with `{ name: 'World' }`
  - Conditionals: `'{{ count, =0:no items, =1:one item, many items }}'`
  - Pluralization with variables: `'{{ count, =0:no items, =1:{count} item, {count} items }}'`
  - Range conditions: `'{{ score, [0-50]:bad, [51-75]:good, [76-100]:excellent }}'`
  - See [branchlet documentation](https://github.com/CorentinTh/branchlet) for more details

## Contributing Flow

1. Open an issue before submitting PRs for features/bugs
2. Target the `main` branch (continuously deployed to production)
3. Keep PRs small and atomic
4. Ensure CI is green (linting, type checking, testing, building)
5. PRs are squashed on merge

## Key Technologies

- **Frontend**: SolidJS, UnoCSS, Shadcn Solid, TanStack Query, Vite
- **Backend**: HonoJS, Drizzle ORM, Better Auth, Zod, Cadence MQ
- **Database**: SQLite/Turso (libsql)
- **Testing**: Vitest, Testcontainers
- **Monorepo**: PNPM workspaces with catalog for shared dependencies
- **Build**: esbuild (backend), Vite (frontend), tsdown (packages)