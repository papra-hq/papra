import { healthCheckContract, pingContract } from '../app/health-check/health-check.api.contracts';
import { getPublicConfigContract } from '../config/config.api.contracts';
import { getOrganizationsContract } from '../organizations/organizations.api.contracts';
import { getCurrentUserContract, updateCurrentUserContract } from '../users/users.api.contracts';
import {
  addOrganizationDocumentTagContract,
  createOrganizationTagContract,
  deleteOrganizationTagContract,
  getOrganizationTagsContract,
  removeOrganizationDocumentTagContract,
  updateOrganizationTagContract,
} from '../tags/tags.api.contracts';

export type { ApiContract } from './api.contracts';

export const apiContracts = {
  pingContract,
  healthCheckContract,
  getPublicConfigContract,
  getCurrentUserContract,
  updateCurrentUserContract,
  getOrganizationsContract,
  getOrganizationTagsContract,
  createOrganizationTagContract,
  updateOrganizationTagContract,
  deleteOrganizationTagContract,
  addOrganizationDocumentTagContract,
  removeOrganizationDocumentTagContract,
};
