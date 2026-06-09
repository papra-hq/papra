import { describe, expect, test } from 'vitest';
import { parseConfig } from './config';

describe('config', () => {
  describe('parseConfig', () => {
    test('a non supported language for tesseract raises an error', () => {
      expect(() => parseConfig({ rawConfig: { tesseract: { languages: ['invalid'] } } })).toThrow(
        'Invalid languages for tesseract: invalid. Valid languages are: afr, amh, ara, asm, aze, aze_cyrl, bel, ben, bod, bos, bul, cat, ceb, ces, chi_sim, chi_tra, chr, cym, dan, deu, dzo, ell, eng, enm, epo, est, eus, fas, fin, fra, frk, frm, gle, glg, grc, guj, hat, heb, hin, hrv, hun, iku, ind, isl, ita, ita_old, jav, jpn, kan, kat, kat_old, kaz, khm, kir, kor, kur, lao, lat, lav, lit, mal, mar, mkd, mlt, msa, mya, nep, nld, nor, ori, pan, pol, por, pus, ron, rus, san, sin, slk, slv, spa, spa_old, sqi, srp, srp_latn, swa, swe, syr, tam, tel, tgk, tgl, tha, tir, tur, uig, ukr, urd, uzb, uzb_cyrl, vie, yid',
      );
    });

    test('when the ocr language is not specified, undefined or empty array, the default `eng` is used', () => {
      const { config } = parseConfig({ rawConfig: { tesseract: { languages: [] } } });
      expect(config.tesseract.languages).to.eql(['eng']);
    });

    test('the ocr language can be a single language', () => {
      const { config } = parseConfig({ rawConfig: { tesseract: { languages: ['fra'] } } });
      expect(config.tesseract.languages).to.eql(['fra']);
    });
  });
});
