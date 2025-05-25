import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX } from 'solid-js';
import type { IntakeEmail } from '../intake-emails.types';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { isHttpErrorWithCode } from '@/modules/shared/http/http-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { Card } from '@/modules/ui/components/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createIntakeEmail, deleteIntakeEmail, fetchIntakeEmails, updateIntakeEmail } from '../intake-emails.services';

const AllowedOriginsDialog: Component<{ children: (props: DialogTriggerProps) => JSX.Element; intakeEmails: IntakeEmail }> = (props) => {
  const [getAllowedOrigins, setAllowedOrigins] = createSignal([...props.intakeEmails.allowedOrigins]);
  const { t } = useI18n();

  const update = async () => {
    await updateIntakeEmail({
      organizationId: props.intakeEmails.organizationId,
      intakeEmailId: props.intakeEmails.id,
      allowedOrigins: getAllowedOrigins(),
    });
  };

  const deleteAllowedOrigin = async ({ origin }: { origin: string }) => {
    setAllowedOrigins(origins => origins.filter(o => o !== origin));
    await update();
  };

  const { form, Form, Field } = createForm({
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.email('Please enter a valid email address'),
      ),
    }),
    onSubmit: async ({ email }) => {
      if (getAllowedOrigins().includes(email)) {
        throw new Error(t('intake-emails.allowed-origins.add.error.exists'));
      }

      setAllowedOrigins(origins => [...origins, email]);
      await update();
    },
  });

  async function invalidateQuery() {
    await queryClient.invalidateQueries({
      queryKey: ['organizations', props.intakeEmails.organizationId, 'intake-emails'],
    });
  }

  return (
    <Dialog onOpenChange={isOpen => !isOpen && invalidateQuery()}>
      <DialogTrigger as={props.children} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('intake-emails.allowed-origins.title')}</DialogTitle>
          <DialogDescription>
            {t('intake-emails.allowed-origins.description', { email: props.intakeEmails.emailAddress })}
          </DialogDescription>
        </DialogHeader>

        <Form>
          <Field name="email">
            {(field, inputProps) => (
              <TextFieldRoot class="flex flex-col gap-1 mb-4 mt-4">
                <TextFieldLabel for="email">{t('intake-emails.allowed-origins.add.label')}</TextFieldLabel>

                <div class="flex items-center gap-2">
                  <TextField type="email" id="email" placeholder={t('intake-emails.allowed-origins.add.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
                  <Button type="submit">
                    <div class="i-tabler-plus size-4 mr-2" />
                    {t('intake-emails.allowed-origins.add.button')}
                  </Button>
                </div>

                <div class="text-red-500 text-sm mt-4">{form.response.message}</div>
                {field.error && <div class="text-red-500 text-sm">{field.error }</div>}
              </TextFieldRoot>
            )}
          </Field>
        </Form>

        <div class="flex flex-col gap-2">
          <For each={getAllowedOrigins()}>
            {origin => (
              <div class="flex items-center gap-2 justify-between border rounded-lg p-2">
                <div class="flex items-center gap-2">
                  <div class="bg-muted size-9 rounded-lg flex items-center justify-center">
                    <div class="i-tabler-mail size-5 text-primary" />
                  </div>
                  <div class="font-medium text-sm">
                    {origin}
                  </div>
                </div>
                <Button
                  variant="outline"
                  aria-label="Delete allowed origin"
                  size="icon"
                  class="text-red"
                  onClick={() => deleteAllowedOrigin({ origin })}
                >
                  <div class="i-tabler-trash size-4" />
                </Button>
              </div>
            )}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const IntakeEmailsPage: Component = () => {
  const { config } = useConfig();
  const { t, te } = useI18n();

  if (!config.intakeEmails.isEnabled) {
    return (
      <div class="p-6 max-w-screen-md mx-auto mt-10">
        <h1 class="text-xl font-semibold">{t('intake-emails.title')}</h1>

        <p class="text-muted-foreground mt-1">
          {t('intake-emails.description')}
        </p>
        <Card class="px-6 py-4 mt-4 flex items-center gap-4">
          <div class="i-tabler-mail-off size-12 text-muted-foreground flex-shrink-0" />
          <div>
            <h2 class="text-base font-bold text-muted-foreground">{t('intake-emails.disabled.title')}</h2>
            <p class="text-muted-foreground mt-1">
              {te('intake-emails.disabled.description', {
                documentation: (
                  <a href="https://docs.papra.app/guides/intake-emails-with-owlrelay/" target="_blank" class="text-primary">
                    {t('intake-emails.disabled.documentation')}
                  </a>
                ),
              })}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const params = useParams();
  const { confirm } = useConfirmModal();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'intake-emails'],
    queryFn: () => fetchIntakeEmails({ organizationId: params.organizationId }),
  }));

  const createEmail = async () => {
    const [,error] = await safely(createIntakeEmail({ organizationId: params.organizationId }));

    if (isHttpErrorWithCode({ error, code: 'intake_email.limit_reached' })) {
      createToast({
        message: t('api-errors.intake_email.limit_reached'),
        type: 'error',
      });

      return;
    }

    if (error) {
      throw error;
    }

    await query.refetch();

    createToast({
      message: t('intake-emails.create.success'),
      type: 'success',
    });
  };

  const deleteEmail = async ({ intakeEmailId }: { intakeEmailId: string }) => {
    const confirmed = await confirm({
      title: t('intake-emails.delete.confirm.title'),
      message: t('intake-emails.delete.confirm.message'),
      cancelButton: {
        text: t('intake-emails.delete.confirm.cancel-button'),
      },
      confirmButton: {
        text: t('intake-emails.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    await deleteIntakeEmail({ organizationId: params.organizationId, intakeEmailId });
    await query.refetch();

    createToast({
      message: t('intake-emails.delete.success'),
      type: 'success',
    });
  };

  const updateEmail = async ({ intakeEmailId, isEnabled }: { intakeEmailId: string; isEnabled: boolean }) => {
    await updateIntakeEmail({ organizationId: params.organizationId, intakeEmailId, isEnabled });
    await query.refetch();

    createToast({
      message: isEnabled ? t('intake-emails.update.success.enabled') : t('intake-emails.update.success.disabled'),
      type: 'success',
    });
  };

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-10">
      <h1 class="text-xl font-semibold">{t('intake-emails.title')}</h1>

      <p class="text-muted-foreground mt-1">
        {t('intake-emails.description')}
      </p>

      <Alert variant="default" class="mt-4 flex items-center gap-4 xl:gap-4 text-muted-foreground">
        <div class="i-tabler-info-circle size-10 xl:size-8 text-primary flex-shrink-0 " />

        <AlertDescription>
          {t('intake-emails.info')}
        </AlertDescription>
      </Alert>

      <Suspense>
        <Show when={query.data?.intakeEmails}>
          {intakeEmails => (
            <Show
              when={intakeEmails().length > 0}
              fallback={(
                <div class="mt-4 py-8 border-2 border-dashed rounded-lg text-center">
                  <EmptyState
                    title={t('intake-emails.empty.title')}
                    description={t('intake-emails.empty.description')}
                    class="pt-0"
                    icon="i-tabler-mail"
                    cta={(
                      <Button variant="secondary" onClick={createEmail}>
                        <div class="i-tabler-plus size-4 mr-2" />
                        {t('intake-emails.empty.generate')}
                      </Button>
                    )}
                  />
                </div>
              )}
            >
              <div class="mt-4 mb-4 flex items-center justify-between">
                <div class="text-muted-foreground">
                  {t('intake-emails.count', {
                    count: intakeEmails().length,
                    plural: intakeEmails().length > 1 ? 's' : '',
                  })}
                </div>

                <Button onClick={createEmail}>
                  <div class="i-tabler-plus size-4 mr-2" />
                  {t('intake-emails.new')}
                </Button>
              </div>

              <div class="flex flex-col gap-2">
                <For each={intakeEmails()}>
                  {intakeEmail => (
                    <div class="flex items-center justify-between border rounded-lg p-4 bg-card">
                      <div class="flex items-center gap-4">
                        <div class="bg-muted size-9 rounded-lg flex items-center justify-center">
                          <div class={cn('i-tabler-mail size-5', intakeEmail.isEnabled ? 'text-primary' : 'text-muted-foreground')} />
                        </div>

                        <div>
                          <div class="font-medium">
                            {intakeEmail.emailAddress}

                            <Show when={!intakeEmail.isEnabled}>
                              <span class="text-muted-foreground text-xs ml-2">{t('intake-emails.disabled-label')}</span>
                            </Show>
                          </div>

                          <Show
                            when={intakeEmail.allowedOrigins.length > 0}
                            fallback={(
                              <div class="text-xs text-warning flex items-center gap-1.5">
                                <div class="i-tabler-alert-triangle size-3.75" />
                                {t('intake-emails.no-origins')}
                              </div>
                            )}
                          >
                            <div class="text-xs text-muted-foreground flex items-center gap-2">
                              {t('intake-emails.allowed-origins', {
                                count: intakeEmail.allowedOrigins.length,
                                plural: intakeEmail.allowedOrigins.length > 1 ? 'es' : '',
                              })}
                            </div>
                          </Show>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => updateEmail({ intakeEmailId: intakeEmail.id, isEnabled: !intakeEmail.isEnabled })}
                        >
                          <div class="i-tabler-power size-4 mr-2" />
                          {intakeEmail.isEnabled ? t('intake-emails.actions.disable') : t('intake-emails.actions.enable')}
                        </Button>

                        <AllowedOriginsDialog intakeEmails={intakeEmail}>
                          {(props: DialogTriggerProps) => (
                            <Button
                              variant="outline"
                              aria-label="Edit intake email"
                              {...props}
                              class="flex items-center gap-2 leading-none"
                            >
                              <div class="i-tabler-edit size-4" />
                              {t('intake-emails.actions.manage-origins')}
                            </Button>
                          )}
                        </AllowedOriginsDialog>

                        <Button
                          variant="outline"
                          onClick={() => deleteEmail({ intakeEmailId: intakeEmail.id })}
                          aria-label="Delete intake email"
                          class="text-red"
                        >
                          <div class="i-tabler-trash size-4 mr-2" />
                          {t('intake-emails.actions.delete')}
                        </Button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
