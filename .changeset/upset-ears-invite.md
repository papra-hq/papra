---
"@papra/app": minor
---

Api breaking change: removed the `/api/organizations/:organizationId/documents/search` endpoint in favor of the existing `/api/organizations/:organizationId/documents` with an optional `searchQuery` query parameter.
The new `/api/organizations/:organizationId/documents` endpoint now behave as the old `/search` endpoint, with all documents being returned when `searchQuery` is empty. Note that the response field `totalCount` of the old `/search` endpoint has been renamed to `documentsCount` in the new endpoint.

Before:

```
GET /api/organizations/:organizationId/documents/search?searchQuery=invoice&pageIndex=1&pageSize=20
Response: {
  documents: Document[];
  totalCount: number;
}

GET /api/organizations/:organizationId/documents?pageIndex=1&pageSize=20
Response: {
  documents: Document[];
  documentsCount: number;
}
```

After:

```
GET /api/organizations/:organizationId/documents?searchQuery=invoice&pageIndex=1&pageSize=20
Response: {
  documents: Document[];
  documentsCount: number;
}
```

