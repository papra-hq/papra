---
"@papra/app": patch
---

Properly return a "document already has tag" error when trying to add a tag to a document that already has it, instead of a generic 500 error when using an hosted Turso db.
