# @papra/app

## 26.1.1

### Patch Changes

- [#820](https://github.com/papra-hq/papra/pull/820) [`3fa398c`](https://github.com/papra-hq/papra/commit/3fa398c92851e6f0c767bd66e8cc2f0e523577ef) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Replaced `date-fns` functions with in-house implementations to avoid pulling the 30MB lib (mainly due to locale data).

- [#827](https://github.com/papra-hq/papra/pull/827) [`ca2ef28`](https://github.com/papra-hq/papra/commit/ca2ef2866bfb54abaed26c4c748b4ec5fadf6170) Thanks [@CorentinTh](https://github.com/CorentinTh)! - In the search queries, tag filters are now case-insensitive, so `tag:Important` and `tag:important` will match the same tag (as tags names are case-insensitive).

- [#826](https://github.com/papra-hq/papra/pull/826) [`494aa5b`](https://github.com/papra-hq/papra/commit/494aa5b882315fb55ab84f78259d899e5e2d5355) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Trim tag names and descriptions on creation and update to avoid leading/trailing spaces.

- [#829](https://github.com/papra-hq/papra/pull/829) [`393a155`](https://github.com/papra-hq/papra/commit/393a15593fdc60ebd11dcf82c29ae95159122f25) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a button to generate a random color in the tag creation/edition modal.

- [#815](https://github.com/papra-hq/papra/pull/815) [`46d8d2d`](https://github.com/papra-hq/papra/commit/46d8d2d45ec89aebe7e41c78a6d6cf85fce9cc0b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Significantly reduced the size of the rootless docker image by preventing file duplications due to `chown` operations, gaining ~230MB, more than 30% reduction in size.

- [#811](https://github.com/papra-hq/papra/pull/811) [`1eeb3df`](https://github.com/papra-hq/papra/commit/1eeb3df4a282d93bb71c8f34cf086fa0babfb40e) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added small header in organization creation page to quickly access the invitations when first organization is being created

## 26.1.0

### Minor Changes

- [#796](https://github.com/papra-hq/papra/pull/796) [`aaa05a8`](https://github.com/papra-hq/papra/commit/aaa05a86076af06792965bd00dde096965bb244e) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Renamed the internal distribution package from `@papra/docker` to `@papra/app`. New release tags will use the format `@papra/app@26.0.0` instead of `@papra/docker@26.0.0`.

### Patch Changes

- [#784](https://github.com/papra-hq/papra/pull/784) [`2c078e2`](https://github.com/papra-hq/papra/commit/2c078e20f5341dfc185f427b02c166256f3e22f8) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Tag list: order tags by creation date descending (newest on top)

- [#781](https://github.com/papra-hq/papra/pull/781) [`7c5e68f`](https://github.com/papra-hq/papra/commit/7c5e68fbfcf91aa75e429f44ad645fc00b96d22e) Thanks [@CorentinTh](https://github.com/CorentinTh)! - When navigating to / and having only one organization, get redirected to that organization

- [#783](https://github.com/papra-hq/papra/pull/783) [`ad575bf`](https://github.com/papra-hq/papra/commit/ad575bfc62096f44dab9e25915c6a1e0f30d9ceb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix tag automatic search link issue when tags have spaces, before `tag:my tag` would not work, now generate `tag:"my tag"` to fix it.

- [#795](https://github.com/papra-hq/papra/pull/795) [`3a41531`](https://github.com/papra-hq/papra/commit/3a4153116c6111f82d5cb2417f9874ebb5450d17) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Hide the "Don't have an account? Register" link on the login page when new account registration is disabled.

- [#785](https://github.com/papra-hq/papra/pull/785) [`45534a0`](https://github.com/papra-hq/papra/commit/45534a0ce7292ed723d56efd4796390a62e0f3e3) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the `has:tags` search filter to check for the presence or absence (`-has:tags` or `NOT has:tags`) of tags on documents.

- [#777](https://github.com/papra-hq/papra/pull/777) [`42e401c`](https://github.com/papra-hq/papra/commit/42e401c7dd73b98dc575c3876d0888c98b9a0350) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly tree-shake all demo assets to reduce the size of production non-demo build. Reducing the bundle assets by ~70kB (~55kB on main chunk + removed demo chunk of ~15kB).

- [#794](https://github.com/papra-hq/papra/pull/794) [`0485701`](https://github.com/papra-hq/papra/commit/0485701c6614d652dfd5b8286c92a1c0e7cf367e) Thanks [@ktsourdinis](https://github.com/ktsourdinis)! - Added Greek language support

- [#798](https://github.com/papra-hq/papra/pull/798) [`c27d85f`](https://github.com/papra-hq/papra/commit/c27d85fea41eaf6ba0d87890d4952e502aeec864) Thanks [@cergmin](https://github.com/cergmin)! - Added Russian language support

## 26.0.0

### Major Changes

- [#758](https://github.com/papra-hq/papra/pull/758) [`a2a2061`](https://github.com/papra-hq/papra/commit/a2a2061a63bd6c8c2b865ab9c31de2cca438a3cb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - API Breaking Change:
  Document search endpoint now returns complete documents along with total count matching the search query, and no longer nests results under `searchResults`.

  Before:

  ```ts
  // GET /api/organizations/:organizationId/documents/search?searchQuery=foobar
  {
    searchResults: {
      documents: [
        { id: 'doc_1', name: 'Document 1.pdf' },
        { id: 'doc_2', name: 'Document 2.pdf' },
      ],
    },
  }
  ```

  After:

  ```ts
  // GET /api/organizations/:organizationId/documents/search?searchQuery=foobar
  {
    documents: [
      { id: 'doc_1', name: 'Document 1.pdf', mimeType: 'application/pdf' /* ...otherProps */ },
      { id: 'doc_2', name: 'Document 2.pdf', mimeType: 'application/pdf' /* ...otherProps */ },
    ],
    totalCount: 42,
  }
  ```

### Patch Changes

- [#761](https://github.com/papra-hq/papra/pull/761) [`2e46c08`](https://github.com/papra-hq/papra/commit/2e46c08de330ec61fbd7f106bc39d533b87220a7) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a "Show more results" option in quick search when there is more document not displayed

- [#733](https://github.com/papra-hq/papra/pull/733) [`848671b`](https://github.com/papra-hq/papra/commit/848671b982379ef6ebe26aeb7b1b8ccde89f3b8d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved search speed by using document and organization ids in index
  The first restart after updating may take up to few minutes as the search index is rebuilt

- [#758](https://github.com/papra-hq/papra/pull/758) [`a2a2061`](https://github.com/papra-hq/papra/commit/a2a2061a63bd6c8c2b865ab9c31de2cca438a3cb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - The documents page can now be used with advanced search queries

- [#723](https://github.com/papra-hq/papra/pull/723) [`68d848e`](https://github.com/papra-hq/papra/commit/68d848e622f862ced34ff055819b4af7d171d727) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Auto assign admin role to the first user registering

- [#726](https://github.com/papra-hq/papra/pull/726) [`e8f6217`](https://github.com/papra-hq/papra/commit/e8f6217e351a6b3c5197dae41ea0f12b3d8534b3) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added about page and modal with version informations

- [#707](https://github.com/papra-hq/papra/pull/707) [`a213f06`](https://github.com/papra-hq/papra/commit/a213f0683baebd6546bf38ba9e719c31b60064ed) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a dedicated increased timeout for the document upload route

- [#712](https://github.com/papra-hq/papra/pull/712) [`b8c14d0`](https://github.com/papra-hq/papra/commit/b8c14d0f44628843c7a682f84f7215fecc50f426) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a feedback message upon request timeout

- [#717](https://github.com/papra-hq/papra/pull/717) [`f3fb5ff`](https://github.com/papra-hq/papra/commit/f3fb5ff46a02d9ded9baaa0161d96fdb3ab5649d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for two factor authentication

- [#702](https://github.com/papra-hq/papra/pull/702) [`ec34cf1`](https://github.com/papra-hq/papra/commit/ec34cf17880682369d1ecf2957c2d7e0eed9f499) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Organizations listing and details in the admin dashboard

- [#746](https://github.com/papra-hq/papra/pull/746) [`685f03c`](https://github.com/papra-hq/papra/commit/685f03c2fcbba134f108fb0b536f32b0597c60c6) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added advanced search syntax support

- [#715](https://github.com/papra-hq/papra/pull/715) [`7448a17`](https://github.com/papra-hq/papra/commit/7448a170afc9f0038a7b8ac086d4d14aac3b0c3a) Thanks [@kirarpit](https://github.com/kirarpit)! - Properly cleanup orphan file when the same document exists in trash

- [#758](https://github.com/papra-hq/papra/pull/758) [`a2a2061`](https://github.com/papra-hq/papra/commit/a2a2061a63bd6c8c2b865ab9c31de2cca438a3cb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added query params sync for the search query in the documents search page for deep linking and browser state navigation

- [#758](https://github.com/papra-hq/papra/pull/758) [`a2a2061`](https://github.com/papra-hq/papra/commit/a2a2061a63bd6c8c2b865ab9c31de2cca438a3cb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Removed the possibility to filter by tag in the `/api/organizations/:organizationId/documents` route, use the `/api/organizations/:organizationId/documents/search` route instead.

  ```bash
  # Before:
  GET /api/organizations/:organizationId/documents?tags=yourTagId

  # After:
  GET /api/organizations/:organizationId/documents/search?query=tag:yourTagNameOrId
  ```

- [#707](https://github.com/papra-hq/papra/pull/707) [`a213f06`](https://github.com/papra-hq/papra/commit/a213f0683baebd6546bf38ba9e719c31b60064ed) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Changed config key `config.server.routeTimeoutMs` to `config.server.defaultRouteTimeoutMs` (env variable remains the same)

- [#718](https://github.com/papra-hq/papra/pull/718) [`8d70a7b`](https://github.com/papra-hq/papra/commit/8d70a7b3c36bcf3f49a27e2c4e92d3b974b552c2) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added api endpoint to check current API key (GET /api/api-keys/current)

## 25.12.0

### Minor Changes

- [#685](https://github.com/papra-hq/papra/pull/685) [`cf91515`](https://github.com/papra-hq/papra/commit/cf91515cfe448176ac2f2c54f781495725678515) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Document search indexing and synchronization is now asynchronous, and no longer relies on database triggers.
  This significantly improves the responsiveness of the application when adding, updating, trashing, restoring, or deleting documents. It's even more noticeable when dealing with a large number of documents or on low-end hardware.

- [#686](https://github.com/papra-hq/papra/pull/686) [`95662d0`](https://github.com/papra-hq/papra/commit/95662d025f535bf0f4f48683c1f7cb1fffeff0a7) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Enforcing the auth secret to be at least 32 characters long for security reasons

- [#686](https://github.com/papra-hq/papra/pull/686) [`95662d0`](https://github.com/papra-hq/papra/commit/95662d025f535bf0f4f48683c1f7cb1fffeff0a7) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Now throw an error if AUTH_SECRET is not set in production mode

- [#689](https://github.com/papra-hq/papra/pull/689) [`d795798`](https://github.com/papra-hq/papra/commit/d7957989310693934fd6e30f6ce540d76f10c9a2) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a platform administration dashboard

- [#675](https://github.com/papra-hq/papra/pull/675) [`17d6e9a`](https://github.com/papra-hq/papra/commit/17d6e9aa6a7152f3ceac3e829884cbd511166b99) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for Simplified Chinese language

- [#679](https://github.com/papra-hq/papra/pull/679) [`6f38659`](https://github.com/papra-hq/papra/commit/6f38659638f5b84cd3ca330e5c44cb3b452921ae) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed an issue where the document icon didn't load for unknown file types

## 25.11.0

### Minor Changes

- [#638](https://github.com/papra-hq/papra/pull/638) [`ae3abe9`](https://github.com/papra-hq/papra/commit/ae3abe9ec71bee5749a18190ef05228338ad1573) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to filter out some email domain names for new registration

- [#633](https://github.com/papra-hq/papra/pull/633) [`d267605`](https://github.com/papra-hq/papra/commit/d2676052c372ddf81c653cec699879cc2af212f9) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Lazy load some demo-mode specific code to reduce production client bundle

- [#618](https://github.com/papra-hq/papra/pull/618) [`868281b`](https://github.com/papra-hq/papra/commit/868281bcffeef5adcf949c68721a90b7d5dd8e8f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added translations for document table headers

- [#653](https://github.com/papra-hq/papra/pull/653) [`ca80806`](https://github.com/papra-hq/papra/commit/ca808064fa82c4827eb0b3038ceb840291fe637b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added some logging context when an intake email is received

- [#650](https://github.com/papra-hq/papra/pull/650) [`dc6ee5b`](https://github.com/papra-hq/papra/commit/dc6ee5b22877e1d679aeec7d42e3894e6de54ff7) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Api breaking change: the document search endpoint return format changed, impacting any custom clients consuming it.

  Before

  ```ts
  // Get /api/organizations/:organizationId/documents/search
  {
    documents: {
      id: string;
      name: string;
      mimeType: string;
      // ... other document fields
    }
    [];
  }
  ```

  After

  ```ts
  // Get /api/organizations/:organizationId/documents/search
  {
    searchResults: {
      documents: {
        id: string;
        name: string;
      }
      [];
    }
  }
  ```

- [#619](https://github.com/papra-hq/papra/pull/619) [`5b5ce85`](https://github.com/papra-hq/papra/commit/5b5ce85061b0aff3edb947db131d7149adc01605) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Limit concurrent browser upload to avoid network crashes

- [#609](https://github.com/papra-hq/papra/pull/609) [`cb1f1b5`](https://github.com/papra-hq/papra/commit/cb1f1b5b019069e1119db015cc8ff55a1bed1d1c) Thanks [@dbarenholz](https://github.com/dbarenholz)! - Made the tags clickable in the tag list

- [#655](https://github.com/papra-hq/papra/pull/655) [`08f4a1c`](https://github.com/papra-hq/papra/commit/08f4a1cd058277a63e4966ce1bdf73e94df22d39) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Intake email edge case: use original destination addresses when available for intake emails when forwarded

- [#660](https://github.com/papra-hq/papra/pull/660) [`9b43baf`](https://github.com/papra-hq/papra/commit/9b43bafe333717de254c88fbfae2497538c0eaf9) Thanks [@bkwi](https://github.com/bkwi)! - Removed the possibility for unauthorized upload to another organization you're not member of

- [#616](https://github.com/papra-hq/papra/pull/616) [`1922f24`](https://github.com/papra-hq/papra/commit/1922f24c0ad2acbe3a54559c30cfbaff3e1ccf5b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Upgraded to node v24

- [#607](https://github.com/papra-hq/papra/pull/607) [`abc463f`](https://github.com/papra-hq/papra/commit/abc463f75192ca0812466ea874ad2c6d363bd25a) Thanks [@dbarenholz](https://github.com/dbarenholz)! - Added Dutch translation

- [#625](https://github.com/papra-hq/papra/pull/625) [`ee9eff4`](https://github.com/papra-hq/papra/commit/ee9eff491428020ec95ed0af7ac64de64c70f21a) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved server authentication logging

- [#623](https://github.com/papra-hq/papra/pull/623) [`b087764`](https://github.com/papra-hq/papra/commit/b0877645a868998cae2b022e94f20c63946c9bae) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved unique constraints error when dealing with hosted libsql db

- [#637](https://github.com/papra-hq/papra/pull/637) [`479a603`](https://github.com/papra-hq/papra/commit/479a6030015d9df437d4bcb16078a4daf3fe9b60) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix tags table overflow for long tag descriptions: added some text wrapping for the description

- [#657](https://github.com/papra-hq/papra/pull/657) [`96403c0`](https://github.com/papra-hq/papra/commit/96403c00473763dabc47745556b3a135ff4db3aa) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix environment variable `DOCUMENT_STORAGE_S3_FORCE_PATH_STYLE` validation schema to account for boolean string

## 25.10.2

### Patch Changes

- [#602](https://github.com/papra-hq/papra/pull/602) [`79e9bb1`](https://github.com/papra-hq/papra/commit/79e9bb1b6169c12dd0aa6bf75aa9929a9120d947) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added an email verification confirmation/expiration page

- [#577](https://github.com/papra-hq/papra/pull/577) [`bd3e321`](https://github.com/papra-hq/papra/commit/bd3e321eb7216306faf3c0e1f3d2a7072f162d1f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved graceful shutdown

- [#584](https://github.com/papra-hq/papra/pull/584) [`f4740ba`](https://github.com/papra-hq/papra/commit/f4740ba59a63a84978e49d0073f0057c69b2a65f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Reduced client bundle size by removing date-fns

- [#598](https://github.com/papra-hq/papra/pull/598) [`377c11c`](https://github.com/papra-hq/papra/commit/377c11c185f56e197d4973a1e28866598dd553e0) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix client redirection issue on non-existent organization

- [#580](https://github.com/papra-hq/papra/pull/580) [`1228486`](https://github.com/papra-hq/papra/commit/1228486f28ec28a100665e08cb62ab65e883f952) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added text extraction support for `.docx`, `.odt`, `.rtf`, `.pptx` and `.odp`

- [#591](https://github.com/papra-hq/papra/pull/591) [`0aad884`](https://github.com/papra-hq/papra/commit/0aad88471bc813255b82163ba0b223bc326b9cd6) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Updated pnpm version

- [#575](https://github.com/papra-hq/papra/pull/575) [`be25de7`](https://github.com/papra-hq/papra/commit/be25de77215c87614a7387dc8dc02d86535d0510) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added global errors handlers

- [#601](https://github.com/papra-hq/papra/pull/601) [`16ae461`](https://github.com/papra-hq/papra/commit/16ae4617df26d6c2c03e3a9268d7d9fe6f14215f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added missing translations in the tagging rule form

- [#601](https://github.com/papra-hq/papra/pull/601) [`16ae461`](https://github.com/papra-hq/papra/commit/16ae4617df26d6c2c03e3a9268d7d9fe6f14215f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Choose between `All conditions must match` and `Any condition must match` in tagging rules

- [#582](https://github.com/papra-hq/papra/pull/582) [`182ccbb`](https://github.com/papra-hq/papra/commit/182ccbb30bdaed33ee565465fd2d79cdbc881d8b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed the webhook last triggered date always showing "never" in the webhook list.

- [#583](https://github.com/papra-hq/papra/pull/583) [`b0abf7f`](https://github.com/papra-hq/papra/commit/b0abf7f78a851fccb4a5d9fce1400d0dc1020c02) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved the translation of dates and relative time

- [#577](https://github.com/papra-hq/papra/pull/577) [`bd3e321`](https://github.com/papra-hq/papra/commit/bd3e321eb7216306faf3c0e1f3d2a7072f162d1f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to start either just the api, just the workers, or both (default)

- [#585](https://github.com/papra-hq/papra/pull/585) [`a857370`](https://github.com/papra-hq/papra/commit/a857370343214566f22120dfeb2cb73e70561166) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix webhook creation form preventing to create webhooks without secrets

- [#540](https://github.com/papra-hq/papra/pull/540) [`75340f0`](https://github.com/papra-hq/papra/commit/75340f0ce7b1cec7b2599a80599dcab7f3013e23) Thanks [@jodli](https://github.com/jodli)! - Added button to reapply a tagging rule

- [#589](https://github.com/papra-hq/papra/pull/589) [`e9a719d`](https://github.com/papra-hq/papra/commit/e9a719d06a93e8f79f1bacad01e30d9764606117) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed wrongly formatted [object Object] feedback message in auth pages

## 25.10.1

### Patch Changes

- [#567](https://github.com/papra-hq/papra/pull/567) [`d7df2f0`](https://github.com/papra-hq/papra/commit/d7df2f095b8cdcdf5ac068a7e1ff6ead12a874c6) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Removed unnecessary left icon navbar

- [#556](https://github.com/papra-hq/papra/pull/556) [`f66a9f5`](https://github.com/papra-hq/papra/commit/f66a9f5d1b3fe7a918802f9d6d1a90b073bd50c8) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added deleted and total document counts and sizes in the `/api/organizations/:organizationId/documents/statistics` route

- [#570](https://github.com/papra-hq/papra/pull/570) [`c3ffa83`](https://github.com/papra-hq/papra/commit/c3ffa8387e2e757098d5344023363897e7e0a416) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added server hostname configuration

- [#552](https://github.com/papra-hq/papra/pull/552) [`8aabd28`](https://github.com/papra-hq/papra/commit/8aabd28168fe7e77f5186ae7dd79e1f5d0bb7288) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Lighten the client bundle by removing lodash dep

- [#550](https://github.com/papra-hq/papra/pull/550) [`1a7a14b`](https://github.com/papra-hq/papra/commit/1a7a14b3ed4caf1d9fec86a034249f3f7267d4e8) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix weird navigation freeze when direct navigation to organizations

- [#548](https://github.com/papra-hq/papra/pull/548) [`17cebde`](https://github.com/papra-hq/papra/commit/17cebde051eb2a09b9ac7bfc32674afc15e60ad2) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Made the validation more permissive for incoming intake email webhook addresses, allowing RFC 5322 compliant email addresses instead of just simple emails.

- [#565](https://github.com/papra-hq/papra/pull/565) [`e4295e1`](https://github.com/papra-hq/papra/commit/e4295e14abf3a0bce9db10f41d46fd86c4bb4cb5) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Prevent small flash of wrong theme on initial load for slower connections

- [#566](https://github.com/papra-hq/papra/pull/566) [`92daaa3`](https://github.com/papra-hq/papra/commit/92daaa35bb5e3b515b7eeda837f0a9e7dc0005f1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Redacted webhook signing secret in api update response

- [#560](https://github.com/papra-hq/papra/pull/560) [`54cc140`](https://github.com/papra-hq/papra/commit/54cc14052c5c6bc5e0b29a8feb92604d13e0fd52) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Reduced the client bundle size by switching to posthog-lite

- [#555](https://github.com/papra-hq/papra/pull/555) [`c5b337f`](https://github.com/papra-hq/papra/commit/c5b337f3bb63fb0fc700dae08bacf0095f9b98e0) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Use organization max file size limit for pre-upload validation

- [#567](https://github.com/papra-hq/papra/pull/567) [`d7df2f0`](https://github.com/papra-hq/papra/commit/d7df2f095b8cdcdf5ac068a7e1ff6ead12a874c6) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Redesigned the organization picker in the sidenav

## 25.10.0

### Minor Changes

- [#544](https://github.com/papra-hq/papra/pull/544) [`9c6f14f`](https://github.com/papra-hq/papra/commit/9c6f14fc1316c972092cb29bb94ae7b53edeef02) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Use calendar based versioning for docker images

### Patch Changes

- [#532](https://github.com/papra-hq/papra/pull/532) [`9a6e822`](https://github.com/papra-hq/papra/commit/9a6e822e7145c41707c86126eb8241df798d2c0b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Drop docker armv7 support

- [#542](https://github.com/papra-hq/papra/pull/542) [`c434d87`](https://github.com/papra-hq/papra/commit/c434d873bc2da79664f8581bc802131beb95e490) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added soft deletion with grace period for organizations

- [#534](https://github.com/papra-hq/papra/pull/534) [`624ad62`](https://github.com/papra-hq/papra/commit/624ad62c53a94a0b5722712957457cb9751a56d9) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a page to view organization usage

- [#538](https://github.com/papra-hq/papra/pull/538) [`73ab9e8`](https://github.com/papra-hq/papra/commit/73ab9e8ab58a96035182f9630977c17178f32405) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Save document activity log when auto tagging rule is applied

- [#538](https://github.com/papra-hq/papra/pull/538) [`73ab9e8`](https://github.com/papra-hq/papra/commit/73ab9e8ab58a96035182f9630977c17178f32405) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Trigger tag-added webhooks when auto tagging rule is applied

## 0.9.6

### Patch Changes

- [#531](https://github.com/papra-hq/papra/pull/531) [`2e2bb6f`](https://github.com/papra-hq/papra/commit/2e2bb6fbbdd02f6b8352ef2653bef0447948c1f0) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added env variable to configure ip header for rate limit

- [#524](https://github.com/papra-hq/papra/pull/524) [`c84a921`](https://github.com/papra-hq/papra/commit/c84a9219886ecb2a77c67d904cf8c8d15b50747b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed the api validation of tag colors to make it case incensitive

## 0.9.5

### Patch Changes

- [#521](https://github.com/papra-hq/papra/pull/521) [`b287723`](https://github.com/papra-hq/papra/commit/b28772317c3662555e598755b85597d6cd5aeea1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly handle file names encoding (utf8 instead of latin1) to support non-ASCII characters.

- [#517](https://github.com/papra-hq/papra/pull/517) [`a3f9f05`](https://github.com/papra-hq/papra/commit/a3f9f05c664b4995b62db59f2e9eda8a3bfef0de) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Prevented organization deletion by non-organization owner

## 0.9.4

### Patch Changes

- [#508](https://github.com/papra-hq/papra/pull/508) [`782f70f`](https://github.com/papra-hq/papra/commit/782f70ff663634bf9ff7218edabb9885a7c6f965) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added an option to disable PRAGMA statements from sqlite task service migrations

- [#510](https://github.com/papra-hq/papra/pull/510) [`ab6fd6a`](https://github.com/papra-hq/papra/commit/ab6fd6ad10387f1dcd626936efc195d9d58d40ec) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added fallbacks env variables for the task worker id

- [#512](https://github.com/papra-hq/papra/pull/512) [`cb3ce6b`](https://github.com/papra-hq/papra/commit/cb3ce6b1d8d5dba09cbf0d2964f14b1c93220571) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added organizations permissions for api keys

## 0.9.3

### Patch Changes

- [#506](https://github.com/papra-hq/papra/pull/506) [`6bcb2a7`](https://github.com/papra-hq/papra/commit/6bcb2a71e990d534dd12d84e64a38f2b2baea25a) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to define patterns for email intake username generation

- [#504](https://github.com/papra-hq/papra/pull/504) [`936bc2b`](https://github.com/papra-hq/papra/commit/936bc2bd0a788e4fb0bceb6d14810f9f8734097b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Split the intake-email username generation from the email address creation, some changes regarding the configuration when using the `random` driver.

  ```env
  # Old configuration
  INTAKE_EMAILS_DRIVER=random-username
  INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN=mydomain.com

  # New configuration
  INTAKE_EMAILS_DRIVER=catch-all
  INTAKE_EMAILS_CATCH_ALL_DOMAIN=mydomain.com
  INTAKE_EMAILS_USERNAME_DRIVER=random
  ```

- [#504](https://github.com/papra-hq/papra/pull/504) [`936bc2b`](https://github.com/papra-hq/papra/commit/936bc2bd0a788e4fb0bceb6d14810f9f8734097b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to configure OwlRelay domain

## 0.9.2

### Patch Changes

- [#493](https://github.com/papra-hq/papra/pull/493) [`ed4d7e4`](https://github.com/papra-hq/papra/commit/ed4d7e4a00b2ca2c7fe808201c322f957d6ed990) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix to allow cross docker volume file moving when consumption is done

- [#500](https://github.com/papra-hq/papra/pull/500) [`208a561`](https://github.com/papra-hq/papra/commit/208a561668ed2d1019430a9f4f5c5d3fd4cde603) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to define a Libsql/Sqlite driver for the tasks service

- [#499](https://github.com/papra-hq/papra/pull/499) [`40cb1d7`](https://github.com/papra-hq/papra/commit/40cb1d71d5e52c40aab7ea2c6bc222cea6d55b70) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Enhanced security by serving files as attachement and with an octet-stream content type

- [#501](https://github.com/papra-hq/papra/pull/501) [`b5bf0cc`](https://github.com/papra-hq/papra/commit/b5bf0cca4b571495329cb553da06e0d334ee8968) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix an issue preventing to disable the max upload size

- [#498](https://github.com/papra-hq/papra/pull/498) [`3da13f7`](https://github.com/papra-hq/papra/commit/3da13f759155df5d7c532160a7ea582385db63b6) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Removed the "open in new tab" button for security improvement (xss prevention)

## 0.9.1

### Patch Changes

- [#491](https://github.com/papra-hq/papra/pull/491) [`bb9d555`](https://github.com/papra-hq/papra/commit/bb9d5556d3f16225ae40ca4d39600999e819b2c4) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix cleanup state when a too-big-file is uploaded

- [#492](https://github.com/papra-hq/papra/pull/492) [`54514e1`](https://github.com/papra-hq/papra/commit/54514e15db5deaffc59dcba34929b5e2e74282e1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a client side guard for rejecting too-big files

- [#488](https://github.com/papra-hq/papra/pull/488) [`83e943c`](https://github.com/papra-hq/papra/commit/83e943c5b46432e55b6dfbaa587019a95ffab466) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix favicons display issues on firefox

- [#492](https://github.com/papra-hq/papra/pull/492) [`54514e1`](https://github.com/papra-hq/papra/commit/54514e15db5deaffc59dcba34929b5e2e74282e1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix i18n messages when a file-too-big error happens

- [#492](https://github.com/papra-hq/papra/pull/492) [`54514e1`](https://github.com/papra-hq/papra/commit/54514e15db5deaffc59dcba34929b5e2e74282e1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Clean all upload method to happen through the import status modal

## 0.9.0

### Minor Changes

- [#472](https://github.com/papra-hq/papra/pull/472) [`b08241f`](https://github.com/papra-hq/papra/commit/b08241f20fc326a65a8de0551a7bfa91d9e4c71d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Dropped support for the dedicated backblaze b2 storage driver as b2 now fully support s3 client

- [#480](https://github.com/papra-hq/papra/pull/480) [`0a03f42`](https://github.com/papra-hq/papra/commit/0a03f42231f691d339c7ab5a5916c52385e31bd2) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added documents encryption layer

- [#472](https://github.com/papra-hq/papra/pull/472) [`b08241f`](https://github.com/papra-hq/papra/commit/b08241f20fc326a65a8de0551a7bfa91d9e4c71d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Stream file upload instead of full in-memory loading

### Patch Changes

- [#483](https://github.com/papra-hq/papra/pull/483) [`ec0a437`](https://github.com/papra-hq/papra/commit/ec0a437d86b4c8c0979ba9d0c2ff7b39f054cec0) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix a bug where the ingestion folder was not working when the done or error destination folder path (`INGESTION_FOLDER_POST_PROCESSING_MOVE_FOLDER_PATH` and `INGESTION_FOLDER_ERROR_FOLDER_PATH`) were absolute.

- [#475](https://github.com/papra-hq/papra/pull/475) [`ea9d90d`](https://github.com/papra-hq/papra/commit/ea9d90d6cff6954297152b3ad16f99170e8cd0dc) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Use node file streams in ingestion folder for smaller RAM footprint

- [#477](https://github.com/papra-hq/papra/pull/477) [`a62d376`](https://github.com/papra-hq/papra/commit/a62d3767729ab02ae203a1ac7b7fd6eb6e011d98) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed an issue where tags assigned to only deleted documents won't show up in the tag list

- [#472](https://github.com/papra-hq/papra/pull/472) [`b08241f`](https://github.com/papra-hq/papra/commit/b08241f20fc326a65a8de0551a7bfa91d9e4c71d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly handle missing files errors in storage drivers

- [#471](https://github.com/papra-hq/papra/pull/471) [`e77a42f`](https://github.com/papra-hq/papra/commit/e77a42fbf14da011cd396426aa0bbea56c889740) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Lazy load the PDF viewer to reduce the main chunk size

- [#481](https://github.com/papra-hq/papra/pull/481) [`1606310`](https://github.com/papra-hq/papra/commit/1606310745e8edf405b527127078143481419e8c) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Allow for more complex intake-email origin adresses

- [#470](https://github.com/papra-hq/papra/pull/470) [`d488efe`](https://github.com/papra-hq/papra/commit/d488efe2cc4aa4f433cec4e9b8cc909b091eccc4) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Simplified i18n tooling + improved performances

- [#468](https://github.com/papra-hq/papra/pull/468) [`14c3587`](https://github.com/papra-hq/papra/commit/14c3587de07a605ec586bdc428d9e76956bf1c67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Prevent infinit loading in search modal when an error occure

- [#468](https://github.com/papra-hq/papra/pull/468) [`14c3587`](https://github.com/papra-hq/papra/commit/14c3587de07a605ec586bdc428d9e76956bf1c67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved the UX of the document content edition panel

- [#468](https://github.com/papra-hq/papra/pull/468) [`14c3587`](https://github.com/papra-hq/papra/commit/14c3587de07a605ec586bdc428d9e76956bf1c67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added content edition support in demo mode

## 0.8.2

### Patch Changes

- [#461](https://github.com/papra-hq/papra/pull/461) [`c085b9d`](https://github.com/papra-hq/papra/commit/c085b9d6766297943112601d3c634c716c4be440) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix a regression bug that executed tagging rules before the file content was extracted

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

- [#419](https://github.com/papra-hq/papra/pull/419) [`7768840`](https://github.com/papra-hq/papra/commit/7768840aa4425a03cb96dc1c17605bfa8e6a0de4) Thanks [@Edward205](https://github.com/Edward205)! - Added diacritics and improved wording for Romanian translation

- [#448](https://github.com/papra-hq/papra/pull/448) [`5868800`](https://github.com/papra-hq/papra/commit/5868800bcec6ed69b5441b50e4445fae5cdb5bfb) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added feedback when an error occurs while deleting a tag

- [#412](https://github.com/papra-hq/papra/pull/412) [`ffdae8d`](https://github.com/papra-hq/papra/commit/ffdae8db56c6ecfe63eb263ee606e9469eef8874) Thanks [@OsafAliSayed](https://github.com/OsafAliSayed)! - Simplified the organization intake email list

- [#441](https://github.com/papra-hq/papra/pull/441) [`5e46bb9`](https://github.com/papra-hq/papra/commit/5e46bb9e6a39cd16a83636018370607a27db042a) Thanks [@Zavy86](https://github.com/Zavy86)! - Added Italian (it) language support

- [#455](https://github.com/papra-hq/papra/pull/455) [`b33fde3`](https://github.com/papra-hq/papra/commit/b33fde35d3e8622e31b51aadfe56875d8e48a2ef) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved feedback message in case of invalid origin configuration

## 0.7.0

### Minor Changes

- [#417](https://github.com/papra-hq/papra/pull/417) [`a82ff3a`](https://github.com/papra-hq/papra/commit/a82ff3a755fa1164b4d8ff09b591ed6482af0ccc) Thanks [@CorentinTh](https://github.com/CorentinTh)! - v0.7 release

## 0.6.4

### Patch Changes

- [#392](https://github.com/papra-hq/papra/pull/392) [`21a5ccc`](https://github.com/papra-hq/papra/commit/21a5ccce6d42fde143fd3596918dfdfc9af577a1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix permission issue for non 1000:1000 rootless user

- [#387](https://github.com/papra-hq/papra/pull/387) [`73b8d08`](https://github.com/papra-hq/papra/commit/73b8d080765b6eb9b479db39740cdc6972f6585d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added configuration for the ocr language using DOCUMENTS_OCR_LANGUAGES

- [#377](https://github.com/papra-hq/papra/pull/377) [`205c6cf`](https://github.com/papra-hq/papra/commit/205c6cfd461fa0020a93753571f886726ddfdb57) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improve file preview for text-like files (.env, yaml, extension-less text files,...)

- [#393](https://github.com/papra-hq/papra/pull/393) [`aad36f3`](https://github.com/papra-hq/papra/commit/aad36f325296548019148bc4e32782fe562fd95b) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix weird centering in document page for long filenames

- [#394](https://github.com/papra-hq/papra/pull/394) [`f28d824`](https://github.com/papra-hq/papra/commit/f28d8245bf385d7be3b3b8ee449c3fdc88fa375c) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added the possibility to disable login via email, to support sso-only auth

- [#405](https://github.com/papra-hq/papra/pull/405) [`3401cfb`](https://github.com/papra-hq/papra/commit/3401cfbfdc7e280d2f0f3166ceddcbf55486f574) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Introduce APP_BASE_URL to mutualize server and client base url

- [#346](https://github.com/papra-hq/papra/pull/346) [`c54a71d`](https://github.com/papra-hq/papra/commit/c54a71d2c5998abde8ec78741b8c2e561203a045) Thanks [@blstmo](https://github.com/blstmo)! - Fixes 400 error when submitting tags with uppercase hex colour codes.

- [#408](https://github.com/papra-hq/papra/pull/408) [`09e3bc5`](https://github.com/papra-hq/papra/commit/09e3bc5e151594bdbcb1f9df1b869a78e583af3f) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added Romanian (ro) translation

- [#383](https://github.com/papra-hq/papra/pull/383) [`0b276ee`](https://github.com/papra-hq/papra/commit/0b276ee0d5e936fffc1f8284c654a8ada0efbafb) Thanks [@LMArantes](https://github.com/LMArantes)! - Added Brazilian Portuguese (pt-BR) language support

- [#399](https://github.com/papra-hq/papra/pull/399) [`47b69b1`](https://github.com/papra-hq/papra/commit/47b69b15f4f711e47421fc21a3ac447824d67642) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix back to organization link in organization settings

- [#403](https://github.com/papra-hq/papra/pull/403) [`1711ef8`](https://github.com/papra-hq/papra/commit/1711ef866d0071a804484b3e163a5e2ccbcec8fd) Thanks [@Icikowski](https://github.com/Icikowski)! - Added Polish (pl) language support

- [#379](https://github.com/papra-hq/papra/pull/379) [`6cedc30`](https://github.com/papra-hq/papra/commit/6cedc30716e320946f79a0a9fd8d3b26e834f4db) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Updated dependencies

- [#411](https://github.com/papra-hq/papra/pull/411) [`2601566`](https://github.com/papra-hq/papra/commit/26015666de197827a65a5bebf376921bbfcc3ab8) Thanks [@4DRIAN0RTIZ](https://github.com/4DRIAN0RTIZ)! - Added Spanish (es) translation

- [#391](https://github.com/papra-hq/papra/pull/391) [`40a1f91`](https://github.com/papra-hq/papra/commit/40a1f91b67d92e135d13dfcd41e5fd3532c30ca5) Thanks [@itsjuoum](https://github.com/itsjuoum)! - Added European Portuguese (pt) translation

- [#378](https://github.com/papra-hq/papra/pull/378) [`f1e1b40`](https://github.com/papra-hq/papra/commit/f1e1b4037b31ff5de1fd228b8390dd4d97a8bda8) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added tag color swatches and picker

## 0.6.3

### Patch Changes

- [#357](https://github.com/papra-hq/papra/pull/357) [`585c53c`](https://github.com/papra-hq/papra/commit/585c53cd9d0d7dbd517dbb1adddfd9e7b70f9fe5) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added a /llms.txt on main website

- [#366](https://github.com/papra-hq/papra/pull/366) [`b8c2bd7`](https://github.com/papra-hq/papra/commit/b8c2bd70e3d0c215da34efcdcdf1b75da1ed96a1) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Allow for adding/removing tags to document using api keys

- [#359](https://github.com/papra-hq/papra/pull/359) [`0c2cf69`](https://github.com/papra-hq/papra/commit/0c2cf698d1a9e9a3cea023920b10cfcd5d83be14) Thanks [@Mavv3006](https://github.com/Mavv3006)! - Add German translation

## 0.6.2

### Patch Changes

- [#337](https://github.com/papra-hq/papra/pull/337) [`1c574b8`](https://github.com/papra-hq/papra/commit/1c574b8305eb7bde4f1b75ac38a610ca0120a613) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Ensure database directory exists when running scripts (like migrations)

- [#333](https://github.com/papra-hq/papra/pull/333) [`ff830c2`](https://github.com/papra-hq/papra/commit/ff830c234a02ddb4cbc480cf77ef49b8de35fbae) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed version release link

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

### Patch Changes

- [#309](https://github.com/papra-hq/papra/pull/309) [`d4f72e8`](https://github.com/papra-hq/papra/commit/d4f72e889a4d39214de998942bc0eb88cd5cee3d) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Disable "Manage subscription" from organization setting by default

- [#308](https://github.com/papra-hq/papra/pull/308) [`759a3ff`](https://github.com/papra-hq/papra/commit/759a3ff713db8337061418b9c9b122b957479343) Thanks [@CorentinTh](https://github.com/CorentinTh)! - I18n: full support for French language

- [#312](https://github.com/papra-hq/papra/pull/312) [`e5ef40f`](https://github.com/papra-hq/papra/commit/e5ef40f36c27ea25dc8a79ef2805d673761eec2a) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fixed an issue with the reset-password page navigation guard that prevented reset

## 0.5.1

### Patch Changes

- [#302](https://github.com/papra-hq/papra/pull/302) [`b62ddf2`](https://github.com/papra-hq/papra/commit/b62ddf2bc4d1b134b14c847ffa30b65cb29489af) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Set email setting to dry-run by default in docker

## 0.5.0

### Minor Changes

- [#295](https://github.com/papra-hq/papra/pull/295) [`438a311`](https://github.com/papra-hq/papra/commit/438a31171c606138c4b7fa299fdd58dcbeaaf298) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for custom oauth2 providers

- [#294](https://github.com/papra-hq/papra/pull/294) [`b400b3f`](https://github.com/papra-hq/papra/commit/b400b3f18ddbeff33f8265f128d4bc8b67b27d77) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Ensure local database directory en boot

- [#291](https://github.com/papra-hq/papra/pull/291) [`0627ec2`](https://github.com/papra-hq/papra/commit/0627ec25a422b7b820b08740cfc2905f9c55c00e) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added invitation system to add users to an organization

### Patch Changes

- [#296](https://github.com/papra-hq/papra/pull/296) [`0ddc234`](https://github.com/papra-hq/papra/commit/0ddc2340f092cf6fe5bf2175b55fb46db7681c36) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix register page description

## 0.4.0

### Minor Changes

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly hard delete files in storage driver

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for b2 document storage

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added support for azure blob document storage

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added webhook management

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added API keys support

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added document searchable content edit

### Patch Changes

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Fix ingestion config coercion

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Added tag creation button in document page

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Improved tag selector input wrapping

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Properly handle file names without extensions

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Wrap text in document preview

- [#280](https://github.com/papra-hq/papra/pull/280) [`85fa5c4`](https://github.com/papra-hq/papra/commit/85fa5c43424d139f5c2752a3ad644082e61d3d67) Thanks [@CorentinTh](https://github.com/CorentinTh)! - Excluded deleted documents from doc count
