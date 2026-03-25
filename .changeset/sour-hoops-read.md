---
"@papra/app": patch
---

Added support for searching by custom properties. For example, given a custom property `status` of type `select` with options `todo`, `in progress` and `done`, you could search for `status:todo` to find all documents with the status set to todo, or `has:status` to find all documents with a status set (and `-has:status` for documents without a status).
