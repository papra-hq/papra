import * as v from 'valibot';

export const organizationNameSchema = v.pipe(
  v.string('Organization name must be a string'),
  v.trim(),
  v.minLength(3, 'Organization name must be at least 3 characters'),
  v.maxLength(50, 'Organization name must be at most 50 characters'),
);
