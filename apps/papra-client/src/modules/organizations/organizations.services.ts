import slugify from '@sindresorhus/slugify';
import { organizationClient } from '../auth/auth.services';

export async function fetchOrganizations() {
  const { data: organizations } = await organizationClient.list();

  return {
    organizations: organizations ?? [],
  };
}

export async function createOrganization({ name }: { name: string }) {
  const { data: organization, error } = await organizationClient.create({
    name,
    // Currently, we do not need/use the slug, so we generate a random one, as it is required by BetterAuth
    slug: `${slugify(name)}-${Math.random().toString(36).substring(2)}`,
  });

  if (error) {
    throw Object.assign(new Error(error.message), error);
  }

  return {
    organization,
  };
}

export async function updateOrganization({ organizationId, name }: { organizationId: string; name: string }) {
  const { data: organization } = await organizationClient.update({
    organizationId,
    data: {
      name,
    },
  });

  return {
    organization,
  };
}

export async function fetchOrganization({ organizationId }: { organizationId: string }) {
  const { data: organization } = await organizationClient.getFullOrganization({ query: { organizationId } });

  return {
    organization,
  };
}

export async function deleteOrganization({ organizationId }: { organizationId: string }) {
  await organizationClient.delete({ organizationId });
}
