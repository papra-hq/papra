import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createOrganizationTagContract, updateOrganizationTagContract } from './tags.api.contracts';

const bodySchema = createOrganizationTagContract.request.body['application/json'];

describe('updateOrganizationTagContract', () => {
  const schema = updateOrganizationTagContract.request.body['application/json'];

  test('tag updates trim text and uppercase the color', () => {
    expect(
      v.parse(schema, {
        name: '  Finance  ',
        color: '#abcdef',
        description: '  Invoices and receipts  ',
      }),
    ).toEqual({
      name: 'Finance',
      color: '#ABCDEF',
      description: 'Invoices and receipts',
    });
  });

  test('every update field remains optional and descriptions can be cleared', () => {
    expect(v.parse(schema, {})).toEqual({});
    expect(v.parse(schema, { name: 'Finance' })).toEqual({ name: 'Finance' });
    expect(v.parse(schema, { color: '#abcdef' })).toEqual({ color: '#ABCDEF' });
    expect(v.parse(schema, { description: '  ' })).toEqual({ description: '' });
  });

  test('tag updates reject invalid values, nulls, and unknown fields', () => {
    expect(v.safeParse(schema, { name: '  ' }).success).toEqual(false);
    expect(v.safeParse(schema, { name: 'a'.repeat(65) }).success).toEqual(false);
    expect(v.safeParse(schema, { color: 'red' }).success).toEqual(false);
    expect(v.safeParse(schema, { description: 'a'.repeat(257) }).success).toEqual(false);
    expect(v.safeParse(schema, { name: null }).success).toEqual(false);
    expect(v.safeParse(schema, { color: null }).success).toEqual(false);
    expect(v.safeParse(schema, { description: null }).success).toEqual(false);
    expect(v.safeParse(schema, { name: 'Finance', extra: true }).success).toEqual(false);
  });

  test('both organization and tag IDs are required and validated', () => {
    const paramsSchema = updateOrganizationTagContract.request.params;
    const params = {
      organizationId: 'org_123456789012345678901234',
      tagId: 'tag_123456789012345678901234',
    };

    expect(v.parse(paramsSchema, params)).toEqual(params);
    expect(v.safeParse(paramsSchema, { organizationId: params.organizationId }).success).toEqual(
      false,
    );
    expect(v.safeParse(paramsSchema, { tagId: params.tagId }).success).toEqual(false);
    expect(v.safeParse(paramsSchema, { ...params, organizationId: 'invalid' }).success).toEqual(
      false,
    );
    expect(v.safeParse(paramsSchema, { ...params, tagId: 'invalid' }).success).toEqual(false);
  });
});

describe('createOrganizationTagContract', () => {
  test('tag creation trims text and uppercases the color', () => {
    expect(
      v.parse(bodySchema, {
        name: '  Finance  ',
        color: '#abcdef',
        description: '  Invoices and receipts  ',
      }),
    ).toEqual({
      name: 'Finance',
      color: '#ABCDEF',
      description: 'Invoices and receipts',
    });
  });

  test('the description can be omitted or empty, but not null', () => {
    const body = { name: 'Finance', color: '#ABCDEF' };

    expect(v.parse(bodySchema, body)).toEqual(body);
    expect(v.parse(bodySchema, { ...body, description: '  ' })).toEqual({
      ...body,
      description: '',
    });
    expect(v.safeParse(bodySchema, { ...body, description: null }).success).toEqual(false);
  });

  test('tag creation requires a valid name and color and rejects unknown fields', () => {
    expect(v.safeParse(bodySchema, { color: '#ABCDEF' }).success).toEqual(false);
    expect(v.safeParse(bodySchema, { name: 'Finance' }).success).toEqual(false);
    expect(v.safeParse(bodySchema, { name: '  ', color: '#ABCDEF' }).success).toEqual(false);
    expect(v.safeParse(bodySchema, { name: 'Finance', color: 'red' }).success).toEqual(false);
    expect(
      v.safeParse(bodySchema, { name: 'Finance', color: '#ABCDEF', extra: true }).success,
    ).toEqual(false);
  });
});
