import type { Component } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import { Match, onMount, Show, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { isHttpErrorWithCode, isRateLimitError } from '@/modules/shared/http/http-errors';
import { Button } from '@/modules/ui/components/button';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { claimPlanEntitlement, fetchUserPlanEntitlements } from '../plan-entitlements.services';
import { UserSettingsDropdown } from '@/modules/users/components/user-settings.component';
import { AppLogo } from '@/modules/ui/components/app-logo';
import { useConfig } from '@/modules/config/config.provider';

const SELFHST_ENTITLEMENT_TYPE = 'selfhst-premium';

export const ClaimSelfhstPage: Component = () => {
  const { t } = useI18n();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { config } = useConfig();
  const navigate = useNavigate();

  onMount(() => {
    if (!config.isSubscriptionsEnabled) {
      navigate('/');
    }
  });

  const entitlementsQuery = useQuery(() => ({
    queryKey: ['plan-entitlements'],
    queryFn: fetchUserPlanEntitlements,
  }));

  const claimMutation = useMutation(() => ({
    mutationFn: async () => claimPlanEntitlement({ type: SELFHST_ENTITLEMENT_TYPE }),
    onSettled: async () => queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] }),
  }));

  const getIsAlreadyClaimed = () =>
    entitlementsQuery.data?.planEntitlements.some(
      (entitlement) =>
        entitlement.type === SELFHST_ENTITLEMENT_TYPE &&
        (entitlement.expiresAt === null || new Date(entitlement.expiresAt) > new Date()),
    ) ?? false;

  const getErrorMessage = () => {
    const { error } = claimMutation;

    if (!error) {
      return undefined;
    }

    if (isHttpErrorWithCode({ error, code: 'plan_entitlements.already_exists' })) {
      // The entitlements query is invalidated on settle, the refreshed data
      // switches the page to the already-claimed state
      return undefined;
    }

    if (isHttpErrorWithCode({ error, code: 'plan_entitlements.not_eligible' })) {
      return t('plan-entitlements.claim.selfhst.errors.not-eligible', { email: user.email });
    }

    if (isHttpErrorWithCode({ error, code: 'plan_entitlements.claims_not_enabled' })) {
      return t('plan-entitlements.claim.selfhst.errors.claims-disabled');
    }

    if (isRateLimitError({ error })) {
      return t('plan-entitlements.claim.selfhst.errors.rate-limited');
    }

    return t('plan-entitlements.claim.selfhst.errors.generic');
  };

  return (
    <div>
      <div class="max-w-1000px mx-auto px-6 py-4 flex justify-between items-center">
        <AppLogo as={A} href="/" />

        <UserSettingsDropdown />
      </div>

      <div class="flex items-start justify-center min-h-screen p-6 bg-background sm:pt-24">
        <div class="max-w-xl w-full text-center sm:border sm:p-12 sm:rounded-xl sm:bg-card">
          <Switch>
            <Match when={claimMutation.isSuccess || getIsAlreadyClaimed()}>
              <div class="flex justify-center mb-6">
                <div class="p-4 bg-primary/10 rounded-full">
                  <div class="i-tabler-check size-16 text-primary" />
                </div>
              </div>

              <h1 class="text-3xl font-bold mb-3">
                {t(
                  claimMutation.isSuccess
                    ? 'plan-entitlements.claim.selfhst.success.title'
                    : 'plan-entitlements.claim.selfhst.already-claimed.title',
                )}
              </h1>

              <p class="text-muted-foreground mb-8">
                {t(
                  claimMutation.isSuccess
                    ? 'plan-entitlements.claim.selfhst.success.description'
                    : 'plan-entitlements.claim.selfhst.already-claimed.description',
                )}
              </p>

              <Button as={A} href="/" size="lg" class="w-full">
                {t('plan-entitlements.claim.selfhst.go-to-app')}
                <div class="i-tabler-arrow-right size-5 ml-2" />
              </Button>
            </Match>

            <Match when={entitlementsQuery.isLoading}>
              <div class="flex justify-center">
                <div class="i-tabler-loader-2 size-10 animate-spin text-muted-foreground" />
              </div>
            </Match>

            <Match when={true}>
              <div class="flex justify-center mb-6">
                <div class="p-4 bg-primary/10 rounded-full">
                  <div class="i-tabler-gift size-16 text-primary" />
                </div>
              </div>

              <h1 class="text-3xl font-bold mb-3">{t('plan-entitlements.claim.selfhst.title')}</h1>

              <p class="text-muted-foreground mb-4">
                {t('plan-entitlements.claim.selfhst.description')}
              </p>

              <p class="text-muted-foreground mb-8 ">
                {t('plan-entitlements.claim.selfhst.email-notice', { email: user.email })}
              </p>

              <Show when={getErrorMessage()}>
                {(getMessage) => (
                  <p class="text-destructive text-sm mb-6" role="alert">
                    {getMessage()}
                  </p>
                )}
              </Show>

              <Button
                size="lg"
                class="w-full"
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending}
              >
                <Show when={claimMutation.isPending}>
                  <div class="i-tabler-loader-2 size-5 mr-2 animate-spin" />
                </Show>
                {t('plan-entitlements.claim.selfhst.claim-button')}
              </Button>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
