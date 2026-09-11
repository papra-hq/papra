# Worklog

Newest first. One entry per session: what changed, decisions, open items.

## 2026-09-11 · branch `feat/receipts`
**Done**
- Reviewed fork: mobile app (Expo, scanner, share intent), AI auto-tagging, OCR strategies (tesseract, mistral-ocr, azure-di) already exist.
- Added `receipt-extraction` server module: LLM detects receipts and fills Vendor, Receipt date, Total, Tax, Currency, Payment method, Expense category custom properties, applies `Receipt` tag. Env toggled (`RECEIPT_EXTRACTION_*`). 18 tests, docs page.
- Added CLAUDE.md and this worklog.

**Decisions**
- Work in Claude's sandbox, push to GitHub each session with a short-lived fine-grained token.
- Global env toggle for now; per-org setting later (needs migration).

**Next**
- Pick one: mobile scan + review flow, vision model extraction, expense view + CSV export.
