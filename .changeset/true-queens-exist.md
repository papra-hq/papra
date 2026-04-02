---
"@papra/app": patch
---

Properly sanitize user name before including it in the email content to prevent potential XSS or html injection attacks.

Addressing [GHSA-6f8x-2rc9-vgh4](https://github.com/papra-hq/papra/security/advisories/GHSA-6f8x-2rc9-vgh4), credit to [@Toothless5143](https://github.com/Toothless5143) for the responsible disclosure.