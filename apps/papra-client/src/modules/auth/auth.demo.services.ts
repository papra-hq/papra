import type { createAuthClient } from './auth.services';
import slugify from '@sindresorhus/slugify';
import { organizationStorage } from '../demo/demo.storage';
import { getValues } from '../demo/demo.storage.models';

const organizationClient = {
  list: async () => {
    const organizations = await getValues(organizationStorage);

    return { data: organizations };
  },
  create: async ({ name }: { name: string }) => {
    const organization = {
      id: `org_${Math.random().toString(36).slice(2)}`,
      slug: `${slugify(name)}-${Math.random().toString(36).slice(2)}`,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await organizationStorage.setItem(organization.id, organization);

    return { data: organization };
  },

  getFullOrganization: async ({ query: { organizationId } }: { query: { organizationId: string } }) => {
    const organization = await organizationStorage.getItem(organizationId);

    return { data: organization };
  },

  delete: async ({ organizationId }: { organizationId: string }) => {
    await organizationStorage.removeItem(organizationId);
  },

  update: async ({ organizationId, data: { name } }: { organizationId: string; data: { name: string } }) => {
    const organization = await organizationStorage.getItem(organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    const newOrganization = { ...organization, name };

    await organizationStorage.setItem(organizationId, newOrganization);

    return { data: newOrganization };
  },
};

export function createDemoAuthClient() {
  const baseClient = {
    useSession: () => () => ({
      isPending: false,
      data: {
        user: {
          id: '1',
          email: 'test@test.com',
        },
      },
    }),
    signIn: {
      email: () => Promise.resolve({}),
      social: () => Promise.resolve({}),
    },
    signOut: () => Promise.resolve({}),
    organization: organizationClient,
    signUp: () => Promise.resolve({}),
    forgetPassword: () => Promise.resolve({}),
    resetPassword: () => Promise.resolve({}),
    sendVerificationEmail: () => Promise.resolve({}),
  };

  return new Proxy(baseClient, {
    get: (target, prop) => {
      if (!(prop in target)) {
        console.warn(`Accessing undefined property "${String(prop)}" in demo auth client`);
      }
      return target[prop as keyof typeof target];
    },
  }) as unknown as ReturnType<typeof createAuthClient>;
}
