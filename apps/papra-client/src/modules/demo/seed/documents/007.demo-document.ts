import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './007.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Rent receipt - April 2025',
  fileUrl,
  date: new Date('2025-04-01'),
  mimeType: 'application/pdf',
  size: 38421,
  tags: ['Receipts', 'Property'],
  content: `
rent receipt april 2025 221b baker street marylebone london nw1
6xe date 1st received from mr sherlock holmes for first
floor flat period amount 2 000 00 two thousand pounds
payment method bank transfer 29th march breakdown total paid signature
m hudson mrs martha landlord notes thank you finally fixing
the bullet holes in wall though i do wish d
asked before repainting that shade of green is rather unusual
also dr watson left his umbrella last visit h monthly
1 850 service charge 150

`.trim(),
};

export default demoDocumentFixture;
