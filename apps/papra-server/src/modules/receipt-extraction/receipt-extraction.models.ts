import * as v from 'valibot';
import { generatePropertyKey } from '../custom-properties/custom-properties.repository.models';
import type { ReceiptField } from './receipt-extraction.constants';
import {
  MAX_CONTENT_CHARS,
  MIN_RECEIPT_YEAR,
  RECEIPT_FIELDS,
  RECEIPT_PROPERTY_FIELDS,
} from './receipt-extraction.constants';

export type ReceiptExtractionResponse = {
  isReceipt: boolean;
  vendor: string | null;
  date: string | null;
  total: number | null;
  tax: number | null;
  currency: string | null;
  paymentMethod: string | null;
  category: string | null;
};

export type NormalizedReceiptFields = {
  vendor?: string;
  date?: Date;
  total?: number;
  tax?: number;
  currency?: string;
  paymentMethod?: string;
  category?: string;
};

export function buildReceiptExtractionSchema({
  categories,
}: {
  categories: string[];
}): v.GenericSchema<ReceiptExtractionResponse> {
  return v.object({
    isReceipt: v.boolean(),
    vendor: v.nullable(v.string()),
    date: v.nullable(v.string()),
    total: v.nullable(v.number()),
    tax: v.nullable(v.number()),
    currency: v.nullable(v.string()),
    paymentMethod: v.nullable(v.string()),
    category: v.nullable(v.picklist(categories)),
  });
}

export function buildReceiptExtractionSystemPrompt({ categories }: { categories: string[] }) {
  return [
    'You extract structured expense data from the text of a scanned or photographed document.',
    'The text comes from OCR and may contain misread characters, broken lines and noise.',
    '',
    'Instructions:',
    '- Set isReceipt to true only for proof of purchase or payment: receipts, invoices, bills. Otherwise set it to false and every other field to null.',
    '- vendor: the merchant or business name as printed, without address or legal suffixes noise.',
    '- date: the purchase or invoice date as YYYY-MM-DD. If the day and month order is ambiguous, use the currency and address to infer the locale.',
    '- total: the final amount paid, including tax and tip, as a plain number. Not the subtotal, not the change given.',
    '- tax: the sum of all tax lines (GST, HST, PST, VAT, sales tax) as a plain number.',
    '- currency: ISO 4217 code such as CAD, USD, EUR. Infer from symbols, address or tax names if not printed.',
    '- paymentMethod: short form such as "Visa", "Mastercard", "Debit", "Cash", "Amex". Never include card numbers.',
    `- category: pick the best fit from: ${categories.join(', ')}.`,
    '- Use null for any field you cannot read with reasonable confidence. Never guess numbers.',
  ].join('\n');
}

export function buildReceiptExtractionUserPrompt({
  document,
}: {
  document: { name: string; content: string };
}) {
  const content =
    document.content.length > MAX_CONTENT_CHARS
      ? `${document.content.slice(0, MAX_CONTENT_CHARS)}\n[truncated]`
      : document.content;

  return [`Document name: ${document.name}`, 'Document content:', content].join('\n');
}

function normalizeText({ value, maxLength = 255 }: { value: unknown; maxLength?: number }) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);

  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeAmount({ value }: { value: unknown }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.round(value * 100) / 100;
}

export function parseReceiptDate({ value, now }: { value: unknown; now: Date }) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  // Rejects rolled over dates like 2024-02-30
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  // One day of slack for timezone differences
  const isInFuture = date.getTime() > now.getTime() + 24 * 60 * 60 * 1000;

  if (!isRealDate || isInFuture || year < MIN_RECEIPT_YEAR) {
    return undefined;
  }

  return date;
}

