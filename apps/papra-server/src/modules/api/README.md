# API routes

## New API definition system

Starting october 2026 we use a new contract-based system to define our API routes.

- it allows for auto generating a type-safe sdk for the api
- it opens the door for auto generating openapi documentation
- it removes the coupling with hono

**Contracts**

- define the HTTP interface: method, path, request and response schemas, and status codes
- used by the server to validate and serialize requests and responses
- used by the SDK to generate client methods and types
- defined in `*.api.contracts.ts` files, colocated within their domain feature
- `operationId` defines the public SDK method name and must be unique
- registered in the explicit `apiContracts` collection exported from `api.contracts.registry.ts`
- examples: [users](../users/users.api.contracts.ts)
- schemas for "inputs" (body, params, query, ...) can have transforms
- schemas for "outputs" (response) must result in json serializable and not depend on transforms, output as input style
- on the server, responses are not run through the schema at runtime, used only for type inference
- contracts are exported by the server and imported by the SDK package and inlined at build time, no runtime dependency on the server
- path parameter (aka params) are expected to not require encoding, only [a-zA-Z0-9_-], id style

**Routes**

- implement the business logic for a contract
- defined in `*.api.routes.ts`
- not to be confused with the legacy `*.routes.ts` files, having both help migrate incrementally
- registered in `server.api.routes.ts`
- examples: [users](../users/users.api.routes.ts)

## Legacy API routes

- defined in `*.routes.ts` files, colocated within their domain feature
- they need to be migrated to the new system, but can coexist with the new routes during migration
- migrating a route should be as-is, with no change in behavior, refining the contract is ok as long as it doesn't break the existing behavior
