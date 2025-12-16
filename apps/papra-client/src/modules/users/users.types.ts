export type UserMe = {
  id: string;
  email: string;
  planId: string;
  name: string;
  permissions: string[];
};

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  provider: string;
  maxApiKeys: number;
  apiKeysCount: number;
  isEmailVerified: boolean;
  customerId: string | null;
  planId: string;
};
