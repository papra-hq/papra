export function isAzureBlobAlreadyExistsError({
  error,
}: {
  error: Error & { code?: unknown; statusCode?: unknown };
}) {
  return (
    error.code === 'BlobAlreadyExists' ||
    error.code === 'ConditionNotMet' ||
    error.statusCode === 409 ||
    error.statusCode === 412
  );
}

export function isAzureBlobNotFoundError({
  error,
}: {
  error: Error & { code?: unknown; statusCode?: unknown };
}) {
  return error.code === 'BlobNotFound' || error.statusCode === 404;
}
