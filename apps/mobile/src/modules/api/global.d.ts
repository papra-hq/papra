// Source - https://stackoverflow.com/a
// Posted by Patrick Roberts, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-19, License - CC BY-SA 4.0

type FormDataValue = {
  uri: string;
  name: string;
  type: string;
};

type FormData = {
  append: (name: string, value: string | FormDataValue | Blob, fileName?: string) => void;
  set: (name: string, value: string | FormDataValue | Blob, fileName?: string) => void;
};
