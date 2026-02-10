export type StoragePatternInterpolationContext = {
  document: {
    id: string;
    name: string;
    createdAt: Date;
  };
  organization: {
    id: string;
  };
  now: Date;
};

export type StoragePatternExpressionTransformer = (args: { value: unknown; args?: string[] }) => string;
