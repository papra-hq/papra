import type { RouteDefinitionContext } from '../app/server.types';
import { get, pick } from 'lodash-es';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization, ensureUserIsOwnerOfOrganization, getOrCreateOrganizationCustomerId } from '../organizations/organizations.usecases';
import { FREE_PLAN_ID, PLUS_PLAN_ID } from '../plans/plans.constants';
import { createPlansRepository } from '../plans/plans.repository';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { createError } from '../shared/errors/errors';
import { getHeader } from '../shared/headers/headers.models';
import { createLogger } from '../shared/logger/logger';
import { isNil } from '../shared/utils';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createInvalidWebhookPayloadError, createOrganizationAlreadyHasSubscriptionError } from './subscriptions.errors';
import { isSignatureHeaderFormatValid } from './subscriptions.models';
import { createSubscriptionsRepository } from './subscriptions.repository';
import { handleStripeWebhookEvent } from './subscriptions.usecases';

const logger = createLogger({ namespace: 'subscriptions.routes' });

export function registerSubscriptionsRoutes(context: RouteDefinitionContext) {
  setupStripeWebhookRoute(context);
  setupCreateCheckoutSessionRoute(context);
  setupGetCustomerPortalRoute(context);
  getOrganizationSubscriptionRoute(context);
}

function setupStripeWebhookRoute({ app, config, db, subscriptionsServices }: RouteDefinitionContext) {
  app.post('/api/stripe/webhook', async (context) => {
    const signature = getHeader({ context, name: 'stripe-signature' });

    if (!isSignatureHeaderFormatValid(signature)) {
      throw createInvalidWebhookPayloadError();
    }

    const payload = await context.req.text();
    const plansRepository = createPlansRepository({ config });
    const subscriptionsRepository = createSubscriptionsRepository({ db });

    const { event } = await subscriptionsServices.parseWebhookEvent({ payload, signature });

    logger.info(
      {
        event: pick(event, ['id', 'type']),
        customerId: get(event, 'data.object.customer'),
      },
      'Stripe webhook received',
    );

    await handleStripeWebhookEvent({
      event,
      plansRepository,
      subscriptionsRepository,
    });

    return context.body(null, 204);
  });
}

function setupCreateCheckoutSessionRoute({ app, config, db, subscriptionsServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/checkout-session',
    requireAuthentication(),
    validateJsonBody(z.object({
      planId: z.enum([PLUS_PLAN_ID]),
    })),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const plansRepository = createPlansRepository ({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      const { planId } = context.req.valid('json');
      const { organizationId } = context.req.valid('param');

      await ensureUserIsOwnerOfOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const { organizationPlan: organizationCurrentPlan } = await getOrganizationPlan({ organizationId, subscriptionsRepository, plansRepository });

      if (organizationCurrentPlan.id !== FREE_PLAN_ID) {
        throw createOrganizationAlreadyHasSubscriptionError();
      }

      const { organizationPlan: organizationPlanToSubscribeTo } = await plansRepository.getOrganizationPlanById({ planId });

      if (isNil(organizationPlanToSubscribeTo.priceId)) {
        // Very unlikely to happen, as only the free plan does not have a price ID, and we check for the plans in the route validation
        // but for type safety, we assert that the price ID is set
        throw createError({
          message: 'Organization plan price ID is not set',
          code: 'plans.organization_plan_price_id_not_set',
          statusCode: 500,
          isInternal: true,
        });
      }

      const { customerId } = await getOrCreateOrganizationCustomerId({ organizationId, subscriptionsServices, organizationsRepository });
      const { membersCount } = organizationPlanToSubscribeTo.isPerSeat ? await organizationsRepository.getOrganizationMembersCount({ organizationId }) : ({ membersCount: 1 });

      const { checkoutUrl } = await subscriptionsServices.createCheckoutUrl({
        customerId,
        priceId: organizationPlanToSubscribeTo.priceId,
        seatsCount: membersCount,
      });

      return context.json({ checkoutUrl });
    },
  );
}

function setupGetCustomerPortalRoute({ app, db, subscriptionsServices }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/customer-portal',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsOwnerOfOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { customerId } = await getOrCreateOrganizationCustomerId({ organizationId, subscriptionsServices, organizationsRepository });

      const { customerPortalUrl } = await subscriptionsServices.getCustomerPortalUrl({ customerId });

      return context.json({ customerPortalUrl });
    },
  );
}

function getOrganizationSubscriptionRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/subscription',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      await ensureUserIsInOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { subscription } = await subscriptionsRepository.getOrganizationSubscription({
        organizationId,
      });

      return context.json({
        subscription: pick(subscription, [
          'status',
          'currentPeriodEnd',
          'currentPeriodStart',
          'cancelAtPeriodEnd',
          'planId',
          'seatsCount',
        ]),
      });
    },
  );
}
