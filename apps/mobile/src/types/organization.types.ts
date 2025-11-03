export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type UserOrganization = {
  organization: Organization;
  role: 'owner' | 'admin' | 'member';
};
