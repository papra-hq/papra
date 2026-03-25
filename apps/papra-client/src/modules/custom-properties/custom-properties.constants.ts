import type { TranslationsDictionary } from '../i18n/locales.types';
import type { CustomPropertyType } from './custom-properties.types';

export const PROPERTY_TYPE_LABEL_I18N_KEYS: Record<CustomPropertyType, keyof TranslationsDictionary> = {
  text: 'custom-properties.types.text',
  number: 'custom-properties.types.number',
  date: 'custom-properties.types.date',
  boolean: 'custom-properties.types.boolean',
  select: 'custom-properties.types.select',
  multi_select: 'custom-properties.types.multi_select',
  user_relation: 'custom-properties.types.user_relation',
  document_relation: 'custom-properties.types.document_relation',
} as const;
