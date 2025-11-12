export type PaperlessManifest = PaperlessManifestItem[];

export type PaperlessManifestItem
  = | PaperlessDocumentItem
    | PaperlessTagItem
    | PaperlessManifestOtherItem;

export type PaperlessDocumentItem = {
  model: 'documents.document';
  pk: number;
  fields: {
    title: string;
    content: string;
    created: string;
    modified: string;
    added: string;
    original_filename: string;
    tags: number[];
    correspondent: number | null;
    document_type: number | null;
    mime_type: string;
  };
  __exported_file_name__: string;
};

export type PaperlessTagItem = {
  model: 'documents.tag';
  pk: number;
  fields: {
    name: string;
    color: string;
    match?: string;
    matching_algorithm?: number;
    is_insensitive?: boolean;
    is_inbox_tag?: boolean;
  };
};

export type PaperlessCorrespondentItem = {
  model: 'documents.correspondent';
  pk: number;
  fields: {
    name: string;
  };
};

export type PaperlessDocumentTypeItem = {
  model: 'documents.documenttype';
  pk: number;
  fields: {
    name: string;
  };
};

export type PaperlessManifestOtherItem = {
  model: string;
  pk: number;
  fields: Record<string, unknown>;
};

export type ImportPreview = {
  documents: PaperlessDocumentItem[];
  tags: PaperlessTagItem[];
  correspondents: PaperlessCorrespondentItem[];
  documentTypes: PaperlessDocumentTypeItem[];
};

export type ImportResult = {
  success: boolean;
  documentsImported: number;
  documentsSkipped: number;
  documentsFailed: number;
  tagsCreated: number;
  errors: Array<{ fileName: string; error: string }>;
};
