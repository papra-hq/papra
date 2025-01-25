export type IntakeEmail = {
  id: string;
  organizationId: string;
  isEnabled: boolean;
  allowedOrigins: string[];

  createdAt: Date;
  updatedAt: Date | undefined;
};
