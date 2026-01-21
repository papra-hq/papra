import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './009.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Rent receipt - June 2025',
  fileUrl,
  date: new Date('2025-06-01'),
  mimeType: 'application/pdf',
  size: 37851,
  tags: ['Receipts', 'Property'],
  content: `
rent receipt june 2025 221b baker street marylebone london nw1
6xe date 1st received from mr sherlock holmes for first
floor flat period amount 2 000 00 two thousand pounds
payment method bank transfer 30th may breakdown total paid signature
m hudson mrs martha landlord notes i ve taken the
liberty of stocking kitchen with proper tea and biscuits you
really must eat something besides whatever experimental substances keep in
test tubes your brother mycroft stopped by asking after h
monthly 1 850 service charge 150

`.trim(),
};

export default demoDocumentFixture;
