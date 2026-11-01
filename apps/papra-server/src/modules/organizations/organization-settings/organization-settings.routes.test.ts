import { DEFAULT_TAGGING_PROMPT } from '../../document-enrichment/enrichment-capabilities/tags/tags.models';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../organizations.constants';
import { DEFAULT_FILENAME_PROMPT } from '../../document-enrichment/enrichment-capabilities/filename/filename.models';

const organizationId = 'org_222222222222222222222222';
const ownerId = 'usr_111111111111111111111111';
const memberId = 'usr_333333333333333333333333';
const path = `/api/organizations/${organizationId}/settings`;

async function setup() {
  const { db } = await createInMemoryDatabase({
    users: [
      { id: ownerId, email: 'owner@example.com' },
      { id: memberId, email: 'member@example.com' },
    ],
    organizations: [{ id: organizationId, name: 'Organization' }],
    organizationMembers: [
      { organizationId, userId: ownerId, role: ORGANIZATION_ROLES.OWNER },
      { organizationId, userId: memberId, role: ORGANIZATION_ROLES.MEMBER },
    ],
  });
  const { app } = createServer(
    createTestServerDependencies({
      db,
      config: overrideConfig({ env: 'test', documentsStorage: { driver: 'in-memory' } }),
    }),
  );
  const update = async (autoTagging: Record<string, unknown>, userId = ownerId) =>
    app.request(
      path,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai: { autoTagging } }),
      },
      { loggedInUserId: userId },
    );
  const read = async () => app.request(path, { method: 'GET' }, { loggedInUserId: ownerId });
  return { update, read };
}

describe('organization AI naming settings', () => {
  test('naming is opt-in and exposes generic default instructions', async () => {
    const { read } = await setup();
    const response = await read();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      organizationSettings: {
        ai: {
          autoTagging: {
            namingEnabled: false,
            separateNamingRequest: false,
            filenamePrompt: DEFAULT_FILENAME_PROMPT,
            taggingPrompt: DEFAULT_TAGGING_PROMPT,
          },
        },
      },
    });
  });
  test('owners can save instructions without enabling tagging and unrelated updates preserve them', async () => {
    const { update, read } = await setup();
    expect(
      (
        await update({
          namingEnabled: true,
          separateNamingRequest: true,
          filenamePrompt: 'Use French filenames.',
          taggingPrompt: 'Use short category labels.',
        })
      ).status,
    ).toBe(204);
    expect((await update({ maxTags: 3 })).status).toBe(204);
    expect(await (await read()).json()).toMatchObject({
      organizationSettings: {
        ai: {
          autoTagging: {
            isEnabled: false,
            namingEnabled: true,
            separateNamingRequest: true,
            filenamePrompt: 'Use French filenames.',
            taggingPrompt: 'Use short category labels.',
            maxTags: 3,
          },
        },
      },
    });
  });
  test('members cannot change AI naming settings', async () => {
    const { update, read } = await setup();
    expect((await update({ namingEnabled: true, taggingPrompt: 'Changed' }, memberId)).status).toBe(
      403,
    );
    expect(await (await read()).json()).toMatchObject({
      organizationSettings: { ai: { autoTagging: { namingEnabled: false } } },
    });
  });
  test.each(['filenamePrompt', 'taggingPrompt'])(
    'rejects oversized %s before saving',
    async (field) => {
      const { update } = await setup();
      expect((await update({ [field]: 'x'.repeat(8001) })).status).toBe(400);
    },
  );
});
