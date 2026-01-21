export const tagsFixtures = [
  {
    name: 'Receipts',
    color: '#10b981',
    description: 'Payment receipts and bills',
  },
  {
    name: 'Legal',
    color: '#3b82f6',
    description: 'Legal documents and contracts',
  },
  {
    name: 'Personal',
    color: '#8b5cf6',
    description: 'Personal correspondence and documents',
  },
  {
    name: 'Cases',
    color: '#ef4444',
    description: 'Investigation cases and related documents',
  },
  {
    name: 'Property',
    color: '#f59e0b',
    description: 'Property and rental documents',
  },
] as const satisfies {
  name: string;
  color: string;
  description: string;
}[];

export type DemoTagFixtureNames = (typeof tagsFixtures)[number]['name'];
