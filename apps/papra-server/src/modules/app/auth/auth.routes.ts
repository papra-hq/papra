import type { Context, RouteDefinitionContext } from '../server.types';
import type { Session } from './auth.types';
import { addLogContext } from '../../shared/logger/logger';
import { isDefined, isNil } from '../../shared/utils';

function getOverrideUserId(context: Context): string | undefined {
  if (
    !isNil(context.env)
    && typeof context.env === 'object'
    && 'loggedInUserId' in context.env
    && typeof context.env.loggedInUserId === 'string'
  ) {
    return context.env.loggedInUserId;
  }

  return undefined;
}

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
      const overrideUserId = getOverrideUserId(context);

      if (isDefined(overrideUserId)) {
        context.set('userId', overrideUserId);
        context.set('session', {} as Session);
        context.set('authType', 'session');
      }

      return next();
    });
  }
}
