export type Organization = { id: string; name: string; createdAt: Date; updatedAt?: Date };

export type OrganizationWithStats = Organization & {
  documentsCount: number;
  documentsSize: number;
};
