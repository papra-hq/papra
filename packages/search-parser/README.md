# @papra/search-parser

A search query parser library for building GitHub-style search syntax with filters, logical operators, and full-text search.
You can play with the parser in the [demo application](https://search-parser.papra.app/).

## Features

- **TypeScript-first**: Fully typed API and AST structures.
- **Dependency-free**: No external dependencies, lightweight and fast.
- **Error-resilient**: Best-effort parsing with detailed issue reporting.
- **Rich syntax support**: Logical operators (AND, OR, NOT), grouping with parentheses, and field-based filters.
- **Custom operators**: Bring your own filter operators (e.g. `~` for "contains") on top of the built-in ones.
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
tag:invoice                # No explicit operator, uses the default one (same as tag:=invoice)
createdAt:>2024-01-01      # Comparison operators: >, <, >=, <=, =
```

A filter without an explicit operator means equality, unless you change `defaultOperator`. Both the operator set and that default are configurable, see [Custom Operators](#custom-operators).

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

### Custom Operators

The built-in operators are `>`, `<`, `>=`, `<=` and `=`. Pass `operators` to replace that set with your own, for instance to add a `~` "contains" operator:

```typescript
const operators = ['>=', '<=', '>', '<', '=', '~'] as const;

parseSearchQuery({ query: 'name:~invoice', operators });
// { expression: { type: 'filter', field: 'name', operator: '~', value: 'invoice' }, issues: [] }
```

The operator type is inferred from what you pass, so `expression.operator` is narrowed to `'>=' | '<=' | '>' | '<' | '=' | '~'` rather than widened to `string`.

A few things worth knowing:

- The longest matching operator always wins, so `~=` takes precedence over `~` no matter the order you declare them in.
- Operators only apply right after the colon: `name:~invoice`, not `name~invoice`.
- Operators cannot contain whitespace, parentheses or quotes, as those characters delimit tokens. Invalid operators are ignored and reported as `invalid-operator` issues rather than throwing.
- When a filter has no explicit operator (`tag:invoice`), `defaultOperator` is used. It defaults to `=` and must be one of the declared operators, so that the inferred operator type never lies about what the parser can return. Dropping `=` from the operator set therefore makes `defaultOperator` required. This is also enforced at runtime, for untyped consumers: a default operator that was not declared, or that was itself rejected, is reported as an `invalid-operator` issue and replaced by a declared one, so only declared operators ever reach the AST. The single exception is an operator set in which every entry was rejected, as no declared operator is then left to fall back to: the built-in `=` is used, and reported.

```typescript
// `tag:invoice` is treated as `tag:~invoice`
parseSearchQuery({ query: 'tag:invoice', operators: ['=', '~'], defaultOperator: '~' });
// { expression: { type: 'filter', field: 'tag', operator: '~', value: 'invoice' }, issues: [] }
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
function parseSearchQuery<const TOperator extends string = Operator>(
  options: {
    query: string;
    maxDepth?: number; // Default: 10
    maxTokens?: number; // Default: 200
    optimize?: boolean; // Default: true
  } & ('=' extends TOperator
    ? // Default: ['>=', '<=', '>', '<', '='] and '='
      { operators?: readonly TOperator[]; defaultOperator?: NoInfer<TOperator> }
    : // `=` is not a declared operator, so there is no sound default to fall back to
      { operators: readonly TOperator[]; defaultOperator: NoInfer<TOperator> }),
): ParsedQuery<TOperator>;

type ParsedQuery<TOperator extends string = Operator> = {
  expression: Expression<TOperator>;
  issues: Issue[];
};

type Operator = '>' | '<' | '>=' | '<=' | '=';
```

The AST types (`Expression`, `FilterExpression`, `AndExpression`, ...) all take an optional operator type argument that defaults to the built-in `Operator` union, so they can be used without a type argument when you stick to the built-in operators.

The built-in defaults are also exported, to extend them rather than restate them:

```typescript
import { DEFAULT_OPERATOR, DEFAULT_OPERATORS } from '@papra/search-parser';

parseSearchQuery({ query: 'name:~invoice', operators: [...DEFAULT_OPERATORS, '~'] });
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
