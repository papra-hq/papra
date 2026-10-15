import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createOrganizationTagContract } from './tags.api.contracts';

const bodySchema = createOrganizationTagContract.request.body['application/json'];

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
