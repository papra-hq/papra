---
"@papra/docker": patch
---

Properly tree-shake all demo assets to reduce the size of production non-demo build. Reducing the bundle assets by ~70kB (~55kB on main chunk + removed demo chunk of ~15kB).
