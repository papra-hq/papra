import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export { setupMcp };

function setupMcp() {
  const mcp = new McpServer({
    name: 'papra-server',
    version: '0.1.0',
    description: 'Papra Server',
  });

  return mcp;
}
