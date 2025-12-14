import type { PERMISSIONS, ROLES } from './roles.constants';

export type Role = typeof ROLES[number];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
