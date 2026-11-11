---
'@papra/app': minor
---

Environment variables can now be loaded from files using the `<VARIABLE>_FILE` convention (e.g. `AUTH_SECRET_FILE=/run/secrets/auth_secret`), making Docker and Kubernetes secrets usable.
