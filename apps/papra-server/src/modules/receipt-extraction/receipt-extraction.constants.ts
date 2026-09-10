export const RECEIPT_EXTRACTION_TASK_NAME = 'extract-receipt-data';

export const DEFAULT_RECEIPT_CATEGORIES = [
  'Groceries',
  'Dining',
  'Fuel',
  'Transport',
  'Travel',
  'Utilities',
  'Office',
  'Software',
  'Hardware',
  'Health',
  'Home',
  'Entertainment',
  'Other',
] as const;

// Custom property definitions the extraction writes to. Matched against existing
// organization properties by key (see generatePropertyKey) and type, created if missing.
export const RECEIPT_PROPERTY_FIELDS = {
  vendor: { name: 'Vendor', type: 'text', description: 'Merchant or vendor name (AI extracted)' },
  date: { name: 'Receipt date', type: 'date', description: 'Purchase date (AI extracted)' },
  total: { name: 'Total', type: 'number', description: 'Total amount paid (AI extracted)' },
  tax: { name: 'Tax', type: 'number', description: 'Total tax amount (AI extracted)' },
  currency: {
    name: 'Currency',
    type: 'text',
    description: 'ISO 4217 currency code (AI extracted)',
  },
  paymentMethod: {
    name: 'Payment method',
    type: 'text',
    description: 'How it was paid (AI extracted)',
  },
  category: {
    name: 'Expense category',
    type: 'select',
    description: 'Expense category (AI extracted)',
  },
} as const;

export type ReceiptField = keyof typeof RECEIPT_PROPERTY_FIELDS;

export const RECEIPT_FIELDS = Object.keys(RECEIPT_PROPERTY_FIELDS) as ReceiptField[];

// Receipts from before this year are almost certainly a misread date
export const MIN_RECEIPT_YEAR = 1990;

// OCR output of a long invoice can be huge, receipts never are. Keep token cost bounded.
export const MAX_CONTENT_CHARS = 12_000;
