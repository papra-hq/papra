---
"@papra/app": patch
---

Tag deletion endpoint now returns a `204 No Content` status code instead of `200 OK` with an empty JSON object, and a `404 Not Found` status code is returned when trying to delete a tag that does not exists for the organization.
