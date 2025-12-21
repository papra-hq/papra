---
"@papra/docker": minor
---

Document search indexing and synchronization is now asynchronous, and no longer relies on database triggers.
This significantly improves the responsiveness of the application when adding, updating, trashing, restoring, or deleting documents. It's even more noticeable when dealing with a large number of documents or on low-end hardware.
