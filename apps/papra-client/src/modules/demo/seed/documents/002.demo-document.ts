import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './002.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Contract private investigation - Pemberton',
  fileUrl,
  date: new Date('2024-09-22'),
  mimeType: 'application/pdf',
  size: 54921,
  tags: ['Legal', 'Cases'],
  content: `
contract private investigation pemberton number sh 2024 087 date 22nd
september parties service provider sherlock holmes consulting detective 221b baker
street marylebone london nw1 6xe email sherlockholmes co uk client
lady victoria estate 15 belgrave square sw1x 8hu v pembertonltd
com services the agrees to conduct a into matter of
missing family heirloom jewellery as described in attached case brief
appendix scope work includes terms and conditions initial consultation assessment
evidence gathering witness interviews background research verification surveillance operations if
required analysis deduction written report findings court testimony necessary billed
separately 1 duration commence 25th continue until resolution or termination
not exceed 60 days without mutual agreement 2 fees 3
payment 4 confidentiality all information regarding this shall remain strictly
confidential will disclose details any third party consent except by
law 5 reporting 6 either may terminate with 7 notice
remains liable for expenses incurred up limitations reasonable include but
are limited fee 500 paid upon signing hourly rate 250
per hour estimated total 000 reimbursed at cost travel materials
specialist consultations 50 deposit 750 due balance within 14 completion
invoiced monthly via bank transfer account provided weekly progress updates
verbal preferred final comprehensive conclusion become property no guarantee specific
outcome reserves right decline use illegal methods refuse involves criminal
activity accommodation exceeding 200 require prior approval signatures signature name
dr john h watson address is governed laws england wales
disputes be resolved through arbitration attorney contact mycroft associates legal
holmeslegal laboratory forensic testing expert document retrieval costs communication equipment

`.trim(),
};

export default demoDocumentFixture;
