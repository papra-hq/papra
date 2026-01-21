import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './013.demo-document.file.pdf?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: 'Water incident report',
  fileUrl,
  date: new Date('2024-08-14'),
  mimeType: 'application/pdf',
  size: 32493,
  tags: ['Property'],
  content: `
water incident report from s holmes first floor to mrs
m hudson landlord subject aquatic invasion date 14 august 2024
is currently cascading the ceiling onto my desk at a
rate suggesting upstairs tenant has installed small waterfall feature they
have not facts solution ring competent tradesperson i ve compiled
list of three who understand basic physics bucket catching deluge
will reach capacity by 19 47 tomorrow shall be out
investigating an actual mystery do try flood building in absence
sh additional note leak distinct metallic odour copper piping corroded
could told you this would happen fact did may bathroom
northwest quadrant duration 3 days noticed sooner if still brought
tea casualties one chemical analysis irreplaceable culprit your economical plumber
june

`.trim(),
};

export default demoDocumentFixture;
