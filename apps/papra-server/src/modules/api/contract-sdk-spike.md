# Contract-based API SDK spike

This document tracks the incremental exploration of a contract-based, type-safe API SDK.

## Current decisions

- Keep endpoint contracts colocated with their routes.
- Do not introduce a dedicated contract package.
- Keep contracts independent from Hono and other server-only modules.
- Use Hono's registration API through a small server adapter.
- Support JSON requests and responses only during the spike.
- Contract schemas may accept convenient handler values, but their output describes the JSON wire representation.
- Initially support path params, query params, optional JSON bodies, and status-discriminated responses.

## Progress

- [x] 0. Define the spike scope
- [x] 1. Harden server registration
- [x] 2. Define schema and serialization semantics
- [x] 3. Clarify inferred server and client types
- [ ] 4. Add framework-independent URL construction
- [ ] 5. Implement a minimal generic client
- [ ] 6. Define error semantics
- [ ] 7. Test a representative vertical slice
- [ ] 8. Add SDK ergonomics
- [ ] 9. Evaluate the spike
- [ ] 10. Consider deferred production concerns

## Validation commands

From the monorepo root

```sh
# Typecheck / lint / format
pnpm check

# Run all tests
pnpm test

# Run a single test file
pnpm test path/to/test/file.test.ts
```

## 0. Define the spike scope

The spike currently supports:

- JSON request and response bodies
- Hono route registration
- Colocated endpoint contracts
- Path parameters
- Query parameters
- Optional request bodies
- Status-discriminated JSON responses

The following are deferred:

- Multipart and form-data requests
- File, stream, and text responses
- Response headers and cookies
- Bodyless responses such as `204`
- OpenAPI generation
- SDK code generation and publishing
- Contract package extraction
- Router performance work

## 1. Harden server registration

Status: **complete**

Implemented behavior:

- Raw JSON is parsed only when the endpoint declares a body schema.
- A request without a JSON payload is represented as an empty object so schema defaults and validation can run.
- Malformed JSON returns a standardized `400` response.
- Invalid params, query values, and bodies return standardized validation responses.
- Validation failures do not invoke the endpoint handler.
- Multiple Hono middlewares execute in registration order around the handler.
- Handler responses are checked against the schema declared for their status code.

Covered cases:

- Bodyless GET endpoint
- Empty body with schema defaults
- Missing required body
- Malformed JSON
- Invalid path params
- Invalid query params
- Invalid request body
- Middleware ordering
- Successful registration and invocation

## 2. Define schema and serialization semantics

Status: **complete**

Contract schema outputs describe JSON values on the wire. Schema inputs may additionally accept convenient values used by handlers, as long as parsing normalizes them to the documented wire representation.

The reusable `isoDateTimeSchema` accepts either a `Date` or an ISO timestamp string and always outputs an ISO timestamp string:

```ts
export const isoDateTimeSchema = v.pipe(
  v.union([v.string(), v.date()]),
  v.transform((value) => (value instanceof Date ? value.toISOString() : value)),
  v.string(),
  v.isoTimestamp(),
  v.metadata({
    description: 'An ISO 8601 timestamp.',
    examples: ['2025-01-01T00:00:00.000Z'],
  }),
);
```

This gives handlers a convenient input type while keeping the client-facing output JSON-safe:

```ts
type Input = v.InferInput<typeof isoDateTimeSchema>; // string | Date
type Output = v.InferOutput<typeof isoDateTimeSchema>; // string
```

The explicit `v.string()` after the transform allows `@valibot/to-json-schema` to document the output with `typeMode: 'output'`. Together with `v.isoTimestamp()` and metadata, it produces an OpenAPI schema with `type: 'string'`, `format: 'date-time'`, a description, and examples.

Implemented behavior:

- Dates returned by handlers are normalized before JSON serialization.
- Existing ISO timestamp strings pass through unchanged.
- Invalid strings and invalid `Date` instances are rejected.
- Serialized output can be parsed again by the same schema on the client.
- Input and output types are covered by compile-time assertions.
- JSON Schema output is covered by a test.
- User endpoint contracts use the reusable schema for `createdAt` and `updatedAt`.

## 3. Clarify inferred server and client types

Status: **complete**

The contract exposes explicit types for each side of the request and response boundary:

```ts
InferServerRequest<Contract>;
InferClientRequest<Contract>;
InferServerResponse<Contract>;
InferClientResponse<Contract>;
```

Request schemas parse values in the direction of the server handler:

- `InferClientRequest` uses schema inputs for values supplied by an SDK caller.
- `InferServerRequest` uses schema outputs for values received by a handler after validation and transformation.

Response schemas parse values in the direction of the SDK caller:

- `InferServerResponse` uses schema inputs for convenient values returned by a handler.
- `InferClientResponse` uses normalized schema outputs returned to the caller.

Status-specific `InferServerResponseBody` and `InferClientResponseBody` helpers are also available.

Request sections that are not declared by a contract use optional `never` properties. This rejects bodies, params, or query values that the endpoint does not accept while allowing those sections to be omitted.

Compile-time coverage verifies:

- Required request bodies
- Rejection of bodies on bodyless endpoints
- Request schema input and output transformations
- Multiple response statuses
- Status/body correlation
- Rejection of undeclared statuses
- Response normalization from `Date | string` to an ISO timestamp string

## 4. Add framework-independent URL construction

Implement URL construction from an endpoint contract and request arguments.

It should:

- Replace and encode path parameters
- Serialize query parameters
- Detect missing path parameters
- Avoid unresolved `:param` segments
- Remain independent from Hono

## 5. Implement a minimal generic client

Start with a generic function rather than the final SDK API:

```ts
callEndpoint({
  contract,
  baseUrl,
  fetch,
  request: { params, query, body },
});
```

It should construct the request, call `fetch`, select the response schema by status, validate the response, and return a status-discriminated result.

Avoid proxies, generated namespaces, and publishing at this stage.

## 6. Define error semantics

Decide how the client handles non-success responses:

- Return declared errors as status-discriminated results, or
- Throw a typed `ApiError` for non-success responses.

The initial proposal is to throw for global errors such as authentication, request validation, unknown routes, and internal failures, while allowing explicitly actionable error statuses in endpoint contracts.

Cover at least:

- Validation errors
- Authentication errors
- Undeclared response statuses
- Malformed or contract-invalid responses

## 7. Test a representative vertical slice

Exercise the complete server-to-client path with:

1. A bodyless authenticated GET endpoint
2. An authenticated endpoint with a JSON body
3. An endpoint with path and query parameters

The tests should cover server registration, runtime validation, URL construction, client parsing, and type inference together.

## 8. Add SDK ergonomics

Once the generic client is stable, explore an API such as:

```ts
client.users.getCurrentUser();
client.users.updateCurrentUser({ body: { name } });
```

Use the colocated `apiContract` registry as the source of endpoint names and types.

## 9. Evaluate the spike

Before migrating more routes, evaluate:

- Boilerplate per endpoint
- Quality of inferred types and compiler errors
- Runtime validation behavior
- Serialization friction
- Error-handling ergonomics
- Client bundle implications
- Whether direct contract consumption or generated output is preferable

## 10. Consider deferred production concerns

Only after validating the approach, consider:

- Contract distribution or SDK generation
- OpenAPI generation
- Reusable common schemas
- Multipart and file handling
- Non-JSON and bodyless responses
- Headers and cookies
- Contract versioning
- Performance benchmarking
- Broader API migration
