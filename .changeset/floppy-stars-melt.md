---
'@papra/app': patch
---

Fix the coercion of `AUTO_TAGGING_DEFAULT_MAX_TAGS` that caused a validation error when the value is a string instead of a number. Now correctly converts the string to a number, preventing the validation error.
