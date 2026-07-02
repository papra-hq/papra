---
'@papra/app': patch
---

Greatly improved the performances when updating and deleting document from the sezarch index, avoiding unnecessary table scans. Noticeable improvement on large document collections (10k+ documents).
