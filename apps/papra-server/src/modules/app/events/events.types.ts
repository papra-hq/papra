import type { DocumentEvents } from '../../documents/documents.events.types';
import type { UserEvents } from '../../users/users.events.types';

export type AppEvents = UserEvents & DocumentEvents;
