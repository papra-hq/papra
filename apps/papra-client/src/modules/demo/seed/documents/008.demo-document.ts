import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './008.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Rent receipt - July 2025',
  fileUrl,
  date: new Date('2025-07-01'),
  mimeType: 'application/pdf',
  size: 37805,
  tags: ['Receipts', 'Property'],
  content: `
rent receipt july 2025 221b baker street marylebone london nw1
6xe date 1st received from mr sherlock holmes for first
floor flat period amount 2 000 00 two thousand pounds
payment method bank transfer 30th june breakdown total paid signature
m hudson mrs martha landlord notes the windows will need
washing after whatever smoke came your chemistry set last tuesday
i ve scheduled a cleaner next week please try to
keep explosions minimum during tourist season h monthly 1 850
service charge 150

`.trim(),
};

export default demoDocumentFixture;
