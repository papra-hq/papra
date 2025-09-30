import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { createSignal } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { PLUS_PLAN_ID } from '@/modules/plans/plans.constants';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { getCheckoutUrl } from '../subscriptions.services';

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
  monthlyPrice: number;
  onUpgrade?: () => Promise<void>;
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

  return (
    <div class="border rounded-xl">
      <div class="p-4">
        <div class="text-sm font-medium text-muted-foreground flex items-center gap-2 justify-between">
          <span>{props.name}</span>
          {props.isCurrent && <span class="text-xs font-medium text-muted-foreground bg-muted rounded-md px-2 py-1">{t('subscriptions.upgrade-dialog.current-plan')}</span>}
          {props.isRecommended && <div class="text-xs font-medium text-primary bg-primary/10 rounded-md px-2 py-1">{t('subscriptions.upgrade-dialog.recommended')}</div>}
        </div>
        <div class="text-xl font-semibold flex items-center gap-2">
          $
          {props.monthlyPrice}
          <span class="text-sm font-normal text-muted-foreground">{t('subscriptions.upgrade-dialog.per-month')}</span>
        </div>

        <hr class="my-4" />

        <div class="flex flex-col gap-3 ">
          {featureItems.map(feature => (
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class={`p-1.5 rounded-lg ${props.isCurrent ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  <div class={`size-5 ${feature.icon}`}></div>
                </div>
                <div>
                  <div class="font-medium text-sm">{feature.value}</div>
                  <div class="text-xs text-muted-foreground">{feature.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        { props.onUpgrade && (
          <>
            <hr class="my-4" />

            <Button onClick={upgrade} class="w-full" auto-focus isLoading={getIsUpgradeLoading()}>
              {t('subscriptions.upgrade-dialog.upgrade-now')}
              <div class="i-tabler-arrow-right size-5 ml-2"></div>
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

  const onUpgrade = async () => {
    const { checkoutUrl } = await getCheckoutUrl({ organizationId: props.organizationId, planId: PLUS_PLAN_ID });
    window.location.href = checkoutUrl;
  };

  // Simplified plan configuration - only the values
  const currentPlan = {
    name: t('subscriptions.plan.free.name'),
    monthlyPrice: 0,
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
    monthlyPrice: 12,
    features: {
      storageSize: 5,
      members: 10,
      emailIntakes: 10,
      maxUploadSize: 100,
      support: t('subscriptions.features.support-email'),
    },
    isRecommended: true,
  };

  return (
    <Dialog open={getIsOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent class="sm:max-w-xl">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <div class="i-tabler-sparkles size-7 text-primary"></div>
            </div>
            <div>
              <DialogTitle class="text-xl mb-0">{t('subscriptions.upgrade-dialog.title')}</DialogTitle>
              <DialogDescription class="text-sm text-muted-foreground">
                {t('subscriptions.upgrade-dialog.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div class="pt-4 grid grid-cols-1 md:grid-cols-2 gap-2 ">
          <div>
            <PlanCard {...currentPlan} />

            <p class="text-muted-foreground text-xs p-4 ml-1">
              <a href="https://papra.app/contact" class="underline" target="_blank" rel="noreferrer">{t('subscriptions.upgrade-dialog.contact-us')}</a>
              {' '}
              {t('subscriptions.upgrade-dialog.enterprise-plans')}
            </p>
          </div>
          <PlanCard {...plusPlan} onUpgrade={onUpgrade} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
