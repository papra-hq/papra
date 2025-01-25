import type { ValidationTargets } from 'hono';
import type z from 'zod';
import { validator } from 'hono/validator';

function formatValidationError({ error }: { error: z.ZodError }) {
  const details = (error.errors ?? []).map((e) => {
    return {
      ...(e.path.length === 0 ? {} : { path: e.path.join('.') }),
      message: e.message,
    };
  });

  return details;
}

function buildValidator<Target extends keyof ValidationTargets>({ target, error }: { target: Target; error: { message: string; code: string } }) {
  return <Schema extends z.ZodTypeAny>(schema: Schema, { allowAdditionalFields = false }: { allowAdditionalFields?: boolean } = {}) => {
    return validator(target, (value, context) => {
      // @ts-expect-error try to enforce strict mode
      const refinedSchema = allowAdditionalFields ? schema : (schema.strict?.() ?? schema);

      const result = refinedSchema.safeParse(value);

      if (result.success) {
        return result.data as z.infer<Schema>;
      }

      const details = formatValidationError({ error: result.error });

      return context.json(
        {
          error: {
            ...error,
            details,
          },
        },
        400,
      );
    });
  };
}

export const validateJsonBody = buildValidator({ target: 'json', error: { message: 'Invalid request body', code: 'server.invalid_request.body' } });
export const validateQuery = buildValidator({ target: 'query', error: { message: 'Invalid query parameters', code: 'server.invalid_request.query' } });
export const validateParams = buildValidator({ target: 'param', error: { message: 'Invalid URL parameters', code: 'server.invalid_request.params' } });
export const validateFormData = buildValidator({ target: 'form', error: { message: 'Invalid form data', code: 'server.invalid_request.form_data' } });
