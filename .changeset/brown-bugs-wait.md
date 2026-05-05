---
"@papra/app": patch
---

Fixed an authorization issue where tag updates and deletions were not scoped to the organization in the URL. Tag mutation endpoints are now correctly scoped to the requested organization.
