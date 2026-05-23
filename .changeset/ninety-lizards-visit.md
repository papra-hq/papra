---
"@papra/app": patch
---

Fix preview of pdfs without embedded fonts by packaging cmaps and custom fonts in the app assets. Increasing the bundle size by ~2mb, but it's worth it for the improved UX and compatibility with a wider range of pdfs.
