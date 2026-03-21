import { createErrorFactory } from '../../shared/errors/errors';

export const createCustomPropertySelectOptionNotFoundError = createErrorFactory({
  message: 'The provided value is not a valid option for this select property.',
  code: 'custom_property_select_option.not_found',
  statusCode: 400,
});

export const createCustomPropertySelectOptionUnknownIdError = createErrorFactory({
  message: 'One or more provided select option IDs do not belong to this property definition.',
  code: 'custom_property_select_option.unknown_id',
  statusCode: 400,
});
