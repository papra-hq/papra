import type { ObjectSchema, StrictObjectSchema } from 'valibot';

export type GenericObjectSchema = ObjectSchema<any, any> | StrictObjectSchema<any, any>;
