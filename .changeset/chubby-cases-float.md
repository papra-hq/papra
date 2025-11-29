---
"@papra/docker": minor
---

Api breaking change: the document search endpoint return format changed, impacting any custom clients consuming it.

Before 

```ts
// Get /api/organizations/:organizationId/documents/search
{
  documents: { 
    id: string;
    name: string;
    mimeType: string;
    // ... other document fields
  }[] 
}
```

After

```ts
// Get /api/organizations/:organizationId/documents/search
{
  searchResults: {
    documents: { id: string; name: string }[] 
  }
}
```

