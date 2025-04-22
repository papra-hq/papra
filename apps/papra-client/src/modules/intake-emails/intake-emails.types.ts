export type IntakeEmail = {
  id: string;
  emailAddress: string;
  organizationId: string;
  isEnabled: boolean;
  allowedOrigins: string[];

  createdAt: Date;
  updatedAt: Date;
};
