---
'@papra/app': patch
---

Security fix: Prevent custom OAuth providers from creating new accounts when registration is disabled, while allowing existing users to sign in.

Thanks to [白墨](https://github.com/5255fgh) for the responsible disclosure of this issue.
