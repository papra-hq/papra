import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../../config/config.test-utils';
import { usersTable } from '../../../users/users.table';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createServer } from '../../server';
import { generateUserJwt } from '../auth.services';

describe('auth routes e2e', () => {
  describe('logout', () => {
    test('when login out, if no refresh token is present in cookies, the logout should succeed, nothing happens', async () => {
      const jwtSecret = 'jwt-secret';
      const { db } = await createInMemoryDatabase();
      const { app } = createServer({ db, config: overrideConfig({ auth: { jwtSecret } }) });

      await db
        .insert(usersTable)
        .values({
          email: 'foo@example.com',
          id: 'user-1',
        })
        .returning()
        .execute();

      const { token } = await generateUserJwt({ userId: 'user-1', jwtSecret });

      const response = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).to.eql(204);
    });

    // test('if a refresh token is present in request cookies and in db, it should be deleted from the cookies and db', async () => {
    //   const { request, db, createAuthHeaderForUser } = await setupTestApp({ config: { auth: { jwtRefreshSecret: 'jwt-refresh-token-secret' } } });

    //   const [user] = await db
    //     .insert(usersTable)
    //     .values({
    //       email: 'foo@example.com',
    //       id: 'cbu-1',
    //     })
    //     .returning()
    //     .execute();

    //   await db.insert(authTokensTable).values({
    //     token: 'refresh-token-value',
    //     userId: 'cbu-1',
    //     expiresAt: new Date('3000-01-01'),
    //   }).execute();

    //   const initialTokens = await db.select().from(authTokensTable).execute();

    //   expect(
    //     _.map(initialTokens, ({ token, userId }) => ({ token, userId })),
    //   ).to.eql([
    //     { token: 'refresh-token-value', userId: 'cbu-1' },
    //   ]);

    //   const response = await request({
    //     url: '/api/auth/logout',
    //     method: 'POST',
    //     headers: {
    //       ...await createAuthHeaderForUser({ userId: user.id }),
    //       Cookie: 'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYnVfMDFqMmh5YXF6MTQzanl5eGhtN2I4YnBlc2siLCJleHAiOjE3MjQzNTU2OTd9.GRjXLWdQAIa05OnlMLvNlODl0TNJUnPggO4BUJ_FMxQ',
    //     },
    //   });

    //   expect(response.status).to.eql(204);

    //   const authTokens = await db.select().from(authTokensTable).execute();

    //   expect(_.size(authTokens)).to.eql(0, 'The refresh token should have been deleted from the db');
    // });

    test('if the user is not logged in, the logout rejects with 401', async () => {
      const { db } = await createInMemoryDatabase();
      const { app } = createServer({ db });

      const response = await app.request('/api/auth/logout', {
        method: 'POST',
      });

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: { code: 'auth.unauthorized', message: 'Unauthorized' },
      });
    });
  });
});
