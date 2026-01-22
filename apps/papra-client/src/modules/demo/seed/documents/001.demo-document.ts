import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './001.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Blackmail letter from Reginald Thornton-Fiennes',
  fileUrl,
  date: new Date('2026-01-20'),
  mimeType: 'application/pdf',
  size: 31564,
  tags: ['Cases'],
  content: `
blackmail letter from reginald thornton fiennes date january 20 2026
reggie com to sherlock holmes sleuth subject the secrets you
ve kept dear i hope this finds well or at
very least in a state of mild desperation m sure
re aware that our paths have crossed on numerous occasions
over years conversations though often laced with wit and sarcasm
left me an unshakeable feeling there s more than meets
eye been doing some digging oh how wish could say
it was mere coincidence led moment truth but no my
curiosity has proven too great appears your remarkable faculties not
only served line work also as amateur spy private investigator
reason believe watching yes even all scandals see just wealthy
socialite penchant for fast cars high stakes poker nephew lord
harrington man far influence ll ever humble abode 221b baker
street two weeks come clean about what know anything less
will result releasing incriminating evidence ruin reputation leave questioning everything
thought knew yourself don t didn warn 14 days respond
yours sincerely secret life exposed world theft sensitive information estate
unwavering

`.trim(),
};

export default demoDocumentFixture;
