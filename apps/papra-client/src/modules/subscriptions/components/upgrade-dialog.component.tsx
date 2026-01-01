import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { createSignal, For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { PLUS_PLAN_ID, PRO_PLAN_ID } from '@/modules/plans/plans.constants';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { getCheckoutUrl } from '../subscriptions.services';

// Hardcoded global reduction configuration, will be replaced by a dynamic configuration later
const globalReduction = {
  enabled: false,
  multiplier: 1,
  untilDate: new Date('2025-12-31T22:59:59Z'),
};

type BillingInterval = 'monthly' | 'annual';

type PlanCardProps = {
  name: string;
  features: {
    storageSize: number;
    members: number;
    emailIntakes: number;
    maxUploadSize: number;
    support: string;
  };
  isRecommended?: boolean;
  isCurrent?: boolean;
  onUpgrade?: () => Promise<void>;
  billingInterval: BillingInterval;
  monthlyPrice: number;
  annualPrice: number;
};

const PlanCard: Component<PlanCardProps> = (props) => {
  const { t } = useI18n();
  const [getIsUpgradeLoading, setIsUpgradeLoading] = createSignal(false);
  const featureItems = [
    {
      icon: 'i-tabler-database',
      title: t('subscriptions.features.storage-size'),
      value: `${props.features.storageSize}GB`,
    },
    {
      icon: 'i-tabler-users',
      title: t('subscriptions.features.members'),
      value: t('subscriptions.features.members-count', { count: props.features.members }),
    },
    {
      icon: 'i-tabler-mail',
      title: t('subscriptions.features.email-intakes'),
      value: props.features.emailIntakes === 1
        ? t('subscriptions.features.email-intakes-count-singular', { count: props.features.emailIntakes })
        : t('subscriptions.features.email-intakes-count-plural', { count: props.features.emailIntakes }),
    },
    {
      icon: 'i-tabler-file-upload',
      title: t('subscriptions.features.max-upload-size'),
      value: `${props.features.maxUploadSize}MB`,
    },
    {
      icon: 'i-tabler-headset',
      title: t('subscriptions.features.support'),
      value: props.features.support,
    },
  ];

  const upgrade = async () => {
    if (!props.onUpgrade) {
      return;
    }
    setIsUpgradeLoading(true);
    await safely(props.onUpgrade());
    setIsUpgradeLoading(false);
  };

  const getIsReductionActive = ({ now = new Date() }: { now?: Date } = {}) => globalReduction.enabled && now < globalReduction.untilDate;
  const getReductionMultiplier = ({ now = new Date() }: { now?: Date } = {}) => getIsReductionActive({ now }) ? globalReduction.multiplier : 1;

  const getMonthlyPrice = ({ now = new Date() }: { now?: Date } = {}) => {
    const multiplier = getReductionMultiplier({ now });
    const basePrice = props.billingInterval === 'annual' ? props.annualPrice / 12 : props.monthlyPrice;

    return Math.round(100 * basePrice * multiplier) / 100;
  };

  const getAnnualPrice = () => {
    const multiplier = getReductionMultiplier();
    return Math.round(100 * props.annualPrice * multiplier) / 100;
  };

  return (
    <div class="border rounded-xl">

      <div class="p-6">
        <div class="text-sm font-medium text-muted-foreground flex items-center gap-2 justify-between mb-1">
          <span class="min-h-24px">{props.name}</span>
          {getIsReductionActive() && props.annualPrice > 0 && <div class="text-xs font-medium text-primary bg-primary/10 rounded-md px-2 py-1">{`-${100 * (1 - getReductionMultiplier())}%`}</div>}
        </div>

        {getIsReductionActive() && props.annualPrice > 0 && (
          <span class="text-lg text-muted-foreground relative after:(content-[''] absolute left--5px right--5px top-1/2 h-2px bg-muted-foreground/40 rounded-full -rotate-12 origin-center)">{`$${(props.billingInterval === 'annual' ? props.annualPrice / 12 : props.monthlyPrice)}`}</span>
        )}
        <div class="flex items-baseline gap-1">
          <span class="text-4xl font-semibold">{`$${getMonthlyPrice()}`}</span>
          <span class="text-sm text-muted-foreground">{t('subscriptions.upgrade-dialog.per-month')}</span>
        </div>

        {
          props.annualPrice > 0 && (
            <div class="overflow-hidden transition-all duration-300" style={{ 'max-height': props.billingInterval === 'annual' ? '24px' : '0px', 'opacity': props.billingInterval === 'annual' ? '1' : '0' }}>
              <span class="text-xs text-muted-foreground">{t('subscriptions.upgrade-dialog.billed-annually', { price: getAnnualPrice() })}</span>
            </div>
          )
        }

        <hr class="my-6" />

        <div class="flex flex-col gap-3 ">
          <For each={featureItems}>
            {feature => (
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class={`p-1.5 rounded-lg ${props.isCurrent ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <div class={`size-5 ${feature.icon}`} />
                  </div>
                  <div>
                    <div class="font-medium text-sm">{feature.value}</div>
                    <div class="text-xs text-muted-foreground">{feature.title}</div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        { props.onUpgrade && (
          <>
            <hr class="my-6" />

            <Button onClick={upgrade} class="w-full" autofocus isLoading={getIsUpgradeLoading()}>
              {t('subscriptions.upgrade-dialog.upgrade-now')}
              <div class="i-tabler-arrow-right size-5 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

type UpgradeDialogProps = {
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
};

export const UpgradeDialog: Component<UpgradeDialogProps> = (props) => {
  const { t } = useI18n();
  const [getIsOpen, setIsOpen] = createSignal(false);
  const defaultBillingInterval: BillingInterval = 'annual';
  const [getBillingInterval, setBillingInterval] = createSignal<BillingInterval>(defaultBillingInterval);

  const getIsReductionActive = ({ now = new Date() }: { now?: Date } = {}) => globalReduction.enabled && now < globalReduction.untilDate;
  const getReductionMultiplier = ({ now = new Date() }: { now?: Date } = {}) => getIsReductionActive({ now }) ? globalReduction.multiplier : 1;
  const getReductionPercent = () => 100 * (1 - getReductionMultiplier());
  const getDaysUntilReductionExpiry = ({ now = new Date() }: { now?: Date } = {}) => {
    if (!getIsReductionActive({ now })) {
      return 0;
    }
    const timeDiff = globalReduction.untilDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const onUpgrade = async (planId: string) => {
    const { checkoutUrl } = await getCheckoutUrl({ organizationId: props.organizationId, planId, billingInterval: getBillingInterval() });
    window.location.href = checkoutUrl;
  };

  // Simplified plan configuration - only the values
  const currentPlan = {
    name: t('subscriptions.plan.free.name'),
    monthlyPrice: 0,
    annualPrice: 0,
    features: {
      storageSize: 0.5, // 500MB = 0.5GB
      members: 3,
      emailIntakes: 1,
      maxUploadSize: 25,
      support: t('subscriptions.features.support-community'),
    },
    isCurrent: true,
  };

  const plusPlan = {
    name: t('subscriptions.plan.plus.name'),
    monthlyPrice: 9,
    annualPrice: 90,
    features: {
      storageSize: 5,
      members: 10,
      emailIntakes: 10,
      maxUploadSize: 100,
      support: t('subscriptions.features.support-email'),
    },
    isRecommended: true,
  };

  const proPlan = {
    name: t('subscriptions.plan.pro.name'),
    monthlyPrice: 30,
    annualPrice: 300,
    features: {
      storageSize: 50,
      members: 50,
      emailIntakes: 100,
      maxUploadSize: 500,
      support: t('subscriptions.features.support-priority'),
    },
  };

  return (
    <Dialog open={getIsOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent class="sm:max-w-5xl">
        <DialogHeader>
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <div class="i-tabler-sparkles size-7 text-primary" />
              </div>
              <div>
                <DialogTitle class="text-xl mb-0">{t('subscriptions.upgrade-dialog.title')}</DialogTitle>
                <DialogDescription class="text-sm text-muted-foreground">
                  {t('subscriptions.upgrade-dialog.description')}
                </DialogDescription>
              </div>
            </div>

            <div class="flex flex-col items-center flex-1">
              <div class="inline-flex items-center justify-center border rounded-lg bg-muted p-1 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  class={cn('text-sm', { 'bg-primary/10 text-primary hover:(bg-primary/10 text-primary)': getBillingInterval() === 'monthly' })}
                  onClick={() => setBillingInterval('monthly')}
                >
                  {t('subscriptions.billing-interval.monthly')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class={cn('text-sm', { 'bg-primary/10 text-primary hover:(bg-primary/10 text-primary)': getBillingInterval() === 'annual' })}
                  onClick={() => setBillingInterval('annual')}
                >
                  {t('subscriptions.billing-interval.annual')}
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {getIsReductionActive() && (
          <div class="mt-4 bg-gradient-to-r from-primary/20 to-primary/2 border border-primary/30 rounded-lg p-4 flex-shrink-0">
            <div class="flex items-center gap-4">
              <div class="p-2.5 bg-primary/20 rounded-lg border border-primary/30 flex-shrink-0">
                <div class="i-tabler-gift size-6 text-primary" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-base font-semibold text-foreground">{t('subscriptions.upgrade-dialog.promo-banner.title')}</h4>
                  <div class="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-md">
                    {`-${getReductionPercent()}%`}
                  </div>
                </div>
                <p class="text-sm text-muted-foreground mb-1">
                  {t('subscriptions.upgrade-dialog.promo-banner.description', { percent: getReductionPercent(), days: getDaysUntilReductionExpiry() })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard {...currentPlan} billingInterval={getBillingInterval()} />
          <PlanCard {...plusPlan} onUpgrade={() => onUpgrade(PLUS_PLAN_ID)} billingInterval={getBillingInterval()} />
          <PlanCard {...proPlan} onUpgrade={() => onUpgrade(PRO_PLAN_ID)} billingInterval={getBillingInterval()} />
        </div>

        <p class="text-muted-foreground text-xs text-center mt-2">
          <a href="https://papra.app/contact" class="underline" target="_blank" rel="noreferrer">{t('subscriptions.upgrade-dialog.contact-us')}</a>
          {' '}
          {t('subscriptions.upgrade-dialog.enterprise-plans')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
