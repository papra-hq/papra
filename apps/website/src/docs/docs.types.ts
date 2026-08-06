export type DocsCategory = {
  title: string;
  sections: DocsSection[];
};

export type DocsSection = {
  title: string;
  items: DocsItem[];
};

export type DocsItem = {
  docId: string;
};
