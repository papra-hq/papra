import type { Client } from '@papra/api-sdk';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { exit, exitOnCancel, exitOnError } from '../prompts/utils';

export async function promptForOrganization({ organizations }: { apiClient: Client; organizations: { id: string; name: string }[] }) {
  if (organizations.length === 0) {
    exit('No organizations found. Please create one in the Papra dashboard first.');
  }

  if (organizations.length === 1) {
    const { name, id } = organizations[0]!;
    p.log.info(`One organization found.\n${pc.bold(name)} (${pc.dim(id)})`);

    return { organizationId: id };
  }

  const selectedOrgId = await exitOnCancel(p.select({
    message: 'Select an organization to import stuff into:',
    options: organizations.map(org => ({
      value: org.id,
      label: `${pc.bold(org.name)} ${pc.dim(`(${org.id})`)}`,
    })),
  }));

  return { organizationId: selectedOrgId };
}

export async function getOrganizationId({ apiClient, argOrganizationId }: { apiClient: Client; argOrganizationId?: string }) {
  const { organizations } = await exitOnError(apiClient.listOrganizations(), { errorContext: 'Failed to fetch organizations.' });

  if (argOrganizationId) {
    const org = organizations.find(org => org.id === argOrganizationId);

    if (!org) {
      exit(`No organization found with ID ${pc.bold(argOrganizationId)}.`);
    }

    return { organizationId: org.id };
  }

  return promptForOrganization({ apiClient, organizations });
}
