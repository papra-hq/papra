# @papra/lecture

## 0.5.0

### Minor Changes

- [#953](https://github.com/papra-hq/papra/pull/953) [`db6badb`](https://github.com/papra-hq/papra/commit/db6badbc3cc15d5d2b91b79602eccc3926e564eb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added content extraction support for scanned PDFs images in 1-bit-per-pixel grayscale format.

- [#948](https://github.com/papra-hq/papra/pull/948) [`725eaff`](https://github.com/papra-hq/papra/commit/725eaff4b0339ce974b91e9eeb4482f716cfa279) Thanks [@CorentinTh](https://github.com/CorentinTh)! - When extracting text from PDF documents, if neither text nor images suitable for OCR are found, the pages are rendered as images and processed with OCR. Adding support for vectorized text.

### Patch Changes

- [#949](https://github.com/papra-hq/papra/pull/949) [`ec740ed`](https://github.com/papra-hq/papra/commit/ec740ed168496a458a3da6a9c71d31e1d8bf2746) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added document content extraction support for .xlsx and .ods files.

## 0.4.0

### Minor Changes

- [#621](https://github.com/papra-hq/papra/pull/621) [`8308e93`](https://github.com/papra-hq/papra/commit/8308e93fdf0c4d52b8ee1de71f1557366d6e622f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for native tesseract cli when available

### Patch Changes

- [#627](https://github.com/papra-hq/papra/pull/627) [`5ccdf44`](https://github.com/papra-hq/papra/commit/5ccdf446f0603467ab8f8833110efbe197bc0f0f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added logger parameter

## 0.3.1

### Patch Changes

- [#604](https://github.com/papra-hq/papra/pull/604) [`c70d7e4`](https://github.com/papra-hq/papra/commit/c70d7e419aa84eb63c18b72d529951761de75e33) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Use provenance for releases

## 0.3.0

### Minor Changes

- [#580](https://github.com/papra-hq/papra/pull/580) [`1228486`](https://github.com/papra-hq/papra/commit/1228486f28ec28a100665e08cb62ab65e883f952) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added text extraction support for `.docx`, `.odt`, `.rtf`, `.pptx` and `.odp`

## 0.2.0

### Minor Changes

- [#464](https://github.com/papra-hq/papra/pull/464) [`14bc2b8`](https://github.com/papra-hq/papra/commit/14bc2b8f8d0d6605062f37188e7c57bbc61b2c1a) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Ditched CommonJs build for packages

## 0.1.0

### Minor Changes

- [#429](https://github.com/papra-hq/papra/pull/429) [`67b3b14`](https://github.com/papra-hq/papra/commit/67b3b14cdfa994874c695b9d854a93160ba6a911) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for scanned pdf content extraction
