---
"@papra/app": patch
---

Switched the app configuration validation library to `valibot`. Config validation is now a bit stricter, with slightly different error messages.

- Boolean env variables previously considered non-truthy values as `false`. Now they will throw a validation error if the value is not a valid boolean-ish value
- `AUTH_PROVIDERS_CUSTOMS` json parsing now accepts only valid boolean values for the `pkce` property, while before it accepted any non-true value as `false`
- Stricter `AUTH_FORBIDDEN_EMAIL_DOMAINS` domain validation