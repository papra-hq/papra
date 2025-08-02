import type { RouteDefinitionContext } from './server.types';
import { registerDocumentMcp } from '../documents/documents.mcp';

export function registerMcp(context: RouteDefinitionContext) {
  registerDocumentMcp(context);
}
