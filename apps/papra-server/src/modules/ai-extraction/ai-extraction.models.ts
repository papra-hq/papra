import type { GenericSchema } from 'valibot';
import * as v from 'valibot';
import { ensureSafeFileName } from '../documents/documents.models';
import { getExtension } from '../shared/files/file-names';
import { isNonEmptyString } from '../shared/utils';
import {
  EXTRACTABLE_CUSTOM_PROPERTY_TYPES,
  MAX_EXTRACTED_FILENAME_LENGTH,
} from './ai-extraction.constants';
import type { ExtractableCustomPropertyType } from './ai-extraction.constants';

export type ExtractableCustomProperty = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: ExtractableCustomPropertyType;
  options: { id: string; name: string }[];
};

export type AiExtractionSettings = {
  isEnabled: boolean;
  extractDate: boolean;
  extractCustomProperties: boolean;
  renameDocuments: boolean;
  filenamePattern: string;
};

export type PendingExtractionTargets = {
  shouldExtractDate: boolean;
  shouldExtractCustomProperties: boolean;
  shouldRename: boolean;
  propertiesToExtract: ExtractableCustomProperty[];
};

export type AiExtractionResponse = {
  documentDate?: string | null;
  filename?: string | null;
  customProperties?: Record<string, string | number | boolean | string[] | null | undefined>;
};

export type ResolvedCustomPropertyValue = {
  propertyDefinitionId: string;
  value: unknown;
};

function isExtractableCustomPropertyType(type: string): type is ExtractableCustomPropertyType {
  return EXTRACTABLE_CUSTOM_PROPERTY_TYPES.includes(type as ExtractableCustomPropertyType);
}

export function getExtractableCustomProperties({
  propertyDefinitions,
}: {
  propertyDefinitions: {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    type: string;
    options?: { id: string; name: string }[];
  }[];
}): ExtractableCustomProperty[] {
  return propertyDefinitions.flatMap((property) => {
    if (!isExtractableCustomPropertyType(property.type) || !isNonEmptyString(property.key)) {
      return [];
    }

    const options = property.options ?? [];

    if ((property.type === 'select' || property.type === 'multi_select') && options.length === 0) {
      return [];
    }

    return [
      {
        id: property.id,
        key: property.key,
        name: property.name,
        description: property.description ?? null,
        type: property.type,
        options,
      },
    ];
  });
}

export function getPendingExtractionTargets({
  document,
  settings,
  extractableProperties,
  existingPropertyDefinitionIds,
}: {
  document: { name: string; originalName: string; documentDate?: Date | null };
  settings: AiExtractionSettings;
  extractableProperties: ExtractableCustomProperty[];
  existingPropertyDefinitionIds: Set<string>;
}): PendingExtractionTargets {
  const propertiesToExtract = settings.extractCustomProperties
    ? extractableProperties.filter((property) => !existingPropertyDefinitionIds.has(property.id))
    : [];

  return {
    shouldExtractDate: settings.extractDate && document.documentDate == null,
    shouldExtractCustomProperties: propertiesToExtract.length > 0,
    shouldRename: settings.renameDocuments && document.name === document.originalName,
    propertiesToExtract,
  };
}

export function shouldPromptForExtraction({
  targets,
}: {
  targets: PendingExtractionTargets;
}): boolean {
  return targets.shouldExtractDate || targets.shouldExtractCustomProperties || targets.shouldRename;
}

function buildPropertyLine({ property }: { property: ExtractableCustomProperty }) {
  const description = property.description ? `: ${property.description}` : '';
  const optionNames = property.options.map((option) => option.name).join(', ');
  const options = optionNames.length > 0 ? ` Options: ${optionNames}.` : '';

  return `- ${property.key} (${property.type}, name: "${property.name}")${description}.${options}`;
}

export function buildAiExtractionSystemPrompt({
  targets,
  filenamePattern,
}: {
  targets: PendingExtractionTargets;
  filenamePattern: string;
}): string {
  const lines = [
    'You extract structured metadata from documents.',
    '',
    'Rules:',
    '- Only extract values that are clearly present in the document. Prefer null over guessing.',
    '- Dates must be ISO 8601 calendar dates (YYYY-MM-DD).',
  ];

  if (targets.shouldExtractDate) {
    lines.push(
      '- documentDate should be the primary date of the document (invoice date, letter date, contract date). Ignore unrelated dates such as due dates unless that is the only date present.',
    );
  }

  if (targets.shouldExtractCustomProperties) {
    lines.push(
      '',
      'Custom properties to extract:',
      ...targets.propertiesToExtract.map((property) => buildPropertyLine({ property })),
    );
    lines.push(
      '- For select and multi_select properties, only use the listed option names.',
      '- Omit a custom property or set it to null when the value is not present in the document.',
    );
  }

  if (targets.shouldRename) {
    lines.push('', 'Filename:');
    if (isNonEmptyString(filenamePattern)) {
      lines.push(
        `- Follow this naming pattern: ${filenamePattern}`,
        '- Replace placeholders with values extracted from the document. If a placeholder cannot be filled, omit that segment rather than inventing a value.',
      );
    } else {
      lines.push(
        '- Generate a concise, descriptive filename based on the document content (for example "2024-03-12 Acme Invoice").',
      );
    }
    lines.push(
      '- Do not include a directory path or directory separators.',
      '- You may omit the file extension; it will be preserved from the original filename.',
    );
  }

  return lines.join('\n');
}

export function buildAiExtractionUserPrompt({
  document,
}: {
  document: { content: string; name: string; originalName: string };
}): string {
  return [
    `Document name: ${document.name}`,
    `Original filename: ${document.originalName}`,
    'Document content:',
    document.content,
  ].join('\n');
}

