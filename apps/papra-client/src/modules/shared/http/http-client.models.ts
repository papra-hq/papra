export { buildAuthHeader, buildImpersonationHeader, getBody, isFetchResponseJson };

function isFetchResponseJson({ response }: { response: Response }): boolean {
  return Boolean(response.headers.get('content-type')?.includes('application/json'));
}

function getBody({ response }: { response: Response }): Promise<unknown> {
  try {
    return isFetchResponseJson({ response }) ? response.json() : response.text();
  } catch (_error) {
    return Promise.resolve({});
  }
}

function buildAuthHeader({ accessToken }: { accessToken?: string | null | undefined } = {}): Record<string, string> {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildImpersonationHeader({ impersonatedUserId }: { impersonatedUserId?: string | null | undefined } = {}): Record<string, string> {
  if (!impersonatedUserId) {
    return {};
  }

  return {
    'x-user-id': impersonatedUserId,
  };
}

export function getFormData(pojo: Record<string, unknown>): FormData {
  const formData = new FormData();
  Object.keys(pojo).forEach(key => formData.append(key, pojo[key] as string));
  return formData;
}
