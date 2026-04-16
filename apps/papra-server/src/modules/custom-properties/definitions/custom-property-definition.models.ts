import type { Expand } from '@corentinth/chisels';
import type { DocumentsRepository } from '../../documents/documents.repository';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { CustomPropertiesRepository } from '../custom-properties.repository';
import type { CustomPropertyDefinition, DbInsertableDocumentCustomPropertyValue } from '../custom-properties.types';
import type { CustomPropertiesOptionsRepository } from '../options/custom-properties-options.repository';
import * as v from 'valibot';
import { isNil } from '../../shared/utils';
import { customPropertyDefinitionDescriptionSchema, customPropertyDefinitionDisplayOrderSchema, customPropertyDefinitionNameSchema } from './custom-property-definition.schema';

// Type from ../custom-properties.repository.ts getDocumentCustomPropertyValues query
export type DocumentCustomPropertyValueWithRelatedInfo = {
  value: {
    id: string;
    propertyDefinitionId: string;
    textValue: string | null;
    numberValue: number | null;
    dateValue: Date | null;
    booleanValue: boolean | null;
    selectOptionId: string | null;
    userId: string | null;
    relatedDocumentId: string | null;
  };
  definition: {
    id: string;
    name: string;
    key: string;
    type: string;
  };
  option: {
    id: string;
    name: string;
  } | null;
  relatedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  relatedDocument: {
    id: string;
    name: string;
  } | null;
};

type InsertableCustomPropertyValue = Expand<Omit<DbInsertableDocumentCustomPropertyValue, 'id' | 'createdAt' | 'updatedAt' | 'documentId' | 'propertyDefinitionId'>>;

type BaseCreateFields<TypeName extends string> = {
  type: TypeName;
  name: string;
  description?: string;
  displayOrder?: number;
};

export type BaseUpdateFields = {
  name?: string;
  description?: string | null;
  displayOrder?: number;
};

type InferExtraFields<T> = T extends v.GenericSchema ? v.InferOutput<T> : Record<string, never>;

export type CustomPropertyTypeDefinitionInput<
  TypeName extends string = string,
  ValueInput = unknown,
  CreateExtraSchema extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined = undefined,
  UpdateExtraSchema extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined = undefined,
> = {
  typeName: TypeName;

  definition?: {
    createExtraSchema?: CreateExtraSchema;
    updateExtraSchema?: UpdateExtraSchema;

    onCreate?: (args: {
      apiInput: BaseCreateFields<TypeName> & InferExtraFields<CreateExtraSchema>;
      propertyDefinition: CustomPropertyDefinition;

      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
    }) => Promise<void>;

    onUpdate?: (args: {
      apiInput: BaseUpdateFields & InferExtraFields<UpdateExtraSchema>;
      propertyDefinition: CustomPropertyDefinition;
      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
    }) => Promise<void>;
  };

  value: {
    inputSchema: v.BaseSchema<unknown, ValueInput, v.BaseIssue<unknown>>;

    extendInputValidation?: (args: {
      value: ValueInput;
      customProperty: CustomPropertyDefinition;
      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
      organizationsRepository: OrganizationsRepository;
      documentsRepository: DocumentsRepository;
    }) => Promise<void>;

    toDb: (args: {
      value: ValueInput;
    }) => InsertableCustomPropertyValue | InsertableCustomPropertyValue[];

    fromDb: (args: {
      rows: DocumentCustomPropertyValueWithRelatedInfo[];
    }) => unknown;
  };
};

