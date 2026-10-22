import { healthCheckContract, pingContract } from '../app/health-check/health-check.api.contracts';
import { getPublicConfigContract } from '../config/config.api.contracts';
import {
  createOrganizationContract,
  getDeletedOrganizationsContract,
  getOrganizationContract,
  getOrganizationsContract,
  softDeleteOrganizationContract,
  updateOrganizationContract,
} from '../organizations/organizations.api.contracts';
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
  getDeletedOrganizationsContract,
  createOrganizationContract,
  getOrganizationContract,
  updateOrganizationContract,
  softDeleteOrganizationContract,
  getOrganizationTagsContract,
  createOrganizationTagContract,
  updateOrganizationTagContract,
  deleteOrganizationTagContract,
  addOrganizationDocumentTagContract,
  removeOrganizationDocumentTagContract,
};
