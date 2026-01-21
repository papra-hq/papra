import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './003.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Digital resume',
  fileUrl,
  date: new Date('2025-03-15'),
  mimeType: 'application/pdf',
  size: 38370,
  tags: ['Personal'],
  content: `
digital resume contact information summary highly skilled and renowned detective
with over a decade of experience in solving complex cases
proven track record delivering results under tight deadlines while maintaining
impeccable work standards discretion expertise spans forensic analysis surveillance hacking
disguise techniques skills email sholmes mindpalace net phone 1 202
555 1234 linkedin com sherlockholmes twitter investigation extensive gathering intelligence
conducting interviews analyzing evidence dna fingerprints other physical to identify
patterns connections including human observation cctv monitoring tracking proficient computer
forensics breaching secure systems recovering data from encrypted files creating
convincing disguises blend various environments social situations consulting 2015 present
worked on high profile for prominent clients government agencies private
corporations developed executed plans gather conduct solve crimes collaborated law
enforcement provide expert testimony royal scottish constabulary 2005 2010 served
as inspector the edinburgh division conducted crime scenes analyzed education
awards recognition university cambridge 2000 2004 studied sociology criminology science
psychology s award outstanding service london metropolitan police department specialized
investigative services

`.trim(),
};

export default demoDocumentFixture;
