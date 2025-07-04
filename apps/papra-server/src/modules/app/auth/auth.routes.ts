import type { Context, RouteDefinitionContext } from '../server.types';
import type { Session } from './auth.types';
import { get } from 'lodash-es';
import { isDefined } from '../../shared/utils';

export function registerAuthRoutes({ app, auth, config }: RouteDefinitionContext) {
  app.on(
    ['POST', 'GET'],
    '/api/auth/*',
    async context => auth.handler(context.req.raw),
  );

  app.use('*', async (context: Context, next) => {
    const session = await auth.api.getSession({ headers: context.req.raw.headers });

    if (session) {
      context.set('userId', session.user.id);
      context.set('session', session.session);
      context.set('authType', 'session');
    }

    return next();
  });

  if (config.env === 'test') {
    app.use('*', async (context: Context, next) => {
      const overrideUserId: unknown = get(context.env, 'loggedInUserId');

      if (isDefined(overrideUserId) && typeof overrideUserId === 'string') {
        context.set('userId', overrideUserId);
        context.set('session', {} as Session);
        context.set('authType', 'session');
      }

      return next();
    });
  }
}
