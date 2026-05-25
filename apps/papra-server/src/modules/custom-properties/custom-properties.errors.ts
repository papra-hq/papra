import { createErrorFactory } from '../shared/errors/errors';

export const createCustomPropertyDefinitionNotFoundError = createErrorFactory({
  message: 'Custom property definition not found.',
  code: 'custom_property_definition.not_found',
  statusCode: 404,
});

export const createCustomPropertyDefinitionAlreadyExistsError = createErrorFactory({
  message: 'A custom property definition with this name or key already exists in this organization.',
  code: 'custom_property_definition.already_exists',
  statusCode: 409,
});

export const createCustomPropertyValueInvalidError = createErrorFactory({
  message: 'The provided value is invalid for this property type.',
  code: 'custom_property_value.invalid',
  statusCode: 400,
});

export const createCustomPropertyTypeChangeNotAllowedError = createErrorFactory({
  message: 'Changing the type of a custom property definition is not allowed.',
  code: 'custom_property_definition.type_change_not_allowed',
  statusCode: 400,
});

export const createCustomPropertyDefinitionInvalidUpdateError = createErrorFactory({
  message: 'The provided update data is invalid for this property type.',
  code: 'custom_property_definition.invalid_update',
  statusCode: 400,
});

export const createOrganizationCustomPropertyLimitReachedError = createErrorFactory({
  message: 'The maximum number of custom properties for this organization has been reached.',
  code: 'custom_property_definition.organization_limit_reached',
  statusCode: 403,
});

export const createCustomPropertyUserNotFoundError = createErrorFactory({
  message: 'One or more provided user IDs are not members of this organization.',
  code: 'custom_property_value.user_not_found',
  statusCode: 400,
});

export const createCustomPropertyRelatedDocumentNotFoundError = createErrorFactory({
  message: 'One or more provided document IDs do not belong to this organization.',
  code: 'custom_property_value.related_document_not_found',
  statusCode: 400,
});
