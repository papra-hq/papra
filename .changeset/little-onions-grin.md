---
"@papra/app": patch
---

Added SSRF protection for webhook URLs. Webhook URLs are now validated to ensure they do not point to private or reserved IP addresses, preventing potential server-side request forgery attacks. 

Two new configuration options are available:

- `WEBHOOK_SSRF_PROTECTION_ENABLED` Set to `false` to fully disable SSRF protection. This is not recommended, prefer using the allowlist below instead.
- `WEBHOOK_URL_ALLOWED_HOSTNAMES` A comma-separated list of hostnames (IP addresses or domain names) that are explicitly trusted and exempt from SSRF checks (e.g. internal services you control).
