---
'@papra/app': minor
---

Add support for external document content extraction/ocr, with multiple provider, and support for combining providers using document type filtering and fallback. Currently supported providers are:

- Mistral OCR
- Azure Document Intelligence
- Docling server
- Custom HTTP endpoint (configurable)
- Internal Papra extraction engine (default)
