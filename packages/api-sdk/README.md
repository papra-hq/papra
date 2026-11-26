# Papra API SDK

This is a JS/TS SDK for the Papra API.
[Papra](https://papra.app) is an open-source self-hostable document archiving platform.

# Prerequisites

For API-key-enabled endpoints, create an API key in your user settings (under /api-keys). Session-only endpoints, such as the current-user endpoints, require a signed-in session instead.

## Installation

```bash
pnpm install @papra/api-sdk
# or
npm install @papra/api-sdk
# or
yarn add @papra/api-sdk
```

## Usage

```ts
import { createClient } from '@papra/api-sdk';

const client = createClient({
  // The API key can be found in your user settings (under /api-keys)
  // you may want to store this in an environment variable
  apiKey: 'ppapi_...',

  // Optional: base URL of the API
  apiBaseUrl: 'http://papra.your-instance.tld',
});

const myFile = new File(['test'], 'test.txt', { type: 'text/plain' });

await client.uploadDocument({
  file: myFile,
  organizationId: 'org_...', // The id of the organization you want to upload the document to
});
```

You can also scope the client to a specific organization:

```ts
const client = createClient({ apiKey, apiBaseUrl }).forOrganization('org_...');

await client.uploadDocument({ file });
```

## Contract-based methods

Methods are derived from the server's contract registry; adding a registry entry adds the corresponding SDK method on the next build. Migrated methods accept separate `params`, `query`, and `body` fields and return the successful response body.

For current-user endpoints, use your existing session rather than an API key:

```ts
const client = createClient({
  apiBaseUrl: 'https://papra.example',
  credentials: 'include', // Send the browser's existing session cookie.
});

const { user } = await client.getCurrentUser();
await client.updateCurrentUser({ body: { name: 'Alice' } });
```

For server-side calls, pass session cookies explicitly through `headers: { Cookie: sessionCookie }`. You can also supply a custom `fetch` implementation. The SDK does not sign users in or maintain a cookie jar.

Contract-based methods currently support JSON request/response bodies and bodyless success responses. Path and query parameters support scalar values. Other content formats are rejected when building the client. Existing handwritten methods, including multipart uploads and `forOrganization`, remain available during migration; organization scoping currently applies only to these legacy methods.

Request values use the schemas' input types and are sent without applying server-side transformations. Responses are validated with Valibot and returned as parsed schema outputs; current-user timestamps remain ISO strings.

Contract-based methods throw `ApiHttpError` for unsuccessful HTTP responses (with `status` and `data`), and `ApiResponseError` for successful responses that violate their declared status, content type, or schema. Network errors propagate from the HTTP transport. Legacy methods retain their existing `ofetch` error behavior.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.

## Community

Join the community on [Papra's Discord server](https://papra.app/discord) to discuss the project, ask questions, or get help.

## Credits

This project is crafted with ❤️ by [Corentin Thomasset](https://corentin.tech).
If you find this project helpful, please consider [supporting my work](https://buymeacoffee.com/cthmsst).
