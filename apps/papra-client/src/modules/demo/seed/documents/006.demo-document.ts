import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './006.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Receipt for Groceries',
  fileUrl,
  date: new Date('2026-01-20'),
  mimeType: 'application/pdf',
  size: 50374,
  tags: ['Receipts'],
  content: `
receipt for groceries date january 20 2026 store tesco superstore
123 regent st london sw1e 7na order number tcgro000023 item
quantity unit price subtotal bread wholemeal 2 loaves 1 40
eggs 12 pack 50 80 chicken breast fillets 500g 6
00 3 brown rice bag 25 fresh carrots 750g bunch
0 60 45 apple juice 1l bottle toothpaste colgate tubes
16 30 vat 26 total 19 56 payment method credit
card visa signature 1234 last 4 digits only of purchase
notes this has been archived in our digital document archive
future reference received a 10 discount on the bill being
frequent customer paid with my clubcard to earn points

`.trim(),
};

export default demoDocumentFixture;