export type CustomPropertyTypeDefinition = {
  typeName: string;
  definition: {
    createExtraSchema?: v.ObjectSchema<v.ObjectEntries, undefined>;
    updateExtraSchema?: v.ObjectSchema<v.ObjectEntries, undefined>;
    createPropertySchema: v.GenericSchema;
    updatePropertySchema: v.GenericSchema;
    onCreate?: (args: {
      apiInput: BaseCreateFields<string> & Record<string, unknown>;
      propertyDefinition: CustomPropertyDefinition;
      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
    }) => Promise<void>;
    onUpdate?: (args: {
      apiInput: BaseUpdateFields & Record<string, unknown>;
      propertyDefinition: CustomPropertyDefinition;
      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
    }) => Promise<void>;
  };
  value: {
    inputSchema: v.GenericSchema;
    extendInputValidation?: (args: {
      value: unknown;
      customProperty: CustomPropertyDefinition;
      customPropertiesRepository: CustomPropertiesRepository;
      customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
      organizationsRepository: OrganizationsRepository;
      documentsRepository: DocumentsRepository;
    }) => Promise<void>;
    toDb: (args: { value: unknown }) => InsertableCustomPropertyValue | InsertableCustomPropertyValue[];
    fromDb: (args: { rows: DocumentCustomPropertyValueWithRelatedInfo[] }) => unknown;
  };
};

// Conditional types that properly resolve the schema shape based on whether extra schemas are provided.
// This concentrates type assertions in defineCustomPropertyType so all consumer code is cast-free.
const baseCreatePropertySchema = v.object({
  name: customPropertyDefinitionNameSchema,
  description: v.optional(customPropertyDefinitionDescriptionSchema),
  displayOrder: v.optional(customPropertyDefinitionDisplayOrderSchema),
});

const baseUpdatePropertySchema = v.object({
  name: v.optional(customPropertyDefinitionNameSchema),
  description: v.optional(v.nullable(customPropertyDefinitionDescriptionSchema)),
  displayOrder: v.optional(customPropertyDefinitionDisplayOrderSchema),
});

type BaseCreateEntries = typeof baseCreatePropertySchema.entries;
type BaseUpdateEntries = typeof baseUpdatePropertySchema.entries;

type CreatePropertySchemaFor<T extends string, Extra extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined>
  = Extra extends v.ObjectSchema<infer E extends v.ObjectEntries, undefined>
    ? v.ObjectSchema<{ type: v.LiteralSchema<T, undefined> } & BaseCreateEntries & E, undefined>
    : v.ObjectSchema<{ type: v.LiteralSchema<T, undefined> } & BaseCreateEntries, undefined>;

type UpdatePropertySchemaFor<Extra extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined>
  = Extra extends v.ObjectSchema<infer E extends v.ObjectEntries, undefined>
    ? v.ObjectSchema<BaseUpdateEntries & E, undefined>
    : v.ObjectSchema<BaseUpdateEntries, undefined>;

function buildCreatePropertySchema(typeName: string, extraSchema?: v.ObjectSchema<v.ObjectEntries, undefined>) {
  const schema = v.object({ type: v.literal(typeName), ...baseCreatePropertySchema.entries });

  return extraSchema ? v.object({ ...schema.entries, ...extraSchema.entries }) : schema;
}

function buildUpdatePropertySchema(extraSchema?: v.ObjectSchema<v.ObjectEntries, undefined>) {
  return extraSchema ? v.object({ ...baseUpdatePropertySchema.entries, ...extraSchema.entries }) : baseUpdatePropertySchema;
}

export function defineCustomPropertyType<
  TypeName extends string,
  ValueInput,
  CreateExtraSchema extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined = undefined,
  UpdateExtraSchema extends v.ObjectSchema<v.ObjectEntries, undefined> | undefined = undefined,
>(config: CustomPropertyTypeDefinitionInput<TypeName, ValueInput, CreateExtraSchema, UpdateExtraSchema>) {
  return {
    ...config,
    definition: {
      ...config.definition,
      createPropertySchema: buildCreatePropertySchema(config.typeName, config.definition?.createExtraSchema) as CreatePropertySchemaFor<TypeName, CreateExtraSchema>,
      updatePropertySchema: buildUpdatePropertySchema(config.definition?.updateExtraSchema) as UpdatePropertySchemaFor<UpdateExtraSchema>,
    },
  };
}

export function ensureRow<T>(fn: (args: { row: T }) => unknown) {
  return (args: { rows: T[] }) => {
    const { rows } = args;

    const [row] = rows;

    if (isNil(row)) {
      return null;
    }

    return fn({ row });
  };
}
