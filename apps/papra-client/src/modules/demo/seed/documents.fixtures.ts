import type { DemoDocumentFixture } from './fixtures.types';

const documentsFixtures = import.meta.glob('./documents/*.demo-document.ts', { eager: true }) as Record<string, { default: DemoDocumentFixture }>;

export const documentFixtures = Object.values(documentsFixtures).map(module => module.default);
