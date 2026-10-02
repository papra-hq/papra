export type Issue = {
  message: string;
  code: string;
};

export type ParsedQuery<TOperator extends string = Operator> = {
  expression: Expression<TOperator>;
  issues: Issue[];
};

export type Expression<TOperator extends string = Operator> =
  | AndExpression<TOperator>
  | OrExpression<TOperator>
  | NotExpression<TOperator>
  | FilterExpression<TOperator>
  | TextExpression
  | EmptyExpression;

export type EmptyExpression = {
  type: 'empty';
};

export type AndExpression<TOperator extends string = Operator> = {
  type: 'and';
  operands: Expression<TOperator>[];
};

export type OrExpression<TOperator extends string = Operator> = {
  type: 'or';
  operands: Expression<TOperator>[];
};

export type NotExpression<TOperator extends string = Operator> = {
  type: 'not';
  operand: Expression<TOperator>;
};

export type Operator = '>' | '<' | '>=' | '<=' | '=';

export type FilterExpression<TOperator extends string = Operator> = {
  type: 'filter';
  field: string;
  operator: TOperator;
  value: string;
};

export type TextExpression = {
  type: 'text';
  value: string;
};
