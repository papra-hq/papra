import type { RouteDefinitionContext } from '../server.types';

export function registerAuthRoutes({ app, auth }: RouteDefinitionContext) {
  app.on(
    ['POST', 'GET'],
    '/api/auth/*',
    context => auth.handler(context.req.raw),
  );

  app.use('*', async (context, next) => {
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
