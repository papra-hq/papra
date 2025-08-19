export type OrganizationPlanRecord = {
  id: string;
  name: string;
  priceId?: string;
  defaultSeatsCount?: number;
  isPerSeat: boolean;
  limits: {
    maxDocumentStorageBytes: number;
    maxFileSize: number;
    maxIntakeEmailsCount: number;
    maxOrganizationsMembersCount: number;
  };
};
