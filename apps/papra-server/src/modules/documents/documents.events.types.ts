import type { Document } from './documents.types';

export type DocumentEvents = {
  'document.created': { document: Document };
};
