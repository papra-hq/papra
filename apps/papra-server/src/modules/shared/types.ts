export type NonEmptyArray<T> = [T, ...T[]];

export type ExtendNamedArguments<Method, NewArgs extends Record<string, unknown>> = Method extends (args: infer Args) => infer Return ? (args: Args & NewArgs) => Return : never;
export type ExtendReturn<Method, NewReturn extends Record<string, unknown>> = Method extends (args: infer Args) => infer Return ? (args: Args) => Return & NewReturn : never;
export type ExtendReturnPromise<Method, NewReturn extends Record<string, unknown>> = Method extends (args: infer Args) => Promise<infer Return> ? (args: Args) => Promise<Return & NewReturn> : never;

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
