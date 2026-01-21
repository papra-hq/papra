import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './011.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Rent receipt - May 2025',
  fileUrl,
  date: new Date('2025-05-01'),
  mimeType: 'application/pdf',
  size: 38711,
  tags: ['Receipts', 'Property'],
  content: `
rent receipt may 2025 221b baker street marylebone london nw1
6xe date 1st received from mr sherlock holmes for first
floor flat period amount 2 000 00 two thousand pounds
payment method bank transfer 29th april breakdown total paid signature
m hudson mrs martha landlord notes the postman mentioned he
s been bringing rather a lot of parcels marked fragile
chemical supplies i trust you re being careful also early
this month much appreciated h monthly 1 850 service charge
150

`.trim(),
};

export default demoDocumentFixture;