function buildCustomPropertyValueSchema({
  property,
}: {
  property: ExtractableCustomProperty;
}): GenericSchema {
  if (property.type === 'number') {
    return v.optional(v.nullable(v.number()));
  }

  if (property.type === 'boolean') {
    return v.optional(v.nullable(v.boolean()));
  }

  if (property.type === 'date') {
    return v.optional(v.nullable(v.pipe(v.string(), v.isoDate())));
  }

  if (property.type === 'select') {
    return v.optional(v.nullable(v.picklist(property.options.map((option) => option.name))));
  }

  if (property.type === 'multi_select') {
    return v.optional(
      v.nullable(v.array(v.picklist(property.options.map((option) => option.name)))),
    );
  }

  return v.optional(v.nullable(v.string()));
}

export function buildAiExtractionSchema({
  targets,
}: {
  targets: PendingExtractionTargets;
}): GenericSchema<AiExtractionResponse> {
  const entries: v.ObjectEntries = {};

  if (targets.shouldExtractDate) {
    entries.documentDate = v.optional(v.nullable(v.pipe(v.string(), v.isoDate())));
  }

  if (targets.shouldRename) {
    entries.filename = v.optional(
      v.nullable(
        v.pipe(v.string(), v.minLength(1), v.maxLength(MAX_EXTRACTED_FILENAME_LENGTH)),
      ),
    );
  }

  if (targets.shouldExtractCustomProperties) {
    entries.customProperties = v.optional(
      v.object(
        Object.fromEntries(
          targets.propertiesToExtract.map((property) => [
            property.key,
            buildCustomPropertyValueSchema({ property }),
          ]),
        ),
      ),
    );
  }

  return v.object(entries) as GenericSchema<AiExtractionResponse>;
}

export function parseExtractedDocumentDate({
  value,
}: {
  value: string | null | undefined;
}): Date | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const isoDate = value.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return undefined;
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);
  const [year, month, day] = isoDate.split('-').map(Number);

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function getStemAndExtension({ fileName }: { fileName: string }) {
  const { extension } = getExtension({ fileName });

  if (!extension) {
    return { stem: fileName, extension: undefined };
  }

  return {
    stem: fileName.slice(0, fileName.length - extension.length - 1),
    extension,
  };
}

export function resolveExtractedFileName({
  proposedName,
  originalName,
}: {
  proposedName: string | null | undefined;
  originalName: string;
}): string | undefined {
  const trimmedName = proposedName?.trim();

  if (!isNonEmptyString(trimmedName)) {
    return undefined;
  }

  const sanitized = ensureSafeFileName(trimmedName);

  if (!isNonEmptyString(sanitized)) {
    return undefined;
  }

  const originalExtension = getExtension({ fileName: originalName }).extension;
  const proposed = getStemAndExtension({ fileName: sanitized });

  const stem = proposed.stem.trim();
  if (!isNonEmptyString(stem)) {
    return undefined;
  }

  const extension =
    proposed.extension?.toLowerCase() === originalExtension?.toLowerCase()
      ? proposed.extension
      : (originalExtension ?? proposed.extension);

  let fileName = extension ? `${stem}.${extension}` : stem;

  if (fileName.length > MAX_EXTRACTED_FILENAME_LENGTH) {
    const suffix = extension ? `.${extension}` : '';
    const maxStemLength = MAX_EXTRACTED_FILENAME_LENGTH - suffix.length;

    if (maxStemLength < 1) {
      return undefined;
    }

    fileName = `${stem.slice(0, maxStemLength)}${suffix}`;
  }

  if (fileName === originalName) {
    return undefined;
  }

  return fileName;
}

function findOptionId({
  optionName,
  options,
}: {
  optionName: string;
  options: { id: string; name: string }[];
}) {
  const exact = options.find((option) => option.name === optionName);

  if (exact) {
    return exact.id;
  }

  const caseInsensitive = options.find(
    (option) => option.name.toLowerCase() === optionName.toLowerCase(),
  );

  return caseInsensitive?.id;
}

export function resolveExtractedCustomPropertyValues({
  response,
  propertiesToExtract,
}: {
  response: AiExtractionResponse;
  propertiesToExtract: ExtractableCustomProperty[];
}): ResolvedCustomPropertyValue[] {
  const values: ResolvedCustomPropertyValue[] = [];
  const extracted = response.customProperties ?? {};

  for (const property of propertiesToExtract) {
    const rawValue = extracted[property.key];

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (property.type === 'text') {
      if (!isNonEmptyString(rawValue)) {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: rawValue });
      continue;
    }

    if (property.type === 'number') {
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: rawValue });
      continue;
    }

    if (property.type === 'boolean') {
      if (typeof rawValue !== 'boolean') {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: rawValue });
      continue;
    }

    if (property.type === 'date') {
      if (!isNonEmptyString(rawValue) || !parseExtractedDocumentDate({ value: rawValue })) {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: rawValue });
      continue;
    }

    if (property.type === 'select') {
      if (!isNonEmptyString(rawValue)) {
        continue;
      }

      const optionId = findOptionId({ optionName: rawValue, options: property.options });

      if (!optionId) {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: optionId });
      continue;
    }

    if (property.type === 'multi_select') {
      if (!Array.isArray(rawValue)) {
        continue;
      }

      const optionIds = rawValue
        .filter(isNonEmptyString)
        .map((optionName) => findOptionId({ optionName, options: property.options }))
        .filter(isNonEmptyString);

      if (optionIds.length === 0) {
        continue;
      }

      values.push({ propertyDefinitionId: property.id, value: optionIds });
    }
  }

  return values;
}
