---
"@papra/docker": patch
---

Removed the possibility to filter by tag in the `/api/organizations/:organizationId/documents` route, use the `/api/organizations/:organizationId/documents/search` route instead.

```bash
# Before:
GET /api/organizations/:organizationId/documents?tags=yourTagId

# After:
GET /api/organizations/:organizationId/documents/search?query=tag:yourTagNameOrId
```
