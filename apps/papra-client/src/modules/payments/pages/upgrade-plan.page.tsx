import type { Component, ComponentProps, ParentComponent } from 'solid-js';
import { isHttpErrorWithCode } from '@/modules/shared/http/http-errors';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Card } from '@/modules/ui/components/card';
import { toast } from '@/modules/ui/components/sonner';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/modules/ui/components/tabs';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { createSignal, splitProps } from 'solid-js';
import { getCheckoutUrl } from '../payments.services';

const plansDetails = [
  {
    id: 'free',
    name: 'Free',
    prices: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '500 docs renderings per month',
      'No watermark',
      'Privacy and security',
      'Customer support',
    ],
    drawbacks: [
      'Rendering priority',
    ],
    tags: [],
  },
  {
    id: 'starter',
    name: 'Starter',
    prices: {
      monthly: 15,
      yearly: 10, // 120 / 12,
    },
    features: [
      '5,000 docs renderings per month',
      'No watermark',
      'Privacy and security',
      'Customer support',
      'Rendering priority',
    ],
    drawbacks: [],
    tags: ['Popular'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    prices: {
      monthly: 120,
      yearly: 100, // 1200 / 12,
    },
    features: [
      '15,000 docs renderings per month',
      'No watermark',
      'Privacy and security',
      'Priority customer support',
      'Rendering priority',
    ],
    drawbacks: [],
    tags: [],
  },
];

const PlanButton: ParentComponent<ComponentProps<typeof Button>> = (props) => {
  const [getIsLoading, setIsLoading] = createSignal(false);
  const [local, rest] = splitProps(props, ['onClick']);

  const handleClick = async () => {
    setIsLoading(true);
    await local.onClick();
    setIsLoading(false);
  };

  return (
    <Button class="w-full" {...rest} onClick={handleClick} isLoading={getIsLoading()} />
  );
};

export const UpgradePlanPage: Component = () => {
  const { user } = useCurrentUser();
  const [getBillingInterval, setBillingInterval] = createSignal<'monthly' | 'yearly'>('yearly');

  const onPlanChoose = async ({ planId }: { planId: string }) => {
    try {
      const { checkoutUrl } = await getCheckoutUrl({ planId, billingInterval: getBillingInterval() });

      window.location.href = checkoutUrl;
    } catch (error) {
      if (isHttpErrorWithCode({ error, code: 'payment.customer_already_has_subscription' })) {
        toast.error('You already have an active subscription');
        return;
      }

      toast.error('An error occurred while processing your request');
    }
  };

  return (
    <div class="p-6 max-w-5xl mx-auto mt-4">
      <h1 class="text-3xl font-bold text-center mb-2">Upgrade your plan</h1>
      <p class="text-center text-muted-foreground mb-8 max-w-lg mx-auto text-pretty">
        Choose the plan that best fits your needs. You can change your plan at any time, no strings attached.
      </p>

      <div class="mb-10 max-w-72 mx-auto">
        <Tabs value={getBillingInterval()} onChange={setBillingInterval}>
          <TabsList>
            <TabsTrigger value="monthly">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly">
              <div class="flex items-baseline gap-3">
                Yearly
                <span class="text-muted-foreground text-xs">20% off</span>
              </div>
            </TabsTrigger>
            <TabsIndicator />
          </TabsList>
        </Tabs>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plansDetails.map(plan => (
          <Card class="p-6">
            <div>
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold">{plan.name}</h2>
                {plan.tags.map(tag => (
                  <Badge variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div class="flex items-baseline gap-2 mt-2 mb-8">
                <div class="text-4xl font-bold">
                  {`\$${plan.prices[getBillingInterval()]}`}
                </div>
                <div class="text-muted-foreground text-sm">/ month</div>
              </div>
            </div>
            <div class=" flex flex-col gap-2">
              {plan.features.map(feature => (
                <div class="flex items-center gap-2">
                  <div class="i-tabler-check size-4 "></div>
                  <div>{feature}</div>
                </div>
              ))}

              {plan.drawbacks && plan.drawbacks.map(drawback => (
                <div class="flex items-center gap-2 text-muted-foreground">
                  <div class="i-tabler-x size-4 "></div>
                  <div>{drawback}</div>
                </div>
              ))}

            </div>
            <div class="mt-8">
              {user.planId === plan.id
                ? (
                    <Button variant="outline" class="w-full" disabled>
                      Current plan
                    </Button>
                  )
                : (
                    <PlanButton class="w-full" onClick={() => onPlanChoose({ planId: plan.id })}>
                      Choose plan
                    </PlanButton>
                  )}
            </div>
          </Card>
        ))}
      </div>

      <div class="text-center mt-16">
        <h2 class="text-xl font-bold">Do you need a custom plan?</h2>
        <p class="max-w-lg mx-auto text-muted-foreground text-pretty mt-2">
          We can create a custom plan that fits your needs. Contact us to get started.
        </p>
        <Button variant="outline" class="mt-4">
          Contact us
        </Button>
      </div>
    </div>
  );
};
