# @papra/search-parser

A search query parser library for building GitHub-style search syntax with filters, logical operators, and full-text search.

## Features

- **Full-text search**: Extract search terms from queries
- **Filters**: Support for field:value syntax with multiple operators (=, >, <, >=, <=)
- **Logical operators**: AND, OR, NOT with proper precedence
- **Grouping**: Parentheses for controlling evaluation order
- **Negation**: Both `-filter:value` and `NOT filter:value` syntax
- **Quoted values**: Support for spaces in filter values and search terms
- **Escape sequences**: Escape quotes and colons with backslash
- **Configurable limits**: Max depth and token count for safety
- **Graceful error handling**: Best-effort parsing with issue reporting
- **Zero dependencies**: No runtime dependencies
- **Universal**: Works in Node.js, browsers, Deno, Cloudflare Workers, etc.
- **Type-safe**: Fully typed with TypeScript

## Installation

```bash
npm install @papra/search-parser
# or
pnpm add @papra/search-parser
# or
yarn add @papra/search-parser
```

## Usage

```typescript
import { parseSearchQuery } from '@papra/search-parser';

// Simple full-text search
const result1 = parseSearchQuery({ query: 'my invoice' });
// {
//   expression: { type: 'and', operands: [] },
//   search: 'my invoice',
//   issues: []
// }

// Filter with equality
const result2 = parseSearchQuery({ query: 'tag:invoice' });
// {
//   expression: {
//     type: 'filter',
//     field: 'tag',
//     operator: '=',
//     value: 'invoice'
//   },
//   search: undefined,
//   issues: []
// }

// Complex query with operators and grouping
const result3 = parseSearchQuery({
  query: '(tag:invoice OR tag:receipt) AND createdAt:>2024-01-01'
});
// {
//   expression: {
//     type: 'and',
//     operands: [
//       {
//         type: 'or',
//         operands: [
//           { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//           { type: 'filter', field: 'tag', operator: '=', value: 'receipt' }
//         ]
//       },
//       { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' }
//     ]
//   },
//   search: undefined,
//   issues: []
// }
```

## Query Syntax

### Full-text Search

```
my invoice
"my special invoice"    # Quoted for multi-word terms
"my \"special\" invoice" # Escaped quotes
```

### Filters

```
tag:invoice                # Equality (implicit)
tag:=invoice               # Equality (explicit)
createdAt:>2024-01-01      # Greater than
createdAt:<2024-12-31      # Less than
createdAt:>=2024-01-01     # Greater than or equal
createdAt:<=2024-12-31     # Less than or equal
```

### Quoted Filter Values

```
tag:"my invoices"                  # Spaces in value
tag:"my \"special\" invoices"      # Escaped quotes in value
tag:my\:\:special\:\:tag          # Escaped colons in value
```

### Logical Operators

```
tag:invoice AND status:active      # Explicit AND
tag:invoice status:active          # Implicit AND
tag:invoice OR tag:receipt         # OR
NOT tag:personal                   # NOT
tag:invoice OR tag:receipt AND status:active  # Precedence: AND > OR
```

### Negation

```
-tag:personal                      # Minus prefix
NOT tag:personal                   # NOT keyword
NOT (tag:personal OR tag:private)  # Negated group
```

### Grouping

```
(tag:invoice OR tag:receipt)
(tag:invoice OR tag:receipt) AND status:active
```

### Combining Filters and Search

```
tag:invoice my document            # Filter + search
foo tag:invoice bar                # Search terms can be anywhere
```

### Escaping

```
tag\:invoice                       # Escape colon to prevent filter parsing
                                   # Results in search text "tag:invoice"
```

## API

### parseSearchQuery

```typescript
function parseSearchQuery(options: {
  query: string;
  maxDepth?: number;    // Default: 10
  maxTokens?: number;   // Default: 200
}): ParsedQuery;
```

## Operator Precedence

From highest to lowest:

1. **NOT** (highest)
2. **AND**
3. **OR** (lowest)

Use parentheses to override precedence:

```
tag:invoice OR tag:receipt AND status:active
# Parsed as: tag:invoice OR (tag:receipt AND status:active)

(tag:invoice OR tag:receipt) AND status:active
# Parsed as: (tag:invoice OR tag:receipt) AND status:active
```

## Error Handling

### Issue Structure

All parsing issues are returned with both a machine-readable error code and a human-readable message:

```typescript
type Issue = {
  code: string;      // Machine-readable error code
  message: string;   // Human-readable error message
};
```

### Error Codes

The library exports an `ERROR_CODES` constant with all available error codes:

```typescript
import { ERROR_CODES } from '@papra/search-parser';

const result = parseSearchQuery({ query: '(tag:invoice' });

// Check for specific error by code
const hasUnmatchedParen = result.issues.some(
  issue => issue.code === ERROR_CODES.UNMATCHED_OPENING_PARENTHESIS
);
```

Available error codes are defined in [`src/errors.ts`](src/errors.ts).

## Safety Features

### Maximum Depth

Prevents deeply nested expressions (e.g., excessive parentheses):

```typescript
parseSearchQuery({
  query: '((((((((((tag:invoice))))))))))',
  maxDepth: 5  // Will report issue if exceeded
});
```

### Maximum Tokens

Prevents excessively long queries:

```typescript
parseSearchQuery({
  query: 'tag1:val1 tag2:val2 ... tag100:val100',
  maxTokens: 50  // Will report issue if exceeded
});
```

### Graceful Error Handling

Malformed queries are handled gracefully with best-effort parsing:

```typescript
parseSearchQuery({ query: '(tag:invoice' });
// {
//   expression: { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//   search: undefined,
//   issues: [
//     {
//       code: 'unmatched-opening-parenthesis',
//       message: 'Unmatched opening parenthesis'
//     }
//   ]
// }
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.
