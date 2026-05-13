---
"@papra/app": patch
---

Added `sortField` and `sortOrder` query parameters to the document list/search endpoint (`GET /api/organizations/:organizationId/documents`), allowing documents to be sorted by `createdAt`, `updatedAt`, `name`, or `documentDate` in ascending or descending order.
