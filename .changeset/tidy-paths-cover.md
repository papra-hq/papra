---
'@papra/app': patch
---

Security fix: document share links belonging to a soft-deleted organization were still publicly accessible. Public access (document metadata, file download, and password verification) now stops with a 410 Gone as soon as the organization is deleted, and resumes automatically if the organization is restored during the grace period.

Thank you to [Thammachart Sittharod](https://github.com/penthammachat-creator) for the responsible disclosure of this issue.
