export type OrganizationPlanRecord = {
  id: string;
  name: string;
  monthlyPriceId?: string;
  annualPriceId?: string;
  limits: {
    maxDocumentStorageBytes: number;
    maxFileSize: number;
    maxIntakeEmailsCount: number;
    maxOrganizationsMembersCount: number;
  };
};
