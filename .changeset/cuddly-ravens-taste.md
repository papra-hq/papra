---
"@papra/app": patch
---

Webhooks no longer follow http redirects (3xx responses) when sending requests.

Addressing [GHSA-5g86-85rp-f9hx](https://github.com/papra-hq/papra/security/advisories/GHSA-5g86-85rp-f9hx), credit to [@FredrikEV](https://github.com/FredrikEV) for the responsible disclosure.
