---
'@papra/app': minor
---

Added AI-powered document auto-naming: when enabled in the organization settings, newly ingested documents receive a concise AI-generated title based on their content, which is especially useful for generic names such as scanner output. Auto-naming shares the auto-tagging LLM request, so the document content is only sent once. Configurable with the `AUTO_NAMING_ENABLED` and `AUTO_NAMING_MAX_TITLE_LENGTH` environment variables.
