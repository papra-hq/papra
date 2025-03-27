export type OrganizationSubscription = {
  status: string;
  currentPeriodEnd: number;
  currentPeriodStart: number;
  cancelAtPeriodEnd: boolean;
  planId: string;
  seatsCount: number;
};
