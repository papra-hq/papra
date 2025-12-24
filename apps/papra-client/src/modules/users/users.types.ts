export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  maxOrganizationCount: number | null;
};

export type UserMe = User & {
  permissions: string[];
};
