import type { APIRoute } from 'astro';
import type { ConfigDefinition } from 'figue';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { configDefinition } from '../../../papra-server/src/modules/config/config';

function buildConfigSchema({ configDefinition }: { configDefinition: ConfigDefinition }): v.GenericSchema {
  const entries: Record<string, v.GenericSchema> = {};

  for (const [key, value] of Object.entries(configDefinition)) {
    if ('schema' in value) {
      entries[key] = v.optional(value.schema as v.GenericSchema);
    } else {
      entries[key] = v.optional(buildConfigSchema({ configDefinition: value }));
    }
  }

  return v.object(entries);
}

function getConfigSchema() {
  const schema = buildConfigSchema({ configDefinition });
  const jsonSchema = toJsonSchema(schema, { typeMode: 'input', errorMode: 'ignore' });

  (jsonSchema.properties ??= {}).$schema = {
    type: 'string',
    description: 'The schema of the configuration file, to be used by IDEs to provide autocompletion and validation',
  };

  return jsonSchema;
}

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(getConfigSchema()));
};
