import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './010.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Rent receipt - March 2025',
  fileUrl,
  date: new Date('2025-03-01'),
  mimeType: 'application/pdf',
  size: 37532,
  tags: ['Receipts', 'Property'],
  content: `
rent receipt march 2025 221b baker street marylebone london nw1
6xe date 1st received from mr sherlock holmes for first
floor flat period amount 2 000 00 two thousand pounds
payment method bank transfer 28th february breakdown total paid signature
m hudson mrs martha landlord notes please remember to keep
the violin playing reasonable hours new tenants downstairs have complained
again also whatever chemical experiment you were conducting last tuesday
has stained bathroom sink h monthly 1 850 service charge
150

`.trim(),
};

export default demoDocumentFixture;
