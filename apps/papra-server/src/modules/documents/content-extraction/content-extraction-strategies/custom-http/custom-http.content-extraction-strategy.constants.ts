export const UPLOAD_FORMAT = {
  JSON: 'json',
  FORM_DATA: 'form-data',
} as const;

export const UPLOAD_FORMATS = Object.values(UPLOAD_FORMAT);
export type UploadFormat = (typeof UPLOAD_FORMATS)[number];

export const RESPONSE_FORMAT = {
  JSON: 'json',
  TEXT: 'text',
} as const;

export const RESPONSE_FORMATS = Object.values(RESPONSE_FORMAT);

export type ResponseFormat = (typeof RESPONSE_FORMATS)[number];
