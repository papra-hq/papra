---
'@papra/cli': patch
---

Fixed the Paperless-ngx importer failing with "File not found in archive" for files with accented characters (like umlauts) in their names when the archive and the manifest use different unicode normalization forms.
