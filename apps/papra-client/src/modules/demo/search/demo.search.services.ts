import type { AndExpression, Expression, FilterExpression, NotExpression, OrExpression, TextExpression } from '@papra/search-parser';
import type { Document } from '../../documents/documents.types';
import { parseSearchQuery } from '@papra/search-parser';

type DocumentCondition = (params: { document: Document }) => boolean;

const falseCondition: DocumentCondition = () => false;

export function someCorpusTokenStartsWith({ corpus, prefix }: { corpus: string | string []; prefix: string }): boolean {
  const lowerPrefix = prefix.toLowerCase();
  const corpusString = Array.isArray(corpus) ? corpus.join(' ') : corpus;
  const prefixLength = lowerPrefix.length;

  return corpusString
    .split(/[\W_]+/)
    .some(token =>
      token.length >= prefixLength // early exit for faster checks
      && token.toLowerCase().startsWith(lowerPrefix),
    );
}

function buildTextCondition({ expression }: { expression: TextExpression }): DocumentCondition {
  const searchText = expression.value.trim().toLowerCase();

  return ({ document }) => someCorpusTokenStartsWith({ corpus: [document.name, document.content], prefix: searchText });
}

function buildAndCondition({ expression }: { expression: AndExpression }): DocumentCondition {
  const conditions = expression.operands.map(operand => buildExpressionCondition({ expression: operand }));

  return ({ document }) => conditions.every(condition => condition({ document }));
}

function buildOrCondition({ expression }: { expression: OrExpression }): DocumentCondition {
  const conditions = expression.operands.map(operand => buildExpressionCondition({ expression: operand }));

  return ({ document }) => conditions.some(condition => condition({ document }));
}

function buildNotCondition({ expression }: { expression: NotExpression }): DocumentCondition {
  const condition = buildExpressionCondition({ expression: expression.operand });

  return ({ document }) => !condition({ document });
}

function buildTagFilterCondition({ expression }: { expression: FilterExpression }): DocumentCondition {
  const { value, operator } = expression;

  if (operator !== '=') {
    return falseCondition;
  }

  return ({ document }) => document.tags.find(tag => tag.name.toLowerCase() === value.toLowerCase() || tag.id === value) !== undefined;
}

function buildNameFilterCondition({ expression }: { expression: FilterExpression }): DocumentCondition {
  const { value, operator } = expression;

  if (operator !== '=') {
    return falseCondition;
  }

  return ({ document }) => someCorpusTokenStartsWith({ corpus: document.name, prefix: value });
}

function buildContentFilterCondition({ expression }: { expression: FilterExpression }): DocumentCondition {
  const { value, operator } = expression;

  if (operator !== '=') {
    return falseCondition;
  }

  return ({ document }) => someCorpusTokenStartsWith({ corpus: document.content, prefix: value });
}

function buildCreatedFilterCondition({ expression }: { expression: FilterExpression }): DocumentCondition {
  const { value, operator } = expression;
  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return () => false;
  }

  return ({ document }) => {
    const documentDate = new Date(document.createdAt);

    switch (operator) {
      case '=': return documentDate.toDateString() === dateValue.toDateString();
      case '<': return documentDate < dateValue;
      case '<=': return documentDate <= dateValue;
      case '>': return documentDate > dateValue;
      case '>=': return documentDate >= dateValue;
      default: return false;
    }
  };
}

function buildHasTagsFilter({ expression }: { expression: FilterExpression }): DocumentCondition {
  const { operator } = expression;

  if (operator !== '=') {
    return falseCondition;
  }

  return ({ document }) => document.tags.length > 0;
}

function buildExpressionCondition({ expression }: { expression: Expression }): DocumentCondition {
  switch (expression.type) {
    case 'text': return buildTextCondition({ expression });
    case 'and': return buildAndCondition({ expression });
    case 'or': return buildOrCondition({ expression });
    case 'not': return buildNotCondition({ expression });
    case 'filter':
      switch (expression.field) {
        case 'tag': return buildTagFilterCondition({ expression });
        case 'name': return buildNameFilterCondition({ expression });
        case 'content': return buildContentFilterCondition({ expression });
        case 'created': return buildCreatedFilterCondition({ expression });
        case 'has':
          switch (expression.value) {
            case 'tags': return buildHasTagsFilter({ expression });
            default: return falseCondition;
          }
        default: return falseCondition;
      }
    case 'empty': return falseCondition;
    default: return falseCondition;
  }
}

export function searchDemoDocuments({ query, documents }: { query: string; documents: Document[] }) {
  if (query.trim() === '') {
    return documents;
  }

  const { expression } = parseSearchQuery({ query });

  const condition = buildExpressionCondition({ expression });

  return documents.filter(document => condition({ document }));
}
