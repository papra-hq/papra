---
"@papra/app": patch
---

Custom property definition deletion endpoint (`DELETE /api/organizations/:organizationId/custom-properties/:propertyDefinitionId`) now returns a 204 with no body instead of a 200 with an empty object.
