import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createAiCreditsRepository } from '../ai-credits/ai-credits.repository';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createIntakeEmailsRepository } from '../intake-emails/intake-emails.repository';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import {
  ensureUserIsInOrganization,
  ensureUserIsOwnerOfOrganization,
  getOrCreateOrganizationCustomerId,
} from '../organizations/organizations.usecases';
import { FREE_PLANS_IDS, PLAN_IDS } from '../plans/plans.constants';
import { getPriceIdForBillingInterval } from '../plans/plans.models';
import { createPlanEntitlementsRepository } from '../plan-entitlements/plan-entitlements.repository';
import { resolveOrganizationEntitlementCouponId } from '../plan-entitlements/plan-entitlements.usecases';
import { createPlansRepository } from '../plans/plans.repository';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { getHeader } from '../shared/headers/headers.models';
import { createLogger } from '../shared/logger/logger';
import { pick } from '../shared/objects';
import { nullifyPositiveInfinity } from '../shared/utils';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import {
  createInvalidWebhookPayloadError,
  createOrganizationAlreadyHasSubscriptionError,
} from './subscriptions.errors';
import { isSignatureHeaderFormatValid } from './subscriptions.models';
import { createSubscriptionsRepository } from './subscriptions.repository';
import { handleStripeWebhookEvent } from './subscriptions.usecases';

const logger = createLogger({ namespace: 'subscriptions.routes' });

export function registerSubscriptionsRoutes(context: RouteDefinitionContext) {
  setupStripeWebhookRoute(context);
  setupCreateCheckoutSessionRoute(context);
  setupGetCustomerPortalRoute(context);
  setupGetOrganizationSubscriptionRoute(context);
  setupGetOrganizationSubscriptionUsageRoute(context);
}

function setupStripeWebhookRoute({
  app,
  config,
  db,
  subscriptionsServices,
}: RouteDefinitionContext) {
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
        customerId: 'customer' in event.data.object ? event.data.object.customer : undefined,
      },
      'Stripe webhook received',
    );

    await handleStripeWebhookEvent({
      event,
      plansRepository,
      subscriptionsRepository,
      subscriptionsServices,
    });

    return context.body(null, 204);
  });
}

function setupCreateCheckoutSessionRoute({
  app,
  config,
  db,
  subscriptionsServices,
  planEntitlementDefinitionRegistry,
}: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/checkout-session',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        planId: v.picklist([PLAN_IDS.PLUS, PLAN_IDS.PRO]),
        billingInterval: v.optional(v.picklist(['monthly', 'annual']), 'monthly'),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      const { planId, billingInterval } = context.req.valid('json');
      const { organizationId } = context.req.valid('param');

      await ensureUserIsOwnerOfOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { organization } = await organizationsRepository.getOrganizationById({
        organizationId,
      });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const { organizationPlan: organizationCurrentPlan } = await getOrganizationPlan({
        organizationId,
        subscriptionsRepository,
        plansRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      if (!FREE_PLANS_IDS.includes(organizationCurrentPlan.id)) {
        throw createOrganizationAlreadyHasSubscriptionError();
      }

      const { organizationPlan: organizationPlanToSubscribeTo } =
        await plansRepository.getOrganizationPlanById({ planId });

      const { priceId } = getPriceIdForBillingInterval({
        plan: organizationPlanToSubscribeTo,
        billingInterval,
      });

      const { customerId } = await getOrCreateOrganizationCustomerId({
        organizationId,
        subscriptionsServices,
        organizationsRepository,
      });

      const { couponId: entitlementCouponId } = await resolveOrganizationEntitlementCouponId({
        organizationId,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      // Step 1: Expire any active checkout sessions before creating a new one
      // This allows subscriptions to be canceled (can't cancel while checkout is active)
      await subscriptionsServices.expireActiveCheckoutSessions({ customerId });

      // Step 2: Cancel any incomplete subscriptions from previous failed attempts
      // This prevents accumulating orphaned incomplete subscriptions
      const { subscriptions: allSubscriptions } =
        await subscriptionsRepository.getAllOrganizationSubscriptions({ organizationId });
      const incompleteSubscriptions = allSubscriptions.filter(
        (sub) => sub.status === 'incomplete' || sub.status === 'incomplete_expired',
      );

      // Now that checkout sessions are expired, we can cancel the subscriptions
      await Promise.allSettled(
        incompleteSubscriptions.map(async (sub) => {
          try {
            await subscriptionsServices.cancelSubscription({ subscriptionId: sub.id });
          } catch (error) {
            logger.warn(
              { subscriptionId: sub.id, error },
              'Failed to cancel incomplete subscription',
            );
          }
        }),
      );

      const { checkoutUrl } = await subscriptionsServices.createCheckoutUrl({
        customerId,
        priceId,
        organizationId,
        entitlementCouponId,
      });

      return context.json({ checkoutUrl });
    },
  );
}

function setupGetCustomerPortalRoute({ app, db, subscriptionsServices }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/customer-portal',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsOwnerOfOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { customerId } = await getOrCreateOrganizationCustomerId({
        organizationId,
        subscriptionsServices,
        organizationsRepository,
      });

      const { customerPortalUrl } = await subscriptionsServices.getCustomerPortalUrl({
        customerId,
      });

      return context.json({ customerPortalUrl });
    },
  );
}

