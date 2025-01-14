import * as v from 'valibot';

export const nameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Full name must be at least 2 characters'),
  v.maxLength(50, 'Full name must be less than 50 characters'),
);
