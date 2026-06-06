import { createErrorFactory } from '../shared/errors/errors';

export const createShareLinkNotFoundError = createErrorFactory({
  message: 'Share link not found.',
  code: 'share_link.not_found',
  statusCode: 404,
});

// 410 Gone: the link exists but is no longer usable (expired or disabled).
export const createShareLinkGoneError = createErrorFactory({
  message: 'Share link is no longer available.',
  code: 'share_link.gone',
  statusCode: 410,
});

export const createShareLinkPasswordRequiredError = createErrorFactory({
  message: 'A valid access token is required to access this share link.',
  code: 'share_link.password_required',
  statusCode: 401,
});

export const createShareLinkInvalidPasswordError = createErrorFactory({
  message: 'Invalid password.',
  code: 'share_link.invalid_password',
  statusCode: 401,
});

export const createShareLinkNotPasswordProtectedError = createErrorFactory({
  message: 'This share link is not password protected.',
  code: 'share_link.not_password_protected',
  statusCode: 400,
});

export const createShareLinkLimitReachedError = createErrorFactory({
  message: 'This document has reached the maximum number of share links.',
  code: 'share_link.limit_reached',
  statusCode: 409,
});
