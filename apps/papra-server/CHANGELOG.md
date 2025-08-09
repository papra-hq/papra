# @papra/app-server

## 0.8.1

### Patch Changes

- [#459](https://github.com/papra-hq/papra/pull/459) [`f20559e`](https://github.com/papra-hq/papra/commit/f20559e95d1dc7d7a099dfd9a9df42bf5ce1b0b2) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Removed dev-dependency needed in production build

## 0.8.0

### Minor Changes

- [#452](https://github.com/papra-hq/papra/pull/452) [`7f7e5bf`](https://github.com/papra-hq/papra/commit/7f7e5bffcbcfb843f3b2458400dfb44409a44867) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Completely rewrote the migration mechanism

- [#447](https://github.com/papra-hq/papra/pull/447) [`b5ccc13`](https://github.com/papra-hq/papra/commit/b5ccc135ba7f4359eaf85221bcb40ee63ba7d6c7) Thanks [@CorentinTh](https://github.com/CorentinTh)! - The file content extraction (like OCR) is now done asynchronously by the task runner

- [#448](https://github.com/papra-hq/papra/pull/448) [`5868800`](https://github.com/papra-hq/papra/commit/5868800bcec6ed69b5441b50e4445fae5cdb5bfb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed the impossibility to delete a tag that has been assigned to a document

- [#432](https://github.com/papra-hq/papra/pull/432) [`6723baf`](https://github.com/papra-hq/papra/commit/6723baf98ad46f989fe1e1e19ad0dd25622cca77) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added new webhook events: document:updated, document:tag:added, document:tag:removed

- [#432](https://github.com/papra-hq/papra/pull/432) [`6723baf`](https://github.com/papra-hq/papra/commit/6723baf98ad46f989fe1e1e19ad0dd25622cca77) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Webhooks invocation is now defered

### Patch Changes

- [#455](https://github.com/papra-hq/papra/pull/455) [`b33fde3`](https://github.com/papra-hq/papra/commit/b33fde35d3e8622e31b51aadfe56875d8e48a2ef) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved feedback message in case of invalid origin configuration

- Updated dependencies [[`a8cff8c`](https://github.com/papra-hq/papra/commit/a8cff8cedc062be3ed1d454e9de6e456553a4d8c), [`6723baf`](https://github.com/papra-hq/papra/commit/6723baf98ad46f989fe1e1e19ad0dd25622cca77), [`6723baf`](https://github.com/papra-hq/papra/commit/6723baf98ad46f989fe1e1e19ad0dd25622cca77), [`67b3b14`](https://github.com/papra-hq/papra/commit/67b3b14cdfa994874c695b9d854a93160ba6a911)]:
  - @papra/webhooks@0.2.0
  - @papra/lecture@0.1.0

## 0.7.0

### Minor Changes

- [#417](https://github.com/papra-hq/papra/pull/417) [`a82ff3a`](https://github.com/papra-hq/papra/commit/a82ff3a755fa1164b4d8ff09b591ed6482af0ccc) Thanks [@CorentinTh](https://github.com/CorentinTh)! - v0.7 release

## 0.6.4

### Patch Changes

- [#394](https://github.com/papra-hq/papra/pull/394) [`f28d824`](https://github.com/papra-hq/papra/commit/f28d8245bf385d7be3b3b8ee449c3fdc88fa375c) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to disable login via email, to support sso-only auth

- [#405](https://github.com/papra-hq/papra/pull/405) [`3401cfb`](https://github.com/papra-hq/papra/commit/3401cfbfdc7e280d2f0f3166ceddcbf55486f574) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Introduce APP_BASE_URL to mutualize server and client base url

- [#392](https://github.com/papra-hq/papra/pull/392) [`21a5ccc`](https://github.com/papra-hq/papra/commit/21a5ccce6d42fde143fd3596918dfdfc9af577a1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix permission issue for non 1000:1000 rootless user

- [#387](https://github.com/papra-hq/papra/pull/387) [`73b8d08`](https://github.com/papra-hq/papra/commit/73b8d080765b6eb9b479db39740cdc6972f6585d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added configuration for the ocr language using DOCUMENTS_OCR_LANGUAGES

- [#379](https://github.com/papra-hq/papra/pull/379) [`6cedc30`](https://github.com/papra-hq/papra/commit/6cedc30716e320946f79a0a9fd8d3b26e834f4db) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Updated dependencies

- Updated dependencies [[`6cedc30`](https://github.com/papra-hq/papra/commit/6cedc30716e320946f79a0a9fd8d3b26e834f4db)]:
  - @papra/webhooks@0.1.1

## 0.6.3

### Patch Changes

- [#357](https://github.com/papra-hq/papra/pull/357) [`585c53c`](https://github.com/papra-hq/papra/commit/585c53cd9d0d7dbd517dbb1adddfd9e7b70f9fe5) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a /llms.txt on main website

- [#366](https://github.com/papra-hq/papra/pull/366) [`b8c2bd7`](https://github.com/papra-hq/papra/commit/b8c2bd70e3d0c215da34efcdcdf1b75da1ed96a1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Allow for adding/removing tags to document using api keys

## 0.6.2

### Patch Changes

- [#337](https://github.com/papra-hq/papra/pull/337) [`1c574b8`](https://github.com/papra-hq/papra/commit/1c574b8305eb7bde4f1b75ac38a610ca0120a613) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Ensure database directory exists when running scripts (like migrations)

## 0.6.1

### Patch Changes

- [#326](https://github.com/papra-hq/papra/pull/326) [`17ca8f8`](https://github.com/papra-hq/papra/commit/17ca8f8f8110c3ffb550f67bfba817872370171c) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix content disposition header to support non-ascii filenames

## 0.6.0

### Minor Changes

- [#320](https://github.com/papra-hq/papra/pull/320) [`8ccdb74`](https://github.com/papra-hq/papra/commit/8ccdb748349a3cacf38f032fd4d3beebce202487) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Set CLIENT_BASE_URL default value to http://localhost:1221 in Dockerfiles

- [#317](https://github.com/papra-hq/papra/pull/317) [`79c1d32`](https://github.com/papra-hq/papra/commit/79c1d3206b140cf8b3d33ef8bda6098dcf4c9c9c) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added document activity log

- [#319](https://github.com/papra-hq/papra/pull/319) [`60059c8`](https://github.com/papra-hq/papra/commit/60059c895c4860cbfda69d3c989ad00542def65b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added pending invitation management page

- [#306](https://github.com/papra-hq/papra/pull/306) [`f0876fd`](https://github.com/papra-hq/papra/commit/f0876fdc638d596c5b7f5eeb2e6cd9beecab328f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for classic SMTP client for email sending

- [#304](https://github.com/papra-hq/papra/pull/304) [`cb38d66`](https://github.com/papra-hq/papra/commit/cb38d66485368429027826d7a1630e75fbe52e65) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Reworked the email sending system to be more flexible and allow for different drivers to be used.
  `EMAILS_DRY_RUN` has been removed and you can now use `EMAILS_DRIVER=logger` config option to log emails instead of sending them.

## 0.5.1

### Patch Changes

- [#302](https://github.com/papra-hq/papra/pull/302) [`b62ddf2`](https://github.com/papra-hq/papra/commit/b62ddf2bc4d1b134b14c847ffa30b65cb29489af) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Set email setting to dry-run by default in docker

## 0.5.0

### Minor Changes

- [#295](https://github.com/papra-hq/papra/pull/295) [`438a311`](https://github.com/papra-hq/papra/commit/438a31171c606138c4b7fa299fdd58dcbeaaf298) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for custom oauth2 providers

- [#294](https://github.com/papra-hq/papra/pull/294) [`b400b3f`](https://github.com/papra-hq/papra/commit/b400b3f18ddbeff33f8265f128d4bc8b67b27d77) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Ensure local database directory en boot

- [#291](https://github.com/papra-hq/papra/pull/291) [`0627ec2`](https://github.com/papra-hq/papra/commit/0627ec25a422b7b820b08740cfc2905f9c55c00e) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added invitation system to add users to an organization

## 0.4.0

### Minor Changes

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly hard delete files in storage driver

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for b2 document storage

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added webhook management

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added API keys support

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added document searchable content edit

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for azure blob document storage

### Patch Changes

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added tag creation button in document page

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix ingestion config coercion

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly handle file names without extensions

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Excluded deleted documents from doc count

- Updated dependencies [[`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67)]:
  - @papra/webhooks@0.1.0
