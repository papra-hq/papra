# @papra/changelog

Internal tooling for managing changelog entries and versioning using calendar-based versioning (calver).

## Overview

This package provides CLI tools and utilities to manage changelog entries for Papra's continuous deployment workflow. It replaces the traditional changesets workflow with a calver-based approach that better suits a web application with continuous deployment.

## Versioning Format

Papra uses **calendar versioning** with the format `YY.MM.N`:

- `YY` - Last two digits of the year (e.g., `25` for 2025)
- `MM` - Zero-padded month (e.g., `04` for April)
- `N` - Sequential release number for that month, starting at `1`

**Examples:**
- `25.04.1` - First release in April 2025
- `25.04.2` - Second release in April 2025
- `25.05.1` - First release in May 2025

This format:
- Looks like semantic versioning (two dots)
- Clearly indicates when the release was made
- Supports multiple releases per month
- Resets the sequence counter each month
- Is sortable and human-readable

## Workflow

### During Development (PR Phase)

When working on a feature or fix that should appear in the changelog:

1. Run `pnpm changelog add` to create a new changelog entry
2. Answer the interactive prompts about your change
3. Entry is saved to `apps/docs/src/content/changelog/.pending/`
4. Commit the pending entry with your PR

**Multiple entries per PR:** A single PR can contain multiple changelog entries if it impacts multiple user-facing features or fixes.

### During Release (CD Pipeline)

When code is merged to `main` and passes CI:

1. CD pipeline runs `pnpm changelog release`
2. The tool determines the next version number (`YY.MM.N`)
3. All pending entries are moved to a versioned folder
4. Git tag is created with the version
5. Docker images are built and published with the version tag

## CLI Commands

### `pnpm changelog add`

Interactively create a new changelog entry.

**Prompts:**
- **Type** - `feature` | `fix` | `improvement` | `breaking`
- **Title** - Short, user-facing description (e.g., "Add calendar versioning support")
- **Description** - Detailed markdown explanation of the change
- **Breaking change?** - Whether this change breaks existing functionality
- **PR number** (optional) - Associated pull request number

**Output:**
Creates a markdown file in `apps/docs/src/content/changelog/.pending/` with a unique filename (e.g., `537-add-calver.md`).

**Example entry:**
```markdown
---
type: feature
title: Add calendar versioning support
breaking: false
pr: 537
---

Papra now uses calendar versioning (YY.MM.N) instead of semantic versioning. This provides better clarity about when releases were made and supports continuous deployment.

Each version indicates the year, month, and sequential release number for that month.
```

### `pnpm changelog release`

Process all pending changelog entries and determine the next version number.

**What it does:**
1. Reads all files from `.pending/` folder
2. Looks at existing git tags to find the latest version for current month
3. Determines next version (`YY.MM.N` where N increments)
4. Creates a folder for the new version: `apps/docs/src/content/changelog/{version}/`
5. Moves all pending entries to the versioned folder
6. Adds version and date to each entry's frontmatter
7. Outputs the new version number for use by CD pipeline

**Example:**
```bash
$ pnpm changelog release
📦 Found 3 pending changelog entries
🔍 Latest version for 2025-04: 25.04.1
🚀 Next version: 25.04.2
✅ Moved 3 entries to changelog/25.04.2/
📌 Version: 25.04.2
```

**Usage in CD:**
```bash
VERSION=$(pnpm changelog release --output version)
git tag $VERSION
docker build -t papra:$VERSION .
```

### `pnpm changelog validate`

Validates all pending changelog entries for correct schema and formatting.

Useful in CI to ensure PR contributors have properly formatted their changelog entries.

## File Structure

```
apps/docs/src/content/changelog/
├── .pending/                    # Pending entries (pre-release)
│   ├── 537-add-calver.md
│   ├── 538-fix-docker-build.md
│   └── 539-improve-ui.md
├── 25.04.2/                     # Released version
│   ├── add-calver.md
│   ├── fix-docker-build.md
│   └── improve-ui.md
├── 25.04.1/
│   ├── usage-page.md
│   └── org-invites.md
└── 25.03.1/
    └── subscription-management.md
```

## Changelog Entry Schema

Each changelog entry (both pending and released) follows this schema:

