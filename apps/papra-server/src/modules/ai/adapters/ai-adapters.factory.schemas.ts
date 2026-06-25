import * as v from 'valibot';
import { ADAPTER_MODEL_SEPARATOR } from '../ai.constants';

export const adapterIdSchema = v.pipe(
  v.string(),
  v.check(
    (id) => !id.includes(ADAPTER_MODEL_SEPARATOR),
    `Adapter id cannot contain "${ADAPTER_MODEL_SEPARATOR}" as it is reserved for separating adapter id and model name in model identifiers.`,
  ),
);

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
