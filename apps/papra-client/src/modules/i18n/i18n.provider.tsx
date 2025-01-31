import type { Accessor, ParentComponent, Setter } from 'solid-js';
import type { LocaleKeys } from './locales.types';
import { makePersisted } from '@solid-primitives/storage';
import { createContext, createEffect, createResource, createSignal, Show, useContext } from 'solid-js';
import defaultDict from '../../locales/en.yml?flattened';
import { locales } from './i18n.constants';
import { createFragmentTranslator, createTranslator, findMatchingLocale } from './i18n.models';

export type Locale = typeof locales[number]['key'];
type Dictionary = Record<LocaleKeys, string>;

const I18nContext = createContext<{
  t: ReturnType<typeof createTranslator<Dictionary>>;
  te: ReturnType<typeof createFragmentTranslator<Dictionary>>;
  getLocale: Accessor<Locale>;
  setLocale: Setter<Locale>;
  locales: typeof locales;
}>();

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('I18n context not found, useI18n must be used within I18nProvider');
  }

  return context;
}

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  const { default: dict } = await import(`../../locales/${locale}.yml?flattened`);

  return {
    ...defaultDict,
    ...dict,
  };
}

export const I18nProvider: ParentComponent = (props) => {
  const browserLocale = findMatchingLocale({
    preferredLocales: navigator.languages.map(x => new Intl.Locale(x)),
    supportedLocales: locales.map(x => new Intl.Locale(x.key)),
  });
  const [getLocale, setLocale] = makePersisted(createSignal<Locale>(browserLocale), { name: 'papra_locale', storage: localStorage });

  const [dict] = createResource(getLocale, fetchDictionary);

  createEffect(() => {
    document.documentElement.lang = getLocale();
  });

  return (
    <Show when={dict.latest}>
      {getDictionary => (
        <I18nContext.Provider
          value={{
            t: createTranslator({ getDictionary }),
            te: createFragmentTranslator({ getDictionary }),
            getLocale,
            setLocale,
            locales,
          }}
        >
          {props.children}
        </I18nContext.Provider>
      )}
    </Show>
  );
};
