import type { APIRoute } from 'astro';
import type { ConfigDefinition } from 'figue';
import { z } from 'astro:content';
import { mapValues } from 'lodash-es';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { configDefinition } from '../../../papra-server/src/modules/config/config';

function buildConfigSchema({ configDefinition }: { configDefinition: ConfigDefinition }) {
  const schema: any = mapValues(configDefinition, (config) => {
    if (typeof config === 'object' && config !== null && 'schema' in config && 'doc' in config) {
      return config.schema;
    } else {
      return buildConfigSchema({
        configDefinition: config as ConfigDefinition,
      });
    }
  });

  return z.object(schema);
}

function stripRequired(schema: any) {
  if (schema.type === 'object') {
    schema.required = [];
    for (const key in schema.properties) {
      stripRequired(schema.properties[key]);
    }
  }
}

function addSchema(schema: any) {
  schema.properties.$schema = {
    type: 'string',
    description: 'The schema of the configuration file, to be used by IDEs to provide autocompletion and validation',
  };
}

function getConfigSchema() {
  const schema = buildConfigSchema({ configDefinition });
  const jsonSchema = zodToJsonSchema(schema, { pipeStrategy: 'output' });

  stripRequired(jsonSchema);
  addSchema(jsonSchema);
  return jsonSchema;
}

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(getConfigSchema()));
};
