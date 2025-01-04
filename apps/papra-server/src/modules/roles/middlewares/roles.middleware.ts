import type { ServerInstanceGenerics } from '../../app/server.types';
import type { Role } from '../roles.types';
import { createMiddleware } from 'hono/factory';
import { createForbiddenError } from '../../app/auth/auth.errors';
import { areSomeRolesInJwtPayload } from '../roles.models';

export function createRoleGuardMiddleware({ allowedRoles }: { allowedRoles: Role[] }) {
  return createMiddleware<ServerInstanceGenerics>(async (context, next) => {
    const jwtPayload = context.get('jwtPayload');

    const hasRole = areSomeRolesInJwtPayload({
      roles: allowedRoles,
      jwtPayload,
    });

    if (!hasRole) {
      throw createForbiddenError();
    }

    await next();
  });
}

export const adminGuardMiddleware = createRoleGuardMiddleware({ allowedRoles: ['admin'] });
