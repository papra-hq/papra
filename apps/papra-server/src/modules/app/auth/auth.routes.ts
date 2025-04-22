import type { Context, RouteDefinitionContext } from '../server.types';
import type { Session } from './auth.types';
import { get } from 'lodash-es';

export function registerAuthRoutes({ app, auth, config }: RouteDefinitionContext) {
  app.on(
    ['POST', 'GET'],
    '/api/auth/*',
    context => auth.handler(context.req.raw),
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
      const overrideUserId = get(context.env, 'loggedInUserId') as string | undefined;

      if (overrideUserId) {
        context.set('userId', overrideUserId);
        context.set('session', {} as Session);
        context.set('authType', 'session');
      }

      return next();
    });
  }
}
