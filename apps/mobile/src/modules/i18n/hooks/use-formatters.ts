import { useMemo } from 'react';
import { createDateFormatter } from '../formatters.models';
import { useLocale } from './use-locale';

export function useFormatters() {
  const { deviceLanguageTag } = useLocale();

  // Keep regional formatting independent of the app's translation preference.
  return useMemo(
    () => ({ formatDate: createDateFormatter({ locale: deviceLanguageTag }) }),
    [deviceLanguageTag],
  );
}
