import type { ValidationTargets } from 'hono';
import { validator } from 'hono/validator';
import * as v from 'valibot';

function formatValidationIssues(issues: v.GenericIssue[]) {
  return issues.map((issue) => {
    return {
      path: v.getDotPath(issue),
      message: issue.message,
    };
  });
}

function buildValidator<Target extends keyof ValidationTargets>({ target, error }: { target: Target; error: { message: string; code: string } }) {
  return <Schema extends v.GenericSchema>(schema: Schema) => validator(target, (value, context) => {
    const result = v.safeParse(schema, value);

    if (result.success) {
      return result.output;
    }

    return context.json(
      {
        error: {
          ...error,
          details: formatValidationIssues(result.issues),
        },
      },
      400,
    );
  });
}

export const validateJsonBody = buildValidator({ target: 'json', error: { message: 'Invalid request body', code: 'server.invalid_request.body' } });
export const validateQuery = buildValidator({ target: 'query', error: { message: 'Invalid query parameters', code: 'server.invalid_request.query' } });
export const validateParams = buildValidator({ target: 'param', error: { message: 'Invalid URL parameters', code: 'server.invalid_request.params' } });
export const validateFormData = buildValidator({ target: 'form', error: { message: 'Invalid form data', code: 'server.invalid_request.form_data' } });
