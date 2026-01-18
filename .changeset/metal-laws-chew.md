---
"@papra/docker": patch
---
API Breaking Change:
Document search endpoint now returns complete documents along with total count matching the search query, and no longer nests results under `searchResults`.

Before:
```ts
// GET /api/organizations/:organizationId/documents/search?searchQuery=foobar
{
  searchResults: {
    documents: [
      { id: 'doc_1', name: 'Document 1.pdf' },
      { id: 'doc_2', name: 'Document 2.pdf' },
    ],
  },
}
```

After:
```ts
// GET /api/organizations/:organizationId/documents/search?searchQuery=foobar
{
  documents: [
    { id: 'doc_1', name: 'Document 1.pdf', mimeType: 'application/pdf' /* ...otherProps */ },
    { id: 'doc_2', name: 'Document 2.pdf', mimeType: 'application/pdf' /* ...otherProps */ },
  ],
  totalCount: 42,
}
```
