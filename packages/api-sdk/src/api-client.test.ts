import type { Client } from './api-client';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { createClient } from './api-client';

const user = {
  id: 'usr_alice',
  email: 'alice@example.com',
  name: 'Alice',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  twoFactorEnabled: false,
};

describe('createClient', () => {
  test('registry methods use session credentials and custom headers without adding an API key', async () => {
    const requests: Request[] = [];
    const headers = new Headers({ 'Cookie': 'session=alice', 'X-Custom': 'value' });
    const client = createClient({
      apiBaseUrl: 'https://papra.example',
      credentials: 'include',
      headers,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requests.push(request);
        return Response.json({ user: { ...user, permissions: [] } });
      },
    });

    expect(await client.getCurrentUser()).toEqual({ user: { ...user, permissions: [] } });
    expect(requests[0]?.url).toEqual('https://papra.example/api/users/me');
    expect(requests[0]?.method).toEqual('GET');
    expect(requests[0]?.credentials).toEqual('include');
    expect(requests[0]?.headers.get('Authorization')).toEqual(null);
    expect(requests[0]?.headers.get('Cookie')).toEqual('session=alice');
    expect(requests[0]?.headers.get('X-Custom')).toEqual('value');
    expect(requests[0]?.headers.get('X-Papra-Source')).toMatch(/^papra-api-sdk-javascript\//);
    expect(headers.has('X-Papra-Source')).toEqual(false);
  });

  test('the update method sends a JSON body and returns validated wire dates', async () => {
    const requests: Request[] = [];
    const client = createClient({
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ user: { ...user, name: 'Updated Alice' } });
      },
    });

    const result = await client.updateCurrentUser({ body: { name: '  Updated Alice  ' } });

    expect(result).toEqual({ user: { ...user, name: 'Updated Alice' } });
    expect(requests[0]?.url).toEqual('https://api.papra.app/api/users/me');
    expect(requests[0]?.method).toEqual('PUT');
    expect(await requests[0]?.json()).toEqual({ name: '  Updated Alice  ' });
    expectTypeOf(result.user.createdAt).toEqualTypeOf<string>();
    expectTypeOf(result.user.updatedAt).toEqualTypeOf<string>();
    expectTypeOf<Parameters<Client['updateCurrentUser']>[0]>().toMatchTypeOf<{
      body: { name: string };
    }>();
  });

  test('unmigrated methods retain API key authentication and organization scoping', async () => {
    const requests: Request[] = [];
    const client = createClient({
      apiKey: 'ppapi_test',
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ tags: [] });
      },
    });

    expect(await client.forOrganization('org_123').listTags()).toEqual({ tags: [] });
    expect(requests[0]?.url).toEqual('https://api.papra.app/api/organizations/org_123/tags');
    expect(requests[0]?.headers.get('Authorization')).toEqual('Bearer ppapi_test');
  });

  test('legacy document uploads remain multipart requests', async () => {
    const requests: Request[] = [];
    const client = createClient({
      apiKey: 'ppapi_test',
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ document: { id: 'doc_123' } });
      },
    });

    await client
      .forOrganization('org_123')
      .uploadDocument({ file: new File(['hello'], 'hello.txt', { type: 'text/plain' }) });

    expect(requests[0]?.method).toEqual('POST');
    expect(requests[0]?.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
    const form = await requests[0]?.formData();
    const file = form?.get('file');
    expect(file).toBeInstanceOf(File);
    if (!(file instanceof File)) {
      throw new Error('Expected the uploaded file');
    }
    expect(file.name).toEqual('hello.txt');
    expect(await file.text()).toEqual('hello');
  });
});
