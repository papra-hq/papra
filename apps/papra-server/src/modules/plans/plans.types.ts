export type OrganizationPlanRecord = {
  id: string;
  name: string;
  priceId?: string;
  defaultSeatsCount?: number;
  isPerSeat: boolean;
  limits: {
    maxDocumentStorageBytes: number;
    maxIntakeEmailsCount: number;
    maxOrganizationsMembersCount: number;
  };
};
