export type UserMe = {
  id: string;
  email: string;
  planId: string;
  roles: string[];
};

export type User = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  provider: string;
  maxApiKeys: number;
  apiKeysCount: number;
  isEmailVerified: boolean;
  customerId: string | null;
  planId: string;
};
