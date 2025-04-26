import type { Auth } from './auth.services';

export type Session = Auth['$Infer']['Session']['session'];
