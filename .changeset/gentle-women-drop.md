---
"@papra/app": patch
---

Removed currently unused `expiresAt` placeholder fields in the internal API key creation endpoint to avoid confusions, as non-ui (so non-standard) creation of API keys can set an expiration date, which is not currently enforced by the system.

Addressing [GHSA-866c-mc22-wvv5](https://github.com/papra-hq/papra/security/advisories/GHSA-866c-mc22-wvv5), credit to [@Toothless5143](https://github.com/Toothless5143) for the responsible disclosure.