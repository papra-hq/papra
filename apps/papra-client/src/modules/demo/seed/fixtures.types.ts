import type { DemoTagFixtureNames } from './tags.fixtures';

export type DemoDocumentFixture = {
  name: string;
  date: Date;
  fileUrl: string;
  content: string;
  tags: DemoTagFixtureNames[];
  mimeType: string;
  size: number;
};
