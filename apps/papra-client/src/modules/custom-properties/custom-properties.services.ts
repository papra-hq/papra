import type { AsDto } from '../shared/http/http-client.types';
import type { CustomPropertyDefinition, CustomPropertyType } from './custom-properties.types';
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
  const { definition } = await apiClient<{ definition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'GET',
  });

  return {
    definition: coerceDates(definition),
  };
}

export async function createCustomPropertyDefinition({
  organizationId,
  propertyDefinition,
}: {
  organizationId: string;
  propertyDefinition: {
    name: string;
    description?: string;
    type: CustomPropertyType;
    options?: { name: string }[];
  };
}) {
  const { propertyDefinition: created } = await apiClient<{ propertyDefinition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties`,
    method: 'POST',
    body: propertyDefinition,
  });

  return {
    propertyDefinition: coerceDates(created),
  };
}

export async function updateCustomPropertyDefinition({
  organizationId,
  propertyDefinitionId,
  propertyDefinition,
}: {
  organizationId: string;
  propertyDefinitionId: string;
  propertyDefinition: {
    name?: string;
    description?: string;
    options?: { id?: string; name: string }[];
  };
}) {
  const { propertyDefinition: updated } = await apiClient<{ propertyDefinition: AsDto<CustomPropertyDefinition> }>({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'PUT',
    body: propertyDefinition,
  });

  return {
    propertyDefinition: coerceDates(updated),
  };
}

export async function deleteCustomPropertyDefinition({
  organizationId,
  propertyDefinitionId,
}: {
  organizationId: string;
  propertyDefinitionId: string;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/custom-properties/${propertyDefinitionId}`,
    method: 'DELETE',
  });
}

export async function setDocumentCustomPropertyValue({
  organizationId,
  documentId,
  propertyDefinitionId,
  value,
}: {
  organizationId: string;
  documentId: string;
  propertyDefinitionId: string;
  value: string | number | boolean | string[];
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/documents/${documentId}/custom-properties/${propertyDefinitionId}`,
    method: 'PUT',
    body: { value },
  });
}

export async function deleteDocumentCustomPropertyValue({
  organizationId,
  documentId,
  propertyDefinitionId,
}: {
  organizationId: string;
  documentId: string;
  propertyDefinitionId: string;
}) {
  await apiClient({
    path: `/api/organizations/${organizationId}/documents/${documentId}/custom-properties/${propertyDefinitionId}`,
    method: 'DELETE',
  });
}