function setupGetOrganizationSubscriptionRoute({ app, db, config }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/subscription',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const plansRepository = createPlansRepository({ config });

      await ensureUserIsInOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const { subscription } = await subscriptionsRepository.getActiveOrganizationSubscription({
        organizationId,
      });

      const { organizationPlan } = await plansRepository.getOrganizationPlanById({
        planId: subscription?.planId ?? PLAN_IDS.FREE,
      });

      return context.json({
        subscription: subscription
          ? pick(subscription, [
              'status',
              'currentPeriodEnd',
              'currentPeriodStart',
              'cancelAtPeriodEnd',
              'planId',
              'seatsCount',
            ])
          : null,
        plan: organizationPlan,
      });
    },
  );
}

function setupGetOrganizationSubscriptionUsageRoute({
  app,
  db,
  config,
  planEntitlementDefinitionRegistry,
}: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/usage',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const plansRepository = createPlansRepository({ config });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const aiCreditsRepository = createAiCreditsRepository({ db });

      await ensureUserIsInOrganization({
        userId,
        organizationId,
        organizationsRepository,
      });

      const [
        { organizationPlan },
        { totalDocumentsSize, deletedDocumentsSize },
        { intakeEmailCount },
        { membersCount },
        { creditsConsumed },
      ] = await Promise.all([
        getOrganizationPlan({
          organizationId,
          subscriptionsRepository,
          plansRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
        documentsRepository.getOrganizationStats({ organizationId }),
        intakeEmailsRepository.getOrganizationIntakeEmailsCount({ organizationId }),
        organizationsRepository.getOrganizationMembersCount({ organizationId }),
        aiCreditsRepository.getCurrentPeriodOrganizationAiCreditsCount({ organizationId }),
      ]);

      const nullifiedLimits = {
        maxDocumentStorageBytes: nullifyPositiveInfinity(
          organizationPlan.limits.maxDocumentStorageBytes,
        ),
        maxIntakeEmailsCount: nullifyPositiveInfinity(organizationPlan.limits.maxIntakeEmailsCount),
        maxOrganizationsMembersCount: nullifyPositiveInfinity(
          organizationPlan.limits.maxOrganizationsMembersCount,
        ),
        maxFileSize: nullifyPositiveInfinity(organizationPlan.limits.maxFileSize),
        aiCreditsPerMonth: nullifyPositiveInfinity(organizationPlan.limits.aiCreditsPerMonth),
      };

      return context.json({
        usage: {
          documentsStorage: {
            used: totalDocumentsSize,
            deleted: deletedDocumentsSize,
            limit: nullifiedLimits.maxDocumentStorageBytes,
          },
          intakeEmailsCount: {
            used: intakeEmailCount,
            limit: nullifiedLimits.maxIntakeEmailsCount,
          },
          membersCount: {
            used: membersCount,
            limit: nullifiedLimits.maxOrganizationsMembersCount,
          },
          aiCredits: {
            used: creditsConsumed,
            limit: nullifiedLimits.aiCreditsPerMonth,
          },
        },
        limits: nullifiedLimits,
      });
    },
  );
}
