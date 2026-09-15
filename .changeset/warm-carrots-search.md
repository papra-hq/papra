---
'@papra/app': minor
---

Added an API endpoint to reprocess existing documents `POST /api/organizations/:organizationId/documents/:documentId/reprocess`. This endpoint allows re-running content extraction + auto tagging and tagging rules on existing documents.
