---
"@papra/app": patch
---

Replaced `date-fns` functions with in-house implementations to avoid pulling the 30MB lib (mainly due to locale data).