```typescript
{
  type: 'feature' | 'fix' | 'improvement' | 'breaking'
  title: string                // Short, user-facing title
  breaking: boolean            // Is this a breaking change?
  pr?: number                  // Associated PR number
  version?: string             // Added during release (e.g., "25.04.2")
  date?: string                // Added during release (ISO format)
}
```

**Frontmatter example:**
```yaml
---
type: feature
title: Add calendar versioning support
breaking: false
pr: 537
version: 25.04.2
date: 2025-04-07
---
```

## Integration with Astro

The changelog entries are consumed by the Astro documentation site:

```typescript
// apps/docs/src/content/config.ts
import { defineCollection, z } from 'astro:content';

const changelog = defineCollection({
  schema: z.object({
    type: z.enum(['feature', 'fix', 'improvement', 'breaking']),
    title: z.string(),
    breaking: z.boolean(),
    pr: z.number().optional(),
    version: z.string().optional(),
    date: z.string().optional(),
  }),
});

export const collections = { changelog };
```

The changelog page can then query and display entries:

```astro
---
import { getCollection } from 'astro:content';

const entries = await getCollection('changelog');
const byVersion = entries.reduce((acc, entry) => {
  const version = entry.data.version || 'pending';
  if (!acc[version]) acc[version] = [];
  acc[version].push(entry);
  return acc;
}, {});
---

<div class="changelog">
  {Object.entries(byVersion).map(([version, entries]) => (
    <section class="version">
      <h2>{version}</h2>
      {entries.map(entry => (
        <article class={entry.data.breaking ? 'breaking' : ''}>
          <h3>{entry.data.title}</h3>
          <div>{entry.body}</div>
        </article>
      ))}
    </section>
  ))}
</div>
```

## CD Pipeline Integration

Example GitHub Actions workflow:

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build:packages

      - name: Run tests
        run: pnpm test

      - name: Process changelog and release
        run: |
          VERSION=$(pnpm changelog release --output version)
          echo "VERSION=$VERSION" >> $GITHUB_ENV

      - name: Create git tag
        run: |
          git tag ${{ env.VERSION }}
          git push origin ${{ env.VERSION }}

      - name: Build and push Docker image
        run: |
          docker build -t papra/papra:${{ env.VERSION }} .
          docker tag papra/papra:${{ env.VERSION }} papra/papra:latest
          docker push papra/papra:${{ env.VERSION }}
          docker push papra/papra:latest
```

## Development

### Setup

```bash
cd packages/changelog
pnpm install
pnpm build
```

### Testing

```bash
pnpm test
pnpm test:watch
```

### Local development

```bash
pnpm dev  # Watch mode
```

## Migration from Changesets

When migrating from changesets to this system:

1. Process any pending changesets: `pnpm changeset version`
2. Create a final semver release and tag
3. Remove `.changeset/` folder and configuration
4. Install this package
5. Update CI/CD pipeline to use `pnpm changelog release`
6. Create a migration guide changelog entry explaining the new versioning scheme to users

## Breaking Changes and Self-Hosters

Since Papra supports self-hosting and users may have custom integrations:

- **Always mark breaking changes** with `breaking: true`
- **Provide migration guides** in the changelog entry body
- **Consider creating a dedicated migration guide** for complex breaking changes
- **Link to migration documentation** from the changelog entry

**Example breaking change entry:**

```markdown
---
type: breaking
title: Change API authentication to use Bearer tokens
breaking: true
pr: 540
---

⚠️ **Breaking Change**

API authentication has been updated to use Bearer tokens instead of API key headers.

**Migration steps:**

1. Update your API client to send `Authorization: Bearer YOUR_API_KEY` header
2. Remove the legacy `X-API-Key` header from your requests
3. Test your integration before deploying

See the [API Authentication Migration Guide](/docs/migrations/bearer-tokens) for detailed examples.
```

## Why Not Semver?

Semantic versioning (major.minor.patch) is designed for libraries and packages where:
- Consumers need to know about breaking changes (major)
- New features are additive (minor)
- Bug fixes are backwards compatible (patch)

For Papra:
- The SaaS version is always on the latest release (users can't choose versions)
- Self-hosters typically want the latest stable version
- Calendar versioning makes it clear when the release was made
- Breaking changes are communicated through changelog entries, not version numbers
- A "0.x" version doesn't make sense for a stable, production-ready application

Calendar versioning provides better clarity and aligns with continuous deployment practices.
