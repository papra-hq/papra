import type { ServerInstanceGenerics } from '../../server.types';
import { createMiddleware } from 'hono/factory';
import { get, isString } from 'lodash-es';
import { ADMIN_ROLE } from '../../../roles/roles.constants';
import { areSomeRolesInJwtPayload } from '../../../roles/roles.models';
import { getImpersonatedUserIdFromHeader } from '../../../shared/headers/headers.models';
import { addLogContext } from '../../../shared/logger/logger';
import { createForbiddenError } from '../auth.errors';

export const impersonationMiddleware = createMiddleware<ServerInstanceGenerics>(async (context, next) => {
  const jwtPayload = context.get('jwtPayload');
  const authUserId = get(jwtPayload, 'sub') as string;

  if (!isString(authUserId)) {
    throw createForbiddenError();
  }

  const { impersonatedUserId } = getImpersonatedUserIdFromHeader({ context });

  if (impersonatedUserId && !isString(impersonatedUserId)) {
    throw createForbiddenError();
  }

  const isAdmin = areSomeRolesInJwtPayload({ roles: [ADMIN_ROLE], jwtPayload });

  if (impersonatedUserId && !isAdmin) {
    throw createForbiddenError();
  }

  const userId = impersonatedUserId ?? authUserId;

  context.set('authUserId', authUserId);
  context.set('userId', userId);

  addLogContext({ userId, authUserId });

  await next();
});
