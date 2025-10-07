export type PendingChangelogEntry = {
  type: string;
  content: string;
  isBreaking: boolean;
};

export type ChangelogEntry = PendingChangelogEntry & {
  version: string;
  createdAt: string;
  pr?: number;
  author?: string;
};
