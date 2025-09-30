export type OrganizationPlanRecord = {
  id: string;
  name: string;
  priceId?: string;
  limits: {
    maxDocumentStorageBytes: number;
    maxFileSize: number;
    maxIntakeEmailsCount: number;
    maxOrganizationsMembersCount: number;
  };
};
