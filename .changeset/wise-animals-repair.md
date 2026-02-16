---
"@papra/app": patch
---

Security fix: prevented unauthorized listing to organization tags and webhooks. An authenticated user could list the tags and webhooks of an organization they are not a member of by sending requests to the corresponding endpoints by knowing the organization ID. Credit to [Sergio Cabrera](https://www.linkedin.com/in/sergio-cabrera-878766239), security researcher, for responsibly disclosing this vulnerability.