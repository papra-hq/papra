---
'@papra/app': minor
---

API breaking change: The route to trash a document `DELETE /api/organizations/:organizationId/documents/:documentId` now returns a 204 No Content status code instead of `{ success: true }` JSON body.
