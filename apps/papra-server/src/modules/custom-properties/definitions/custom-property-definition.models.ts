import type { Expand } from '@corentinth/chisels';
import type { DocumentsRepository } from '../../documents/documents.repository';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { CustomPropertiesRepository } from '../custom-properties.repository';
import type { CustomPropertyDefinition, DbInsertableDocumentCustomPropertyValue } from '../custom-properties.types';
import type { CustomPropertiesOptionsRepository } from '../options/custom-properties-options.repository';
import z from 'zod';
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

type BaseUpdateFields = {
  name?: string;
  description?: string | null;
  displayOrder?: number;
};

type InferExtraFields<T> = T extends z.ZodType<infer U> ? U : Record<string, never>;

export type CustomPropertyTypeDefinitionInput<
  TypeName extends string = string,
  ValueInput = unknown,
  CreateExtraSchema extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined = undefined,
  UpdateExtraSchema extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined = undefined,
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
    inputSchema: z.ZodType<ValueInput, z.ZodTypeDef, unknown>;

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
    createExtraSchema?: z.ZodObject<Record<string, z.ZodTypeAny>>;
    updateExtraSchema?: z.ZodObject<Record<string, z.ZodTypeAny>>;
    createPropertySchema: z.ZodType<BaseCreateFields<string>>;
    updatePropertySchema: z.ZodType<BaseUpdateFields>;
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
    inputSchema: z.ZodType<unknown, z.ZodTypeDef, unknown>;
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
const baseCreatePropertySchema = z.object({
  name: customPropertyDefinitionNameSchema,
  description: customPropertyDefinitionDescriptionSchema.optional(),
  displayOrder: customPropertyDefinitionDisplayOrderSchema.optional(),
});

const baseUpdatePropertySchema = z.object({
  name: customPropertyDefinitionNameSchema.optional(),
  description: customPropertyDefinitionDescriptionSchema.nullable().optional(),
  displayOrder: customPropertyDefinitionDisplayOrderSchema.optional(),
});

type BaseCreateSchemaShape = typeof baseCreatePropertySchema.shape;
type BaseUpdateSchemaShape = typeof baseUpdatePropertySchema.shape;

type CreatePropertySchemaFor<T extends string, Extra extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined>
  = Extra extends z.ZodObject<infer E extends z.ZodRawShape>
    ? z.ZodObject<{ type: z.ZodLiteral<T> } & BaseCreateSchemaShape & E>
    : z.ZodObject<{ type: z.ZodLiteral<T> } & BaseCreateSchemaShape>;

type UpdatePropertySchemaFor<Extra extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined>
  = Extra extends z.ZodObject<infer E extends z.ZodRawShape>
    ? z.ZodObject<BaseUpdateSchemaShape & E>
    : z.ZodObject<BaseUpdateSchemaShape>;

function buildCreatePropertySchema(typeName: string, extraSchema?: z.ZodObject<z.ZodRawShape>) {
  const schema = baseCreatePropertySchema.extend({ type: z.literal(typeName) });

  return extraSchema ? schema.merge(extraSchema) : schema;
}

function buildUpdatePropertySchema(extraSchema?: z.ZodObject<z.ZodRawShape>) {
  return extraSchema ? baseUpdatePropertySchema.merge(extraSchema) : baseUpdatePropertySchema;
}

export function defineCustomPropertyType<
  TypeName extends string,
  ValueInput,
  CreateExtraSchema extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined = undefined,
  UpdateExtraSchema extends z.ZodObject<Record<string, z.ZodTypeAny>> | undefined = undefined,
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
