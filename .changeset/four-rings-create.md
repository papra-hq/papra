---
'@papra/app': patch
---

Fixed an issue where setting `AUTH_IS_REGISTRATION_ENABLED=false` hid the sign-up interface but did not block email and password registrations made directly through the authentication API.
