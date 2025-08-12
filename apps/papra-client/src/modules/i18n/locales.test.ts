import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { describe, expect, test } from 'vitest';
import { locales as registeredLocales } from './i18n.constants';

const rawLocales = import.meta.glob('../../locales/*.ts', { eager: true, import: 'translations' });
const locales = Object.fromEntries(
  Object.entries(rawLocales).map(([key, value]: [string, any]) => [key.replace('../../locales/', '').replace('.dictionary.ts', ''), value]),
);

const { en: defaultLocal } = locales;

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('locales', () => {
  test('all registered locales must have a translation file', () => {
    const availableLocales = Object.keys(locales).toSorted();
    const registeredLocalesKeys = registeredLocales.map(x => x.key).toSorted();

    expect(registeredLocalesKeys).to.eql(availableLocales);
  });

  for (const [locale, translations] of Object.entries(locales)) {
    describe(locale, () => {
      test(`locale ${locale} must not have extra keys compared to default`, () => {
        const extraKeys = Object
          .keys(translations)
          .filter(key => !(key in defaultLocal));

        expect(extraKeys).to.eql([], `Extra keys found in ${locale}`);
      });

      test(`all translations in ${locale} must be strings`, () => {
        const nonStringTranslations = Object
          .entries(translations)
          .filter(([, value]) => typeof value !== 'string')
          .map(([key]) => key);

        expect(nonStringTranslations).to.eql([], `Non-string translations found in ${locale}`);
      });
    });
  }

  test('all keys in en.yml must be used in the app (dynamic keys are manually excluded)', async () => {
    const srcFileNames = await glob(['src/**/*.{ts,tsx}', '!src/**/*.test.*', '!src/modules/i18n/locales.types.ts'], { cwd: packageRoot });

    // Exclude keys that are used in dynamic contexts
    const dynamicKeysMatchers = [
      /^api-errors\./, // api-errors.document.already_exists
      /^auth\.register\.providers\.[a-z0-9:]+$/, // auth.register.providers.google
      /^webhooks\.events\.[a-z0-9]+\.[a-z0-9:]+.description$/, // webhooks.events.documents.document:created.description
      /^webhooks\.events\.[a-z0-9]+\.title$/, // webhooks.events.documents.title
      /^api-keys\.permissions\.[a-z0-9:]+\.[a-z0-9:]+$/, // api-keys.permissions.documents.documents:delete
      /^organizations\.members\.roles\.[a-z0-9]+$/, // organizations.members.roles.admin
      /^activity\.document\.[a-z0-9:]+$/, // activity.document.created
      /^organizations\.invitations\.status\.[a-z0-9:]+$/, // organizations.invitations.status.pending
    ];

    const keys = new Set(
      Object
        .keys(defaultLocal)
        .filter(key => !dynamicKeysMatchers.some(matcher => matcher.test(key))),
    );

    for (const srcFileName of srcFileNames) {
      const fileContent = await readFile(join(packageRoot, srcFileName), 'utf-8');

      for (const key of keys) {
        if (fileContent.includes(key)) {
          keys.delete(key);
        }
      }

      if (keys.size === 0) {
        break;
      }
    }

    expect([...keys]).to.eql([], 'Unused keys found in en.yml, please remove them (or add them to the dynamic keys matchers in locales.test.ts if they are used in dynamic contexts)');
  });
});
