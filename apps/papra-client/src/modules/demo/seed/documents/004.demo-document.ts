import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './004.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Dr Watson letter - Missing heirloom',
  fileUrl,
  date: new Date('2026-01-20'),
  mimeType: 'application/pdf',
  size: 31307,
  tags: ['Personal', 'Cases'],
  content: `
dr watson letter missing heirloom from john jwatson example com
to sherlock holmes sherlockholmes date 20 january 2026 subject the
curious case of dear i hope this finds you well
am writing my office at st bart s hospital where
have been observing a most peculiar lady emily windsor prominent
socialite and cousin royal family has approached me with request
for assistance it appears that her priceless diamond necklace passed
down through generations gone was last seen during christmas gathering
their estate in countryside is frantic as holds significant historical
sentimental value believes theft may be linked recent string high
profile burglaries area she reason believe notorious thief known only
by his alias fox behind working personal investigator gather evidence
track leads however could do your exceptional skills shed some
light on unique expertise forensic analysis cryptography deduction would invaluable
uncovering truth dastardly crime willing take join tomorrow morning attached
few details regarding investigation so far looking forward hearing soon
best regards

`.trim(),
};

export default demoDocumentFixture;
