---
"@papra/app": patch
---

Properly sanitize user name before including it in the email content to prevent potential XSS or html injection attacks.
