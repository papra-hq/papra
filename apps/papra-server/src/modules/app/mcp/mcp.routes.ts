import type { RouteDefinitionContext } from '../server.types';
import { StreamableHTTPTransport } from '@hono/mcp';

export function registerMcpRoutes(context: RouteDefinitionContext) {
  setupEntrypointRoute(context);
}

function setupEntrypointRoute({ app, mcp }: RouteDefinitionContext) {
  app.all('/mcp', async (context) => {
    const transport = new StreamableHTTPTransport();

    await mcp.connect(transport);

    return transport.handleRequest(context);
  });
}
