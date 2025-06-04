# @papra/app-server

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
