export type OrganizationPlanRecord = {
  id: string;
  name: string;
  priceId?: string;
  limits: {
    maxDocumentStorageBytes: number;
    maxIntakeEmailsCount: number;
    maxOrganizationsMembersCount: number;

  };
};