export function normalizeReceiptExtraction({
  response,
  categories,
  now = new Date(),
}: {
  response: unknown;
  categories: string[];
  now?: Date;
}): { isReceipt: boolean; fields: NormalizedReceiptFields } {
  if (typeof response !== 'object' || response === null) {
    return { isReceipt: false, fields: {} };
  }

  const raw = response as Partial<Record<keyof ReceiptExtractionResponse, unknown>>;

  if (raw.isReceipt !== true) {
    return { isReceipt: false, fields: {} };
  }

  const total = normalizeAmount({ value: raw.total });
  let tax = normalizeAmount({ value: raw.tax });

  // Tax larger than the total is a misread line, drop it rather than store garbage
  if (tax !== undefined && total !== undefined && Math.abs(tax) > Math.abs(total)) {
    tax = undefined;
  }

  const currencyCandidate = normalizeText({ value: raw.currency })?.toUpperCase();
  const currency =
    currencyCandidate && /^[A-Z]{3}$/.test(currencyCandidate) ? currencyCandidate : undefined;

  const categoryCandidate = normalizeText({ value: raw.category })?.toLowerCase();
  const category = categories.find((c) => c.toLowerCase() === categoryCandidate);

  const fields: NormalizedReceiptFields = {
    vendor: normalizeText({ value: raw.vendor }),
    date: parseReceiptDate({ value: raw.date, now }),
    total,
    tax,
    currency,
    paymentMethod: normalizeText({ value: raw.paymentMethod, maxLength: 50 }),
    category,
  };

  return {
    isReceipt: true,
    fields: Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    ) as NormalizedReceiptFields,
  };
}

type PropertyDefinitionLike = {
  id: string;
  key: string;
  type: string;
  options?: readonly { id: string; name: string }[];
};

export function matchReceiptPropertyDefinitions<T extends PropertyDefinitionLike>({
  propertyDefinitions,
}: {
  propertyDefinitions: T[];
}) {
  const matched = new Map<ReceiptField, T>();
  const missing: ReceiptField[] = [];
  const conflicting: ReceiptField[] = [];

  for (const field of RECEIPT_FIELDS) {
    const { name, type } = RECEIPT_PROPERTY_FIELDS[field];
    const key = generatePropertyKey({ name });
    const existing = propertyDefinitions.find((definition) => definition.key === key);

    if (!existing) {
      missing.push(field);
      continue;
    }

    if (existing.type !== type) {
      // Same name, different type: user owns this property, never touch it
      conflicting.push(field);
      continue;
    }

    matched.set(field, existing);
  }

  return { matched, missing, conflicting };
}

export function getCategoryOptionsToSync({
  existingOptions,
  categories,
}: {
  existingOptions: readonly { id: string; name: string }[];
  categories: string[];
}) {
  const existingNames = new Set(existingOptions.map((option) => option.name.toLowerCase()));
  const newOptions = categories
    .filter((category) => !existingNames.has(category.toLowerCase()))
    .map((name) => ({ name }));

  if (newOptions.length === 0) {
    return { optionsToSync: undefined };
  }

  // Existing options are passed back with their ids so sync keeps them (and their values)
  return {
    optionsToSync: [...existingOptions.map(({ id, name }) => ({ id, name })), ...newOptions],
  };
}

export function buildReceiptValuesToWrite({
  fields,
  definitionsByField,
  propertyDefinitionIdsWithValues,
  overwriteExistingValues,
}: {
  fields: NormalizedReceiptFields;
  definitionsByField: Map<ReceiptField, PropertyDefinitionLike>;
  propertyDefinitionIdsWithValues: Set<string>;
  overwriteExistingValues: boolean;
}) {
  const values: { field: ReceiptField; propertyDefinitionId: string; value: unknown }[] = [];

  for (const field of RECEIPT_FIELDS) {
    const fieldValue = fields[field];
    const definition = definitionsByField.get(field);

    if (fieldValue === undefined || !definition) {
      continue;
    }

    if (!overwriteExistingValues && propertyDefinitionIdsWithValues.has(definition.id)) {
      continue;
    }

    if (field === 'category') {
      const option = definition.options?.find(
        ({ name }) => name.toLowerCase() === String(fieldValue).toLowerCase(),
      );

      if (option) {
        values.push({ field, propertyDefinitionId: definition.id, value: option.id });
      }

      continue;
    }

    if (field === 'date') {
      values.push({
        field,
        propertyDefinitionId: definition.id,
        value: (fieldValue as Date).toISOString(),
      });
      continue;
    }

    values.push({ field, propertyDefinitionId: definition.id, value: fieldValue });
  }

  return { values };
}

export function isReceiptExtractionEnabled({
  config,
}: {
  config: { ai: { isEnabled: boolean }; receiptExtraction: { isEnabled: boolean } };
}) {
  return config.ai.isEnabled && config.receiptExtraction.isEnabled;
}
