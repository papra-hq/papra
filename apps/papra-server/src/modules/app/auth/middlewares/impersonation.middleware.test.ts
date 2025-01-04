import type { Context } from '../../server.types';
import { describe, expect, test } from 'vitest';
import { impersonationMiddleware } from './impersonation.middleware';

function createContext({ jwtPayload, xUserId }: { jwtPayload: Record<string, unknown>; xUserId?: string }) {
  let isNextCalled = false;
  const contextDatas: Record<string, unknown> = {};

  const context = {
    get: (key: string) => {
      if (key === 'jwtPayload') {
        return jwtPayload;
      }

      throw new Error(`Unknown key: ${key}`);
    },
    set: (key: string, value: any) => {
      contextDatas[key] = value;
    },
    req: {
      header: (name: string) => {
        if (name === 'x-user-id') {
          return xUserId;
        }

        throw new Error(`Unknown header: ${name}`);
      },
    },
  } as Context;

  const next = async () => {
    isNextCalled = true;
  };

  return {
    context,
    getIsNextCalled: () => isNextCalled,
    getContextDatas: () => contextDatas,
    next,
  };
}

describe('impersonation middleware', () => {
  describe('impersonationMiddleware', () => {
    test('for the standard user, the userId is extracted from the sub field of the jwtPayload', async () => {
      const {
        context,
        getIsNextCalled,
        next,
        getContextDatas,
      } = createContext({ jwtPayload: { sub: '123' }, xUserId: undefined });

      await impersonationMiddleware(context, next);

      expect(getIsNextCalled()).to.eql(true);
      expect(getContextDatas()).to.eql({ authUserId: '123', userId: '123' });
    });

    test('when the userId in the jwtPayload is not a string, an error should be thrown', async () => {
      const {
        context,
        getIsNextCalled,
        next,
      } = createContext({
        jwtPayload: {
          sub: 123 as any,
        },
        xUserId: undefined,
      });

      await expect(impersonationMiddleware(context, next)).rejects.toThrowError('Forbidden');

      expect(getIsNextCalled()).to.eql(false);
    });

    test('when the x-user-id header is present and the user has the admin role, the userId is extracted from the x-user-id header and the authUserId is the one of the admin', async () => {
      const {
        context,
        getIsNextCalled,
        next,
        getContextDatas,
      } = createContext({
        jwtPayload: {
          sub: '123',
          roles: ['admin'],
        },
        xUserId: '456',
      });

      await impersonationMiddleware(context, next);

      expect(getIsNextCalled()).to.eql(true);
      expect(getContextDatas()).to.eql({ authUserId: '123', userId: '456' });
    });

    test('when the x-user-id header is present and the user does not have the admin role, an error should be thrown', async () => {
      const {
        context,
        getIsNextCalled,
        next,
      } = createContext({
        jwtPayload: {
          sub: '123',
          roles: [],
        },
        xUserId: '456',
      });

      await expect(impersonationMiddleware(context, next)).rejects.toThrowError('Forbidden');

      expect(getIsNextCalled()).to.eql(false);
    });

    test('when the x-user-id header is not a string, an error should be thrown', async () => {
      const {
        context,
        getIsNextCalled,
        next,
      } = createContext({
        jwtPayload: {
          sub: '123',
          roles: ['admin'],
        },
        xUserId: 456 as any,
      });

      await expect(impersonationMiddleware(context, next)).rejects.toThrowError('Forbidden');

      expect(getIsNextCalled()).to.eql(false);
    });

    test('when the x-user-id header is not present, the userId should be the same as the authUserId', async () => {
      const {
        context,
        getIsNextCalled,
        next,
        getContextDatas,
      } = createContext({
        jwtPayload: {
          sub: '123',
          roles: ['admin'],
        },
        xUserId: undefined,
      });

      await impersonationMiddleware(context, next);

      expect(getIsNextCalled()).to.eql(true);
      expect(getContextDatas()).to.eql({ authUserId: '123', userId: '123' });
    });
  });
});
