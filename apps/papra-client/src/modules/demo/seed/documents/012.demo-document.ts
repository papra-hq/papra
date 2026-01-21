import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './012.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Violin receipt',
  fileUrl,
  date: new Date('2025-11-08'),
  mimeType: 'application/pdf',
  size: 51229,
  tags: ['Receipts'],
  content: `
violin receipt vendor information transaction details item description price quantity
customized the baker 2 500 00 1 hard case with
lock 150 tuning mute 20 bridge adjustment service 50 subtotal
720 tax 540 80 total 3 260 payment method purchase
notes custom made to specifications of our client mr sherlock
holmes features a unique pattern on its body and distinctive
sound hole design is designed for optimal protection during transportation
has been included convenience delivery items will be delivered address
221b street london w1a 5bj by courier next working day
return policy please contact us within 14 days if you
wish any due unsatisfactory quality or performance refunds issued in
full minus shipping costs incurred company name strings ltd 145
regent w1b 5sa phone number 020 7123 4567 email info
example com credit card visa exp date 02 2027

`.trim(),
};

export default demoDocumentFixture;
