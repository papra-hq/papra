---
'@papra/search-parser': patch
---

Fixed the `-` negation prefix in front of a parenthesized group, `-(tag:personal OR tag:private)` now parses the same as `NOT (tag:personal OR tag:private)` instead of negating an empty text term
