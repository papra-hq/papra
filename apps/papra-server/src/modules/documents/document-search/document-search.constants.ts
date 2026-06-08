export const documentSearchSortFields = ['createdAt', 'updatedAt', 'name', 'documentDate'] as const;
export type DocumentSearchSortField = (typeof documentSearchSortFields)[number];

export const documentSearchSortOrders = ['asc', 'desc'] as const;
export type DocumentSearchSortOrder = (typeof documentSearchSortOrders)[number];

export type DocumentSearchSort = {
  field: DocumentSearchSortField;
  order: DocumentSearchSortOrder;
};

export const DEFAULT_DOCUMENT_SEARCH_SORT: DocumentSearchSort = {
  field: 'createdAt',
  order: 'desc',
};
