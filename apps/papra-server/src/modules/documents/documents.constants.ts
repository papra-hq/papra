import { createPrefixedIdRegex } from '../shared/random/ids';

export const DOCUMENT_ID_PREFIX = 'doc';
export const DOCUMENT_ID_REGEX = createPrefixedIdRegex({ prefix: DOCUMENT_ID_PREFIX });

export const ORIGINAL_DOCUMENTS_STORAGE_KEY = 'originals';

// Hardcoding languages list for now, as the config schema is used in the doc app, the import of @papra/lecture fucks things up at build time due to tesseract
// but would love to use the actual list from @papra/lecture
//
// import { ocrLanguages } from '@papra/lecture';
// console.log(JSON.stringify(ocrLanguages));
export const OCR_LANGUAGES = ['afr', 'amh', 'ara', 'asm', 'aze', 'aze_cyrl', 'bel', 'ben', 'bod', 'bos', 'bul', 'cat', 'ceb', 'ces', 'chi_sim', 'chi_tra', 'chr', 'cym', 'dan', 'deu', 'dzo', 'ell', 'eng', 'enm', 'epo', 'est', 'eus', 'fas', 'fin', 'fra', 'frk', 'frm', 'gle', 'glg', 'grc', 'guj', 'hat', 'heb', 'hin', 'hrv', 'hun', 'iku', 'ind', 'isl', 'ita', 'ita_old', 'jav', 'jpn', 'kan', 'kat', 'kat_old', 'kaz', 'khm', 'kir', 'kor', 'kur', 'lao', 'lat', 'lav', 'lit', 'mal', 'mar', 'mkd', 'mlt', 'msa', 'mya', 'nep', 'nld', 'nor', 'ori', 'pan', 'pol', 'por', 'pus', 'ron', 'rus', 'san', 'sin', 'slk', 'slv', 'spa', 'spa_old', 'sqi', 'srp', 'srp_latn', 'swa', 'swe', 'syr', 'tam', 'tel', 'tgk', 'tgl', 'tha', 'tir', 'tur', 'uig', 'ukr', 'urd', 'uzb', 'uzb_cyrl', 'vie', 'yid'] as const;
