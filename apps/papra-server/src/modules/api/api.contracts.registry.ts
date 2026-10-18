import { healthCheckContract, pingContract } from '../app/health-check/health-check.api.contracts';
import { getCurrentUserContract, updateCurrentUserContract } from '../users/users.api.contracts';
import {
  createOrganizationTagContract,
  deleteOrganizationTagContract,
  getOrganizationTagsContract,
  updateOrganizationTagContract,
} from '../tags/tags.api.contracts';

export type { ApiContract } from './api.contracts';

export const apiContracts = {
  pingContract,
  healthCheckContract,
  getCurrentUserContract,
  updateCurrentUserContract,
  getOrganizationTagsContract,
  createOrganizationTagContract,
  updateOrganizationTagContract,
  deleteOrganizationTagContract,
};
