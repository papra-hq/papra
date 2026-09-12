---
'@papra/app': minor
---

Added AI-powered document auto-naming: when enabled in the organization settings, newly ingested documents with non-descriptive names, such as scanner output, can receive concise AI-generated titles based on their content while meaningful names are preserved or lightly refined. Configurable with the `AUTO_NAMING_ENABLED`, `AUTO_NAMING_MODEL`, `AUTO_NAMING_MAX_CONTENT_LENGTH`, and `AUTO_NAMING_MAX_TITLE_LENGTH` environment variables.
