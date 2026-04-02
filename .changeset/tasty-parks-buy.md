---
"@papra/app": patch
---

Api now returns a 409 status code instead of a 400 when either creating a tag that already exists or adding a tag to a document that already has it.
