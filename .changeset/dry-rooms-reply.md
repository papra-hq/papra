---
"@papra/app": patch
---

Significantly reduced the size of the rootless docker image by preventing file duplications due to `chown` operations, gaining ~230MB, more than 30% reduction in size.
