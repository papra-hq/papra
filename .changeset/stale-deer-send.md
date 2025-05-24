---
"@papra/app-server": minor
---

Reworked the email sending system to be more flexible and allow for different drivers to be used.
`EMAILS_DRY_RUN` has been removed and you can now use `EMAILS_DRIVER=logger` config option to log emails instead of sending them.
