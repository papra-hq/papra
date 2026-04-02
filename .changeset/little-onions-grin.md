---
"@papra/app": minor
---

**Breaking change regarding webhook URLs**

Added SSRF protection for webhook URLs. Webhook URLs are now validated to ensure they do not point to private or reserved IP addresses, preventing potential server-side request forgery attacks.
So webhooks pointing to private IPs (e.g. `http://192.168.0.1/some/stuff`), or with domains resolving to private IPs (e.g. `http://myservice.local/some/stuff`) will be blocked unless explicitly allowed.

Two new configuration options are available:

- `WEBHOOK_SSRF_PROTECTION_ENABLED` Set to `false` to fully disable SSRF protection. This is not recommended, prefer using the allowlist below instead.
- `WEBHOOK_URL_ALLOWED_HOSTNAMES` A comma-separated list of hostnames (IP addresses or domain names) that are explicitly trusted and exempt from SSRF checks (e.g. internal services you control).

Addressing [GHSA-cjw7-qg95-58mq](https://github.com/papra-hq/papra/security/advisories/GHSA-cjw7-qg95-58mq), credit to [@Toothless5143](https://github.com/Toothless5143) for the responsible disclosure.