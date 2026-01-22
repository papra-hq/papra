---
"@papra/docker": patch
"@papra/app-client": patch
"@papra/app-server": patch
---

Add preview support for Office documents (Word, Excel, PowerPoint)

You can now preview Microsoft Office documents (.docx, .xlsx, .pptx) and OpenDocument formats (.odt, .ods, .odp) directly in the browser. The documents are automatically converted to PDF for viewing while keeping the original file intact for downloads.

Supported formats:
- Word: .doc, .docx, .odt
- Excel: .xls, .xlsx, .ods  
- PowerPoint: .ppt, .pptx, .odp
- Rich Text: .rtf

The preview is cached after first conversion for instant loading on subsequent views. Uses LibreOffice headless conversion (included in Docker image).