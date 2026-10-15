---
'@papra/app': patch
---

API breaking change: PUT /api/users/me now returns only id, email, name, createdAt, updatedAt, and twoFactorEnabled instead of the full user object.
