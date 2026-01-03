import type { PERMISSIONS, ROLES_LIST } from './roles.constants';

export type Role = typeof ROLES_LIST[number];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
