import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createEventServices } from '../../app/events/events.services';
import { overrideConfig } from '../../config/config.test-utils';
import { nextTick } from '../../shared/async/defer.test-utils';
import { usersTable } from '../../users/users.table';
import { userRolesTable } from '../roles.table';
import { registerFirstUserAdminEventHandler } from './first-user-admin.user-created';

describe('first user admin assignment', () => {
  describe('when the feature is disabled', () => {
    test('the first user does not receive admin role', async () => {
      const user = { id: 'usr_1', email: 'first@example.com', createdAt: new Date('2026-01-01') };

      const { db } = await createInMemoryDatabase({ users: [user] });
      const eventServices = createEventServices();

      const config = overrideConfig({ auth: { firstUserAsAdmin: false } });

      registerFirstUserAdminEventHandler({ eventServices, config, db, logger: createNoopLogger() });

      eventServices.emitEvent({ eventName: 'user.created', payload: { userId: user.id, ...user } });

      await nextTick();

      const roles = await db.select().from(userRolesTable);
      expect(roles).to.deep.equal([]);
    });
  });

  describe('when the feature is enabled', () => {
    test('the first user receives the admin role automatically', async () => {
      const user = { id: 'usr_1', email: 'first@example.com', createdAt: new Date('2026-01-01') };

      const { db } = await createInMemoryDatabase({ users: [user] });
      const eventServices = createEventServices();

      const config = overrideConfig({ auth: { firstUserAsAdmin: true } });

      registerFirstUserAdminEventHandler({ eventServices, config, db, logger: createNoopLogger() });

      eventServices.emitEvent({ eventName: 'user.created', payload: { userId: user.id, ...user } });

      await nextTick();

      const roles = await db.select().from(userRolesTable);
      expect(
        roles.map(({ userId, role }) => ({ userId, role })),
      ).to.deep.equal([
        { userId: 'usr_1', role: 'admin' },
      ]);
    });

    test('if the first user already has an admin role, it does not fail', async () => {
      const user = { id: 'usr_1', email: 'first@example.com', createdAt: new Date('2026-01-01') };
      const { db } = await createInMemoryDatabase({
        users: [user],
        userRoles: [{ userId: user.id, role: 'admin' }],
      });
      const eventServices = createEventServices();

      const config = overrideConfig({ auth: { firstUserAsAdmin: true } });

      registerFirstUserAdminEventHandler({ eventServices, config, db, logger: createNoopLogger() });

      eventServices.emitEvent({ eventName: 'user.created', payload: { userId: user.id, ...user } });

      await nextTick();

      const roles = await db.select().from(userRolesTable);
      expect(
        roles.map(({ userId, role }) => ({ userId, role })),
      ).to.deep.equal([
        { userId: 'usr_1', role: 'admin' },
      ]);
    });

    test('the second user does not receive the admin role', async () => {
      const { db } = await createInMemoryDatabase();
      const eventServices = createEventServices();

      const config = overrideConfig({ auth: { firstUserAsAdmin: true } });

      registerFirstUserAdminEventHandler({ eventServices, config, db, logger: createNoopLogger() });

      const firstUser = { id: 'usr_1', email: 'first@example.com', createdAt: new Date('2026-01-01') };
      await db.insert(usersTable).values(firstUser);

      eventServices.emitEvent({ eventName: 'user.created', payload: { userId: firstUser.id, ...firstUser } });
      await nextTick();

      const secondUser = { id: 'usr_2', email: 'second@example.com', createdAt: new Date('2026-01-02') };
      await db.insert(usersTable).values(secondUser);

      eventServices.emitEvent({ eventName: 'user.created', payload: { userId: secondUser.id, ...secondUser } });
      await nextTick();

      const roles = await db.select().from(userRolesTable);
      expect(
        roles.map(({ userId, role }) => ({ userId, role })),
      ).to.deep.equal([
        { userId: 'usr_1', role: 'admin' },
      ]);
    });

    test('when multiple users are already created, no one receives the admin role', async () => {
      const users = [
        { id: 'usr_1', email: 'user1@example.com', createdAt: new Date('2026-01-01') },
        { id: 'usr_2', email: 'user2@example.com', createdAt: new Date('2026-01-01') },
      ].map(user => ({ ...user, userId: user.id }));

      const { db } = await createInMemoryDatabase({ users });
      const eventServices = createEventServices();

      const config = overrideConfig({ auth: { firstUserAsAdmin: true } });

      registerFirstUserAdminEventHandler({ eventServices, config, db, logger: createNoopLogger() });

      eventServices.emitEvent({ eventName: 'user.created', payload: users[0]! });
      eventServices.emitEvent({ eventName: 'user.created', payload: users[1]! });

      await nextTick();
      const roles = await db.select().from(userRolesTable);

      expect(roles.length).to.equal(0);
    });
  });
});
