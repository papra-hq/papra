import type { ServerInstance } from '../server.types';

export function registerAuthRoutes({ app }: { app: ServerInstance }) {
  app.on(['POST', 'GET'], '/api/auth/*', (context) => {
    const auth = context.get('auth');

    return auth.handler(context.req.raw);
  });

  app.use('*', async (context, next) => {
    const auth = context.get('auth');

    const session = await auth.api.getSession({ headers: context.req.raw.headers });

    if (!session) {
      context.set('user', null);
      context.set('session', null);
      return next();
    }

    context.set('user', session.user);
    context.set('session', session.session);
    return next();
  });
}
