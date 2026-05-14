---
"@papra/app": patch
---

Webhooks ssrf validation is now enforced when sending webhook requests, preventing potential TOCTOU dns rebinding attacks (the exploitation window was very small and only theoretical though).
