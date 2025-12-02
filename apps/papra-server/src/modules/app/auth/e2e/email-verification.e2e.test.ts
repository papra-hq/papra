import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../../config/config.test-utils';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createEventServices } from '../../events/events.services';
import { createServer } from '../../server';
import { createTestServerDependencies } from '../../server.test-utils';
import { createAuthEmailsServices } from '../auth.emails.services';
import { getAuth } from '../auth.services';

function createTestEmailServices() {
  const args: Array<{ to: string; subject: string; html: string }> = [];

  return {
    name: 'test',
    sendEmail: async (emailArgs: { to: string; subject: string; html: string }) => {
      args.push(emailArgs);
    },
    getSentEmails: () => args,
    clear: () => {
      args.length = 0;
    },
  };
}

describe('email verification e2e', () => {
  describe('signup with email verification', () => {
    describe('when email verification is required, the verification email is sent during signup', () => {
      test('an email is sent after signup with verification URL', async () => {
        const { db } = await createInMemoryDatabase();
        const mockEmailsServices = createTestEmailServices();

        const config = overrideConfig({
          auth: {
            isEmailVerificationRequired: true,
          },
        });

        const authEmailsServices = createAuthEmailsServices({ emailsServices: mockEmailsServices });
        const { auth } = getAuth({ db, config, authEmailsServices, eventServices: createEventServices() });

        const { app } = createServer(createTestServerDependencies({ db, config, auth }));

        const response = await app.request('/api/auth/sign-up/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
            name: 'Test User',
          }),
        });

        expect(response.status).to.eql(200);

        expect(
          mockEmailsServices.getSentEmails().map(({ to, subject }) => ({ to, subject })),
        ).to.eql([
          {
            to: 'test@example.com',
            subject: 'Verify your email',
          },
        ]);
      });
    });

    describe('when email verification is required, users cannot login without verifying their email', () => {
      test('login attempt without verified email returns an error', async () => {
        const { db } = await createInMemoryDatabase();
        const mockEmailsServices = createTestEmailServices();

        const config = overrideConfig({
          auth: {
            isEmailVerificationRequired: true,
          },
        });

        const authEmailsServices = createAuthEmailsServices({ emailsServices: mockEmailsServices });
        const { auth } = getAuth({ db, config, authEmailsServices, eventServices: createEventServices() });

        const { app } = createServer(createTestServerDependencies({ db, config, auth }));

        // First, sign up
        await app.request('/api/auth/sign-up/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
            name: 'Test User',
          }),
        });

        // Clear sent emails to check if login triggers another email
        mockEmailsServices.clear();

        // Try to login without verifying
        const loginResponse = await app.request('/api/auth/sign-in/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
          }),
        });

        // Better auth returns 403 for unverified email
        expect(loginResponse.status).to.eql(403);

        expect(
          await loginResponse.json(),
        ).to.eql({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email not verified',
        });

        // An email should be sent on sign-in attempt with unverified email (per config: sendOnSignIn: true)
        expect(mockEmailsServices.getSentEmails()).toHaveLength(1);
        expect(mockEmailsServices.getSentEmails()[0]?.subject).to.eql('Verify your email');
      });
    });

    describe('when email verification is disabled, no verification email is sent', () => {
      test('signup without email verification requirement does not send email', async () => {
        const { db } = await createInMemoryDatabase();
        const mockEmailsServices = createTestEmailServices();

        const config = overrideConfig({
          auth: {
            isEmailVerificationRequired: false,
          },
        });

        const authEmailsServices = createAuthEmailsServices({ emailsServices: mockEmailsServices });
        const { auth } = getAuth({ db, config, authEmailsServices, eventServices: createEventServices() });

        const { app } = createServer(createTestServerDependencies({ db, config, auth }));

        const response = await app.request('/api/auth/sign-up/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
            name: 'Test User',
          }),
        });

        expect(response.status).to.eql(200);
        expect(mockEmailsServices.getSentEmails()).toHaveLength(0);
      });

      test('users can login immediately after signup when email verification is disabled', async () => {
        const { db } = await createInMemoryDatabase();
        const mockEmailsServices = createTestEmailServices();

        const config = overrideConfig({
          auth: {
            isEmailVerificationRequired: false,
          },
        });

        const authEmailsServices = createAuthEmailsServices({ emailsServices: mockEmailsServices });
        const { auth } = getAuth({ db, config, authEmailsServices, eventServices: createEventServices() });

        const { app } = createServer(createTestServerDependencies({ db, config, auth }));

        // Sign up
        await app.request('/api/auth/sign-up/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
            name: 'Test User',
          }),
        });

        // Login immediately without verification
        const loginResponse = await app.request('/api/auth/sign-in/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongPassword123!',
          }),
        });

        expect(loginResponse.status).to.eql(200);
        expect(mockEmailsServices.getSentEmails()).toHaveLength(0);

        const loginBody: any = await loginResponse.json();
        expect(loginBody).to.have.property('user');
        // eslint-disable-next-line ts/no-unsafe-member-access
        expect(loginBody?.user?.email).to.eql('test@example.com');
      });
    });
  });
});
