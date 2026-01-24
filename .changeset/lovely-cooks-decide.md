---
"@papra/app": patch
---

Fix tag automatic search link issue when tags have spaces, before `tag:my tag` would not work, now generate `tag:"my tag"` to fix it.
