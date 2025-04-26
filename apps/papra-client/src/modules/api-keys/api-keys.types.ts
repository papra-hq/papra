export type ApiKey = {
  id: string;
  name: string;
  permissions: string[];
  organizationIds: string[];
  allOrganizations: boolean;
  expiresAt?: Date;
  prefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
