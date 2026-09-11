# Worklog

Active branch: `feat/receipts`
Newest first. One entry per session. Format: see the papra-session skill (`references/worklog.md`).

## 2026-09-11 · `feat/receipts` · Fork review, receipt extraction, session workflow

**Done**
- Reviewed the fork. Already present upstream: Expo mobile app with document scanner and share intent, AI auto-tagging (Anthropic, OpenAI-compatible, Ollama), OCR strategies (tesseract, mistral-ocr, azure-di, docling).
- Added `receipt-extraction` server module: LLM detects receipts and invoices, fills Vendor, Receipt date, Total, Tax, Currency, Payment method, Expense category custom properties, applies `Receipt` tag. Env `RECEIPT_EXTRACTION_*`, AI credits source `receipt-extraction`. 18 tests, docs page `14-receipt-extraction.mdx`.
- Added CLAUDE.md, this worklog, and the `papra-session` skill (setup, check and push scripts).

**Decisions**
- Work in Claude's sandbox, push to GitHub at the end of each session (and after milestones) with a short-lived fine-grained token. No patches.
- Session log lives in the repo as WORKLOG.md, with a comments section for Yasam's feedback.
- Receipt extraction uses a global env toggle for now; per-org setting later (needs a migration).

**Comments**
- Yasam wants the app for collecting and managing receipts, with mobile capture by photo or scanning and AI detection and tagging.
- Sandbox runs Node 22; repo needs Node 26 (`Temporal`). Tests run with a polyfill via the skill's `check.sh`.
- Keep AGPL-3.0 in mind if this becomes a closed commercial SaaS.

**Open / Next**
- Pick the next feature: mobile scan + review flow, vision model extraction, or expense view + CSV export.
