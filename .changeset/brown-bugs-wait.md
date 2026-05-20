---
"@papra/app": patch
---

Fixed an authorization issue where tag updates and deletions were not scoped to the organization in the URL. Tag mutation endpoints are now correctly scoped to the requested organization.

Addressing [GHSA-wrx4-3vff-jm94](https://github.com/papra-hq/papra/security/advisories/GHSA-wrx4-3vff-jm94), credit to [@TinkAnet](https://github.com/TinkAnet) for the responsible disclosure.
