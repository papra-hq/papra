import type { Context, RouteDefinitionContext } from '../server.types';
import type { Session } from './auth.types';
import { get } from 'lodash-es';
import { addLogContext } from '../../shared/logger/logger';
import { isDefined, isNil, isString } from '../../shared/utils';

export function registerAuthRoutes({ app, auth, config }: RouteDefinitionContext) {
  app.on(
    ['POST', 'GET'],
    '/api/auth/*',
    async (context, next) => {
      const expoOrigin = context.req.header('expo-origin');
      if (!isNil(expoOrigin)) {
        context.req.raw.headers.set('origin', expoOrigin);
      }
      return next();
    },
    async context => auth.handler(context.req.raw),
  );

  app.use('*', async (context: Context, next) => {
    const sessionData = await auth.api.getSession({ headers: context.req.raw.headers });

    if (sessionData) {
      const { user, session } = sessionData;
      const userId = user.id;
      const authType = 'session';

      context.set('userId', userId);
      context.set('session', session);
      context.set('authType', authType);

      addLogContext({ userId, authType, sessionId: session.id });
    }

    return next();
  });

  if (config.env === 'test') {
    app.use('*', async (context: Context, next) => {
      const overrideUserId: unknown = get(context.env, 'loggedInUserId');

      if (isDefined(overrideUserId) && isString(overrideUserId)) {
        context.set('userId', overrideUserId);
        context.set('session', {} as Session);
        context.set('authType', 'session');
      }

      return next();
    });
  }
}
