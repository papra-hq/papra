---
'@papra/search-parser': minor
---

Added support for custom filter operators. Pass `operators` to `parseSearchQuery` to replace the built-in `>`, `<`, `>=`, `<=` and `=` set with your own, for instance to add a `~` "contains" operator:

```typescript
parseSearchQuery({ query: 'name:~invoice', operators: [...DEFAULT_OPERATORS, '~'] });
// { expression: { type: 'filter', field: 'name', operator: '~', value: 'invoice' }, issues: [] }
```

The operator type is inferred from the operators you declare, so `expression.operator` stays narrowed instead of widening to `string`. The longest matching operator always wins, and operators that cannot be tokenized (containing whitespace, parentheses or quotes) are ignored and reported as `invalid-operator` issues. `defaultOperator` controls what a filter without an explicit operator (`tag:invoice`) means; it defaults to `=`, and becomes required when `=` is not part of the declared operators.

The AST types now take an optional operator type argument that defaults to the built-in `Operator` union, so existing usage is unaffected.
