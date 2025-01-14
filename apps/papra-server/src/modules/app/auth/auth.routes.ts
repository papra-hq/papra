import type { ServerInstance } from '../server.types';

import { getConfig } from '../../config/config.models';
import { getDb } from '../database/database.models';
import { getAuth } from './auth.services';

export function registerAuthRoutes({ app }: { app: ServerInstance }) {
  app.on(['POST', 'GET'], '/api/auth/*', (context) => {
    const { db } = getDb({ context });
    const { config } = getConfig({ context });

    const { auth } = getAuth({ db, config });

    return auth.handler(context.req.raw);
  });

  app.use('*', async (context, next) => {
    const { db } = getDb({ context });
    const { config } = getConfig({ context });

    const { auth } = getAuth({ db, config });

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
