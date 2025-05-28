import type { Component } from 'solid-js';
import type { Organization } from '../organizations.types';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { buildTimeConfig } from '@/modules/config/config';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { getCustomerPortalUrl } from '@/modules/subscriptions/subscriptions.services';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { useDeleteOrganization, useUpdateOrganization } from '../organizations.composables';
import { organizationNameSchema } from '../organizations.schemas';
import { fetchOrganization } from '../organizations.services';

const DeleteOrganizationCard: Component<{ organization: Organization }> = (props) => {
  const { deleteOrganization } = useDeleteOrganization();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('organization.settings.delete.confirm.title'),
      message: t('organization.settings.delete.confirm.message'),
      confirmButton: {
        text: t('organization.settings.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('organization.settings.delete.confirm.cancel-button'),
      },
    });

    if (confirmed) {
      await deleteOrganization({ organizationId: props.organization.id });

      createToast({ type: 'success', message: t('organization.settings.delete.success') });
    }
  };

  return (
    <div>
      <Card class="border-destructive">
        <CardHeader class="border-b">
          <CardTitle>{t('organization.settings.delete.title')}</CardTitle>
          <CardDescription>
            {t('organization.settings.delete.description')}
          </CardDescription>
        </CardHeader>

        <CardFooter class="pt-6">
          <Button onClick={handleDelete} variant="destructive">
            {t('organization.settings.delete.confirm.confirm-button')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export const SubscriptionCard: Component<{ organization: Organization }> = (props) => {
  const { config } = useConfig();

  if (!config.isSubscriptionsEnabled) {
    return null;
  }

  const [getIsLoading, setIsLoading] = createSignal(false);
  const { t } = useI18n();

  const goToCustomerPortal = async () => {
    setIsLoading(true);

    const [result, error] = await safely(getCustomerPortalUrl({ organizationId: props.organization.id }));

    if (error) {
      createToast({ type: 'error', message: t('organization.settings.subscription.error') });
      setIsLoading(false);

      return;
    }

    window.open(result.customerPortalUrl, '_blank');

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card class="flex flex-col sm:flex-row justify-between gap-4 sm:items-center p-6 ">
      <div>
        <div class="font-semibold">{t('organization.settings.subscription.title')}</div>
        <div class="text-sm text-muted-foreground">
          {t('organization.settings.subscription.description')}
        </div>
      </div>
      <Button onClick={goToCustomerPortal} isLoading={getIsLoading()} class="flex-shrink-0" disabled={buildTimeConfig.isDemoMode}>
        {t('organization.settings.subscription.manage')}
      </Button>
    </Card>
  );
};

const UpdateOrganizationNameCard: Component<{ organization: Organization }> = (props) => {
  const { updateOrganization } = useUpdateOrganization();
  const { t } = useI18n();

  const { form, Form, Field } = createForm({
    schema: v.object({
      organizationName: organizationNameSchema,
    }),
    initialValues: {
      organizationName: props.organization.name,
    },
    onSubmit: async ({ organizationName }) => {
      await updateOrganization({
        organizationId: props.organization.id,
        organizationName: organizationName.trim(),
      });

      createToast({ type: 'success', message: t('organization.settings.name.updated') });
    },
  });

  return (
    <div>
      <Card>
        <CardHeader class="border-b">
          <CardTitle>{t('organization.settings.name.title')}</CardTitle>
        </CardHeader>

        <Form>
          <CardContent class="pt-6 ">
            <Field name="organizationName">
              {(field, inputProps) => (
                <TextFieldRoot class="flex flex-col gap-1">
                  <TextFieldLabel for="organizationName" class="sr-only">
                    {t('organization.settings.name.title')}
                  </TextFieldLabel>
                  <div class="flex gap-2 flex-col sm:flex-row">
                    <TextField type="text" id="organizationName" placeholder={t('organization.settings.name.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />

                    <Button type="submit" isLoading={form.submitting} class="flex-shrink-0" disabled={field.value?.trim() === props.organization.name}>
                      {t('organization.settings.name.update')}
                    </Button>
                  </div>
                  {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
                </TextFieldRoot>
              )}
            </Field>

            <div class="text-red-500 text-sm">{form.response.message}</div>
          </CardContent>
        </Form>
      </Card>
    </div>
  );
};

export const OrganizationsSettingsPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId],
    queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
  }));

  return (
    <div class="p-6 mt-10 pb-32 mx-auto max-w-screen-md w-full">
      <Suspense>
        <Show when={query.data?.organization}>
          { getOrganization => (
            <>
              <h1 class="text-xl font-semibold mb-2">
                {t('organization.settings.page.title')}
              </h1>

              <p class="text-muted-foreground">
                {t('organization.settings.page.description')}
              </p>

              <div class="mt-6 flex flex-col gap-6">
                <UpdateOrganizationNameCard organization={getOrganization()} />
                <SubscriptionCard organization={getOrganization()} />
                <DeleteOrganizationCard organization={getOrganization()} />
              </div>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
