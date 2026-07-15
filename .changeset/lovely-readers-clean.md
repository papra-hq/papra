---
'@papra/app': patch
---

Increased and made configurable the timeout of content extraction external service.
Docling, Mistral OCR, and Azure DI can now take up to 5 minutes to process a document, instead of the previous 30 seconds, configurable via `DOCLING_REQUEST_TIMEOUT_MS`, `MISTRAL_OCR_REQUEST_TIMEOUT_MS` and `AZURE_DI_REQUEST_TIMEOUT_MS` respectively.
