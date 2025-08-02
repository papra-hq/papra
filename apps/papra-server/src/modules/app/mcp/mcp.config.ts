import type { ConfigDefinition } from 'figue';
import { booleanishSchema } from '../../config/config.schemas';

export const mcpConfig = {
  isEnabled: {
    doc: 'Whether MCP server is enabled',
    schema: booleanishSchema,
    default: false,
    env: 'MCP_IS_ENABLED',
  },
} as const satisfies ConfigDefinition;
