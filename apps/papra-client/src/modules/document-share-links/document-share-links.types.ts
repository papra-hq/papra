export type ShareLink = {
  id: string;
  documentId: string;
  organizationId: string;
  token: string;
  url: string;
  isPasswordProtected: boolean;
  isEnabled: boolean;
  expiresAt: Date | undefined;
  lastAccessedAt: Date | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  // Only present on the organization-wide listing (joined from the document).
  documentName?: string;
  // Only present on the organization-wide listing: true when the backing document is in the trash,
  // which makes the link return 410 until the document is restored.
  isDocumentDeleted?: boolean;
};

export type PublicSharedDocument = {
  name: string;
  size: number;
  mimeType: string;
};
