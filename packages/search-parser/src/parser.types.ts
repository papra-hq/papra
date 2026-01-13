export type Issue = {
  message: string;
  code: string;
};

export type ParsedQuery = {
  expression: Expression;
  issues: Issue[];
};

export type Expression
  = | AndExpression
    | OrExpression
    | NotExpression
    | FilterExpression
    | TextExpression
    | EmptyExpression;

export type EmptyExpression = {
  type: 'empty';
};

export type AndExpression = {
  type: 'and';
  operands: Expression[];
};

export type OrExpression = {
  type: 'or';
  operands: Expression[];
};

export type NotExpression = {
  type: 'not';
  operand: Expression;
};

export type Operator = '>' | '<' | '>=' | '<=' | '=';

export type FilterExpression = {
  type: 'filter';
  field: string;
  operator: Operator;
  value: string;
};

export type TextExpression = {
  type: 'text';
  value: string;
};
