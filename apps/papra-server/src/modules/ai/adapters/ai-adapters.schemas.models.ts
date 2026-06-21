import * as v from 'valibot';

export function createAdapterConfigSchema<
  AdapterName extends string,
  Schema extends Record<string, v.GenericSchema>,
>(adapterName: AdapterName, schema: Schema) {
  return v.object({
    id: v.pipe(
      v.string(),
      v.check((id) => !id.includes(':'), 'Adapter ID cannot contain a colon ":" character.'),
    ),
    adapter: v.literal(adapterName),
    ...schema,
  });
}
