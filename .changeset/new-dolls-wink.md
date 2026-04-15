---
"@papra/app": patch
---

Added some size limits on the webhooks creation and update API endpoints parameters.

- Names are limited to 128 characters.
- Secret keys are limited to 256 characters.
- URLs are limited to 2048 characters.
