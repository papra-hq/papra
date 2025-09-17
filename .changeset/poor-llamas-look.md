---
"@papra/app-server": patch
---

Split the intake-email username generation from the email address creation, some changes regarding the configuration when using the `random` driver.

```env
# Old configuration
INTAKE_EMAILS_DRIVER=random-username
INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN=mydomain.com

# New configuration  
INTAKE_EMAILS_DRIVER=catch-all
INTAKE_EMAILS_CATCH_ALL_DOMAIN=mydomain.com
INTAKE_EMAILS_USERNAME_DRIVER=random
```
