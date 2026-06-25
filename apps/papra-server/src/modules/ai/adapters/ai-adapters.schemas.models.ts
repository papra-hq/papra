import * as v from 'valibot';
import { adapterIdSchema } from './ai-adapters.schemas';

export function createAdapterConfigSchema<
  AdapterName extends string,
  Schema extends Record<string, v.GenericSchema>,
>(adapterName: AdapterName, schema: Schema) {
  return v.object({
    id: adapterIdSchema,
    adapter: v.literal(adapterName),
    ...schema,
  });
}
