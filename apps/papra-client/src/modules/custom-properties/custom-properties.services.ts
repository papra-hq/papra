import type { AsDto } from '../shared/http/http-client.types';
import type { CustomPropertyDefinition, CustomPropertyType, DocumentPropertyValue } from './custom-properties.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchCustomPropertyDefinitions({ organizationId }: { organizationId: string }) {
  const { propertyDefinitions } = await apiClient<{ propertyDefinitions: AsDto<CustomPropertyDefinition>[] }>({
    path: `/api/organizations/${organizationId}/custom-properties`,
    method: 'GET',
  });

  return {
    propertyDefinitions: propertyDefinitions.map(coerceDates),
  };
}

export async function fetchCustomPropertyDefinition({ organizationId, propertyDefinitionId }: { organizationId: string; propertyDefinitionId: string }) {
  const { propertyDefinition } = await apiClient<{ propertyDefinition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'GET',
  });

  return {
    propertyDefinition: coerceDates(propertyDefinition),
  };
}

export async function createCustomPropertyDefinition({ organizationId, name, description, type, color, isRequired, displayOrder, options }: {
  organizationId: string;
  name: string;
  description?: string | null;
  type: CustomPropertyType;
  color?: string | null;
  isRequired?: boolean;
  displayOrder?: number;
  options?: { value: string; color?: string | null; displayOrder?: number }[];
}) {
  const { propertyDefinition } = await apiClient<{ propertyDefinition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties`,
    method: 'POST',
    body: { name, description, type, color, isRequired, displayOrder, options },
  });

  return {
    propertyDefinition: coerceDates(propertyDefinition),
  };
}

export async function updateCustomPropertyDefinition({ organizationId, propertyDefinitionId, name, description, color, isRequired, displayOrder, options }: {
  organizationId: string;
  propertyDefinitionId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  isRequired?: boolean;
  displayOrder?: number;
  options?: { id?: string; value: string; color?: string | null; displayOrder?: number }[];
}) {
  const { propertyDefinition } = await apiClient<{ propertyDefinition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'PUT',
    body: { name, description, color, isRequired, displayOrder, options },
  });

  return {
    propertyDefinition: coerceDates(propertyDefinition),
  };
}

export async function deleteCustomPropertyDefinition({ organizationId, propertyDefinitionId }: { organizationId: string; propertyDefinitionId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'DELETE',
  });
}

export async function fetchDocumentPropertyValues({ organizationId, documentId }: { organizationId: string; documentId: string }) {
  const { propertyValues } = await apiClient<{ propertyValues: DocumentPropertyValue[] }>({
    path: `/api/organizations/${organizationId}/documents/${documentId}/custom-properties`,
    method: 'GET',
  });

  return {
    propertyValues,
  };
}

export async function setDocumentPropertyValue({ organizationId, documentId, propertyDefinitionId, value }: {
  organizationId: string;
  documentId: string;
  propertyDefinitionId: string;
  value: string | number | boolean | string[] | null;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/documents/${documentId}/custom-properties/${propertyDefinitionId}`,
    method: 'PUT',
    body: { value },
  });
}

export async function deleteDocumentPropertyValue({ organizationId, documentId, propertyDefinitionId }: {
  organizationId: string;
  documentId: string;
  propertyDefinitionId: string;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/documents/${documentId}/custom-properties/${propertyDefinitionId}`,
    method: 'DELETE',
  });
}
