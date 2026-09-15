---
'@papra/app': patch
---

Removed the default value for the intake email webhook validation secret to prevent ingestion of documents from untrusted sources when no secret is provided. Users must now explicitly set a secret using `INTAKE_EMAILS_WEBHOOK_SECRET`.

Thanks to [白墨](https://github.com/5255fgh) for the responsible disclosure of this issue.
