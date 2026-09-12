# Documentation structure

Organize documentation by **what the reader wants to do**, not by document format.

## Main navigation

- **Overview**: introduce Papra and route readers to the right category. A regular category, initially containing only Introduction (`/docs`); future introductory pages can cover choosing cloud or self-hosting and first steps.
- **User guide**: use Papra, whether cloud or self-hosted. Document workflows, search, tags, organization membership, and feature usage.
- **Self-hosting**: install, configure, administer, and maintain an instance. Includes deployment methods, OAuth, storage, encryption, ingestion setup, OCR/LLM providers, backups, upgrades, and troubleshooting.
- **Developers**: automate and integrate with Papra. Includes API, SDK, webhooks, CLI reference, recipes, and initially contributor documentation.
- **Concepts**: understand behavior and design choices. Includes original document preservation, deduplication, processing, and deletion/purge lifecycles. Explanations should be useful beyond the contributor audience.

## Placement rules

- Keep tutorials, how-to guides, reference, and explanations distinct where useful, but do not make these document types the top-level navigation.
- Keep reference material near its audience: environment variables under Self-hosting, API endpoints under Developers, search syntax under User guide.
- Give each page one canonical home. Cross-link related pages instead of duplicating them.
- Separate using a feature from enabling it on the server. For example, organization auto-tagging belongs in User guide; configuring its LLM provider belongs in Self-hosting.
- Separate organization permissions (User guide) from platform administration (Self-hosting).
- Avoid catch-all categories such as “Guides” and “Resources”. Changelog, community, support, and security can be secondary links.
- Add sidebar sections when there is content for them. Do not publish empty sections or links to unwritten pages. Contributing can become a category if it grows enough to need its own navigation.

## Implementation and migration

`docs.navigations.ts` defines category membership and sidebar order. Membership, not the document's directory, determines its active category and pagination.

Content lives in `content/<locale>/`; English is the required source. The landing document is `content/<locale>/index.mdx`, with logical ID `index`. It uses the same renderer, navigation, translation fallback, and editing actions as other documents. URL helpers and static paths map it to `/<locale>/docs`, never `/docs/index`; its Markdown export is `/<locale>/docs.md`. Landing cards use the reusable `DocLinkCard.astro` component inside MDX.

Keep existing documents and URLs in place until migration is explicitly undertaken. The initial category introductions establish the structure without migrating `apps/docs`.

The API authentication page remains at `api-reference/authentication` but is listed under Developers. A category rename does not require a URL change.
