import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './005.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Laptop insurance policy',
  fileUrl,
  date: new Date('2026-01-20'),
  mimeType: 'application/pdf',
  size: 52945,
  tags: ['Legal'],
  content: `
laptop insurance policy number shlpi 001 date january 20 2026
expiration 19 2027 insured information field value name sherlock holmes
address 221b baker street london uk email sholmes com phone
44 7777 123456 coverage details terms and conditions exclusions claims
procedure device apple macbook pro 16 inch valuation 10 000
deductible 500 premium 150 per annum 1 the policyholder acknowledges
that they have read understood of this 2 agrees to
maintain in good condition report any damage or loss company
within 24 hours 3 is responsible for paying additional costs
expenses associated with repairing replacing intentional caused intentionally by their
authorized users pre existing defects existed prior effective natural disasters
such as floods earthquakes hurricanes signing below i acknowledge signature
contact our department at sholmesinsurance provide proof ownership documentation supporting
claim will investigate settle accordance

`.trim(),
};

export default demoDocumentFixture;
