# @papra/search-parser

A search query parser library for building GitHub-style search syntax with filters, logical operators, and full-text search.
You can play with the parser in the [demo application](https://search-parser.papra.app/).

## Features
- **TypeScript-first**: Fully typed API and AST structures.
- **Dependency-free**: No external dependencies, lightweight and fast.
- **Error-resilient**: Best-effort parsing with detailed issue reporting.
- **Rich syntax support**: Logical operators (AND, OR, NOT), grouping with parentheses, and field-based filters.
- **Configurable limits**: Control maximum depth and token count to prevent abuse.
- **Optimization**: Simplifies the parsed expression tree by removing redundancies, and basic boolean algebra simplifications.

## Installation

```bash
pnpm add @papra/search-parser
# or
npm install @papra/search-parser
# or
yarn add @papra/search-parser
```

## Usage

```typescript
import { parseSearchQuery } from '@papra/search-parser';

// Simple text search
parseSearchQuery({ query: 'foobar' });
// { expression: { type: 'text', value: 'foobar' }, issues: [] }

// Filter query
parseSearchQuery({ query: 'tag:invoice' });
// { expression: { type: 'filter', field: 'tag', operator: '=', value: 'invoice' }, issues: [] }

// Complex query with operators
parseSearchQuery({ query: '(tag:invoice OR tag:receipt) AND createdAt:>2024-01-01' });
// {
//   expression: {
//     type: 'and',
//     operands: [
//       {
//         type: 'or',
//         operands: [
//           { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//           { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
//         ],
//       },
//       { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' },
//     ],
//   },
//   issues: [],
// }
```

## Query Syntax

### Text Search
```
my invoice
"quoted text"
```

### Filters
```
tag:invoice                # Equality (same as tag:=invoice)
createdAt:>2024-01-01      # Comparison operators: >, <, >=, <=, =
```

### Logical Operators
```
tag:invoice AND status:active
tag:invoice OR tag:receipt
NOT tag:personal
-tag:personal              # Negation shorthand
```

### Grouping
```
(tag:invoice OR tag:receipt) AND status:active
```

### Optimization
You can enable optimization to simplify the parsed expression tree:

```typescript
// The query has redundant ANDs and double negations
const query = 'tag:invoice AND (tag:receipt AND (tag:invoice AND NOT (NOT foo)))';

parseSearchQuery({ query, optimize: false });
// {
//   expression: {
//     type: 'and',
//     operands: [
//       { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//       {
//         type: 'and',
//         operands: [
//           { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
//           {
//             type: 'and',
//             operands: [
//               { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//               {
//                  type: 'not',
//                  operand: {
//                   type: 'not',
//                   operand: { type: 'text', value: 'foo' },
//                 },
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
//   issues: [],
// }

parseSearchQuery({ query, optimize: true });
// {
//   expression: {
//     type: 'and',
//     operands: [
//       { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
//       { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
//       { type: 'text', value: 'foo' },
//     ],
//   },
//   issues: [],
// }

```


## API

```typescript
function parseSearchQuery(options: {
  query: string;
  maxDepth?: number;    // Default: 10
  maxTokens?: number;   // Default: 200
  optimize?: boolean;   // Default: true
}): ParsedQuery;

type ParsedQuery = {
  expression: Expression;
  issues: Issue[];
};
```

## Error Handling

The parser returns issues for malformed queries while doing best-effort parsing:

```typescript
import { ERROR_CODES } from '@papra/search-parser';

const result = parseSearchQuery({ query: '(tag:invoice' });
// {
//   expression: { type: 'filter', ... },
//   issues: [{ code: 'unmatched-opening-parenthesis', message: '...' }]
// }
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Credits

This project is crafted with ❤️ by [Corentin Thomasset](https://corentin.tech).
If you find this project helpful, please consider [supporting my work](https://buymeacoffee.com/cthmsst).
