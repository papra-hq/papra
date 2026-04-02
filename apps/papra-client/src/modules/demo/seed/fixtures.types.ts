import type { DemoCustomPropertyDefinitionFixture } from './custom-property-definitions.fixtures';
import type { DemoTagFixtureNames } from './tags.fixtures';

export type DemoDocumentCustomPropertyValue = {
  key: DemoCustomPropertyDefinitionFixture['key'];
  value: unknown;
};

export type DemoDocumentFixture = {
  name: string;
  date: Date;
  fileUrl: string;
  content: string;
  tags: DemoTagFixtureNames[];
  mimeType: string;
  size: number;
  customProperties?: DemoDocumentCustomPropertyValue[];
};
