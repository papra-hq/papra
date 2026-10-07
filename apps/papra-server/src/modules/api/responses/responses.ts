export function jsonResponse(body: unknown, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function apiErrorResponse({
  status,
  message,
  code,
  ...rest
}: {
  status: number;
  message: string;
  code: string;
  [key: string]: unknown;
}) {
  return jsonResponse(
    {
      error: {
        message,
        code,
        ...rest,
      },
    },
    { status },
  );
}

export function apiValidationErrorResponse(details: { path?: string | null; message: string }[]) {
  return apiErrorResponse({
    status: 400,
    message: 'Bad request',
    code: 'api.validation_error',
    details,
  });
}

export function internalServerErrorResponse() {
  return apiErrorResponse({
    status: 500,
    message: 'Internal server error',
    code: 'api.internal-error',
  });
}
