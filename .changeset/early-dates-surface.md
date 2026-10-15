---
'@papra/app': minor
---

Added AI document date extraction: when enabled in the organization settings, newly ingested documents without a document date get the date they were issued, read from their content. It shares the auto-tagging and auto-naming LLM request, never replaces an existing date, and can be disabled instance-wide with the `AUTO_DOCUMENT_DATE_ENABLED` environment variable.
