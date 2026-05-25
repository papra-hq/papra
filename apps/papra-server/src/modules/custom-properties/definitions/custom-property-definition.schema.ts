import * as v from 'valibot';

export const customPropertyDefinitionNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255));
export const customPropertyDefinitionDescriptionSchema = v.pipe(v.string(), v.trim(), v.maxLength(1000));
export const customPropertyDefinitionDisplayOrderSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
