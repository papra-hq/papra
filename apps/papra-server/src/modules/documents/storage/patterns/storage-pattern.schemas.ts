import * as v from 'valibot';
import { isStoragePatternValid } from './storage-pattern.usecases';

export const storagePatternSchema = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed) {
      const result = isStoragePatternValid({ storageKeyPattern: dataset.value });

      if (!result.isValid) {
        addIssue({
          message: `Invalid storage pattern: ${result.error.message}`,
        });
      }
    }
  }),
);
