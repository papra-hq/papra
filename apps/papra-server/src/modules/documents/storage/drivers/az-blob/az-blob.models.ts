export function isAzureBlobAlreadyExistsError({ error }: { error: Error & { code?: unknown; statusCode?: unknown } }) {
  return error.code === 'BlobAlreadyExists' || error.statusCode === 409;
}

export function isAzureBlobNotFoundError({ error }: { error: Error & { code?: unknown; statusCode?: unknown } }) {
  return error.code === 'BlobNotFound' || error.statusCode === 404;
}
