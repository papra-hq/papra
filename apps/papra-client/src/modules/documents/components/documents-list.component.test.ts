import type { Document } from '../documents.types';
import { createTable, getCoreRowModel } from '@tanstack/solid-table';
import { renderToString } from 'solid-js/web';
import { describe, expect, test, vi } from 'vitest';
import {
  createdAtColumn,
  createDocumentMetadataColumns,
  documentDateColumn,
  tagsColumn,
} from './documents-list.component';

vi.mock('@/modules/i18n/i18n.provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatDate: () => 'Jan 20, 2026',
    formatRelativeTime: () => '3 months ago',
  }),
}));

vi.mock('@/modules/tags/components/tag-list.component', () => ({
  DocumentTagsList: () => null,
}));

vi.mock('./document-management-dropdown.component', () => ({
  DocumentManagementDropdown: () => null,
}));

function renderMetadataColumns({
  columns = createDocumentMetadataColumns(),
  documentDate = new Date('2026-01-19T00:00:00Z'),
}: {
  columns?: ReturnType<typeof createDocumentMetadataColumns>;
  documentDate?: Date | null;
} = {}) {
  const document: Document = {
    id: 'document-a',
    organizationId: 'organization-a',
    name: 'Receipt.pdf',
    mimeType: 'application/pdf',
    originalSize: 1000,
    createdAt: new Date('2026-01-20T00:00:00Z'),
    documentDate: documentDate ?? undefined,
    content: '',
    tags: [],
  };
  const table = createTable<Document>({
    data: [document],
    columns: Object.values(columns),
    getCoreRowModel: getCoreRowModel(),
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
  });
  const cells = table.getRowModel().rows[0]?.getAllCells() ?? [];
  const dateCell = cells.find((cell) => cell.column.id === 'documentDate');
  const createdCell = cells.find((cell) => cell.column.id === 'createdAt');

  if (!dateCell || !createdCell) {
    throw new Error('Date columns are missing from the table');
  }

  return {
    tagsHeader: renderToString(() => columns.tagsColumn.header()),
    dateHeader: renderToString(() => columns.documentDateColumn.header()),
    createdHeader: renderToString(() => columns.createdAtColumn.header()),
    dateCell: renderToString(() => columns.documentDateColumn.cell(dateCell.getContext())),
    createdCell: renderToString(() => columns.createdAtColumn.cell(createdCell.getContext())),
  };
}

describe('document metadata column visibility', () => {
  test('keeps the existing columns responsive by default', () => {
    for (const markup of Object.values(renderMetadataColumns())) {
      expect(markup).toContain('hidden sm:block');
    }
  });

  test('preserves responsive hiding for the columns used by other document tables', () => {
    const rendered = renderMetadataColumns({
      columns: { tagsColumn, documentDateColumn, createdAtColumn },
    });

    for (const markup of Object.values(rendered)) {
      expect(markup).toContain('hidden sm:block');
    }
  });

  test('keeps configurable column headers and date values visible at every width', () => {
    const rendered = renderMetadataColumns({
      columns: createDocumentMetadataColumns({ hideOnSmallScreens: false }),
    });

    for (const markup of Object.values(rendered)) {
      expect(markup).toContain('block');
      expect(markup).not.toContain('hidden');
      expect(markup).not.toContain('sm:');
    }
    expect(rendered.dateCell).toContain('2026-01-19T00:00:00.000Z');
    expect(rendered.createdCell).toContain('2026-01-20T00:00:00.000Z');
  });

  test('keeps the missing document date placeholder visible in configurable columns', () => {
    const { dateCell } = renderMetadataColumns({
      columns: createDocumentMetadataColumns({ hideOnSmallScreens: false }),
      documentDate: null,
    });

    expect(dateCell).toContain('documents.info.no-date');
    expect(dateCell).not.toContain('hidden');
    expect(dateCell).not.toContain('sm:');
  });
});
