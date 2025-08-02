import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export { setupMcp };

function setupMcp() {
  // TODO: where should we get those info?
  // TODO: handle authentication with existing auth system
  const mcp = new McpServer({
    name: 'papra-server',
    version: '0.1.0',
    description: 'Papra Server',
  });

  return mcp;
}
