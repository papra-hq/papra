---
"@papra/docker": patch
---

Document search indexing and synchronization is now asynchronous, and no longer rely on database triggers.
The synchronization with the search index is now asynchronously, which significantly improves the responsiveness of the application when adding, updating, trashing, restoring, or deleting documents, it's even more noticeable when dealing with a large number of documents or low-end hardware.

