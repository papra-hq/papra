import type { Component } from 'solid-js';
import { useMutation } from '@tanstack/solid-query';
import { createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { twoFactor } from '@/modules/auth/auth.services';
import { TotpField } from '@/modules/auth/components/verify-otp.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { downloadTextFile } from '@/modules/shared/files/download';
import { createForm } from '@/modules/shared/form/form';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { CopyButton } from '@/modules/shared/utils/copy';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/ui/components/dialog';
import { QrCode } from '@/modules/ui/components/qr-code';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldErrorMessage, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { getSecretFromTotpUri } from '../2fa.models';

const EnableTwoFactorDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: { totpURI: string; backupCodes: string[] }) => void;
}> = (props) => {
  const { t } = useI18n();

  const passwordSchema = v.pipe(v.string(), v.minLength(1, t('user.settings.two-factor.enable-dialog.password.required')));

  const { form, Form, Field } = createForm({
    schema: v.object({
      password: passwordSchema,
    }),
    initialValues: {
      password: '',
    },
    onSubmit: async ({ password }) => {
      const { data, error } = await twoFactor.enable({ password });

      if (error) {
        createToast({ type: 'error', message: error.message });
        return;
      }

      const { totpURI, backupCodes } = data;

      props.onSuccess({ totpURI, backupCodes });
    },
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('user.settings.two-factor.enable-dialog.title')}</DialogTitle>
          <DialogDescription>{t('user.settings.two-factor.enable-dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form>
          <Field name="password">
            {(field, inputProps) => (
              <TextFieldRoot>
                <TextFieldLabel for="enable-password">
                  {t('user.settings.two-factor.enable-dialog.password.label')}
                </TextFieldLabel>
                <TextField
                  type="password"
                  id="enable-password"
                  placeholder={t('user.settings.two-factor.enable-dialog.password.placeholder')}
                  {...inputProps}
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                />
                {field.error && <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>}
              </TextFieldRoot>
            )}
          </Field>
          <DialogFooter class="mt-6">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              {t('user.settings.two-factor.enable-dialog.cancel')}
            </Button>
            <Button type="submit" isLoading={form.submitting}>
              {t('user.settings.two-factor.enable-dialog.submit')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const SetupTwoFactorDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totpUri: string;
  onSuccess: () => void;
}> = (props) => {
  const { t } = useI18n();
  const getTotpSecret = () => getSecretFromTotpUri({ totpUri: props.totpUri });
  const [getTotpCode, setTotpCode] = createSignal<string>('');
  const { createI18nApiError } = useI18nApiErrors();

  const verifyMutation = useMutation(() => ({
    mutationFn: async ({ totpCode }: { totpCode: string }) => {
      const { error } = await twoFactor.verifyTotp({ code: totpCode });
      if (error) {
        throw createI18nApiError({ error });
      }
    },
    onSuccess: () => {
      props.onSuccess();
      createToast({ type: 'success', message: t('user.settings.two-factor.enabled') });
    },
  }));

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('user.settings.two-factor.setup-dialog.title')}</DialogTitle>
        </DialogHeader>
        <div>

          <h3 class="font-semibold">{t('user.settings.two-factor.setup-dialog.step1.title')}</h3>
          <p class="mb-4 text-sm text-muted-foreground">
            {t('user.settings.two-factor.setup-dialog.step1.description')}
          </p>

          <div class="flex flex-col items-center">
            <QrCode value={props.totpUri} class="w-full max-w-48" />

            <CopyButton text={getTotpSecret()} variant="outline" label={t('user.settings.two-factor.setup-dialog.copy-setup-key')} size="sm" class="mt-2" />
          </div>

          <h3 class="mt-8 font-semibold">{t('user.settings.two-factor.setup-dialog.step2.title')}</h3>
          <p class="mb-4 text-sm text-muted-foreground">
            {t('user.settings.two-factor.setup-dialog.step2.description')}
          </p>

          <div class="mt-4 flex justify-center">
            <TotpField value={getTotpCode()} onValueChange={setTotpCode} />
          </div>

          <Show when={verifyMutation.error}>{getError => (<div class="text-red">{getError().message}</div>)}</Show>

          <div class="flex md:flex-row flex-col justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              {t('user.settings.two-factor.setup-dialog.cancel')}
            </Button>
            <Button type="submit" isLoading={verifyMutation.isPending} onClick={() => verifyMutation.mutate({ totpCode: getTotpCode() })}>
              {t('user.settings.two-factor.setup-dialog.verify')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BackupCodesDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodes: string[];
}> = (props) => {
  const { t } = useI18n();

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('user.settings.two-factor.backup-codes-dialog.title')}</DialogTitle>
          <DialogDescription>{t('user.settings.two-factor.backup-codes-dialog.description')}</DialogDescription>
        </DialogHeader>
        <div>
          <div class="p-4 rounded-md bg-background border">
            <div class="grid grid-cols-2 gap-2 font-mono text-sm">
              <For each={props.backupCodes}>
                {code => (
                  <div class="text-center">{code}</div>
                )}
              </For>
            </div>
          </div>

          <div class="flex justify-center mt-2 md:flex-row flex-col gap-2">
            <CopyButton
              text={props.backupCodes.join('\n')}
              label={t('user.settings.two-factor.backup-codes-dialog.copy')}
              variant="outline"
              size="sm"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTextFile({
                content: props.backupCodes.join('\n'),
                fileName: t('user.settings.two-factor.backup-codes-dialog.download-filename'),
              })}
            >
              <div class="i-tabler-download size-4 mr-2" />
              {t('user.settings.two-factor.backup-codes-dialog.download')}
            </Button>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <Button onClick={() => props.onOpenChange(false)}>
            {t('user.settings.two-factor.backup-codes-dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DisableTwoFactorDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}> = (props) => {
  const { t } = useI18n();

  const passwordSchema = v.pipe(v.string(), v.minLength(1, t('user.settings.two-factor.disable-dialog.password.required')));

  const { form, Form, Field } = createForm({
    schema: v.object({
      password: passwordSchema,
    }),
    initialValues: {
      password: '',
    },
    onSubmit: async ({ password }) => {
      const { error } = await twoFactor.disable({ password });

      if (error) {
        createToast({ type: 'error', message: error.message });
        return;
      }

      props.onSuccess();
      createToast({ type: 'success', message: t('user.settings.two-factor.disabled') });
    },
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('user.settings.two-factor.disable-dialog.title')}</DialogTitle>
          <DialogDescription>{t('user.settings.two-factor.disable-dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form>
          <Field name="password">
            {(field, inputProps) => (
              <TextFieldRoot>
                <TextFieldLabel for="disable-password">
                  {t('user.settings.two-factor.disable-dialog.password.label')}
                </TextFieldLabel>
                <TextField
                  type="password"
                  id="disable-password"
                  placeholder={t('user.settings.two-factor.disable-dialog.password.placeholder')}
                  {...inputProps}
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                />
                {field.error && <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>}
              </TextFieldRoot>
            )}
          </Field>
          <DialogFooter class="mt-6">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              {t('user.settings.two-factor.disable-dialog.cancel')}
            </Button>
            <Button type="submit" variant="destructive" isLoading={form.submitting}>
              {t('user.settings.two-factor.disable-dialog.submit')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const RegenerateBackupCodesDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (backupCodes: string[]) => void;
}> = (props) => {
  const { t } = useI18n();

  const passwordSchema = v.pipe(v.string(), v.minLength(1, t('user.settings.two-factor.regenerate-dialog.password.required')));

  const { form, Form, Field } = createForm({
    schema: v.object({
      password: passwordSchema,
    }),
    initialValues: {
      password: '',
    },
    onSubmit: async ({ password }) => {
      const { data, error } = await twoFactor.generateBackupCodes({ password });

      if (error) {
        createToast({ type: 'error', message: error.message });
        return;
      }

      if (data?.backupCodes) {
        props.onSuccess(data.backupCodes);
        createToast({ type: 'success', message: t('user.settings.two-factor.codes-regenerated') });
      }
    },
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('user.settings.two-factor.regenerate-dialog.title')}</DialogTitle>
          <DialogDescription>{t('user.settings.two-factor.regenerate-dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form>
          <Field name="password">
            {(field, inputProps) => (
              <TextFieldRoot>
                <TextFieldLabel for="regenerate-password">
                  {t('user.settings.two-factor.regenerate-dialog.password.label')}
                </TextFieldLabel>
                <TextField
                  type="password"
                  id="regenerate-password"
                  placeholder={t('user.settings.two-factor.regenerate-dialog.password.placeholder')}
                  {...inputProps}
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                />
                {field.error && <TextFieldErrorMessage>{field.error}</TextFieldErrorMessage>}
              </TextFieldRoot>
            )}
          </Field>
          <DialogFooter class="mt-6">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              {t('user.settings.two-factor.regenerate-dialog.cancel')}
            </Button>
            <Button type="submit" isLoading={form.submitting}>
              {t('user.settings.two-factor.regenerate-dialog.submit')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

type DialogState = 'none' | 'enable-password' | 'setup-qr' | 'backup-codes' | 'disable-password' | 'regenerate-codes';

export const TwoFactorCard: Component<{ twoFactorEnabled: boolean; onUpdate: () => void }> = (props) => {
  const { t } = useI18n();
  const [dialogState, setDialogState] = createSignal<DialogState>('none');
  const [totpUri, setTotpUri] = createSignal<string>('');
  const [backupCodes, setBackupCodes] = createSignal<string[]>([]);

  const handleEnableSuccess = (data: { totpURI: string; backupCodes: string[] }) => {
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setDialogState('setup-qr');
  };

  const handleSetupSuccess = () => {
    setDialogState('backup-codes');
    props.onUpdate();
    createToast({ type: 'success', message: t('user.settings.two-factor.enabled') });
  };

  const handleDisableSuccess = () => {
    setDialogState('none');
    props.onUpdate();
  };

  const handleRegenerateSuccess = (codes: string[]) => {
    setBackupCodes(codes);
    setDialogState('backup-codes');
  };

  const closeDialog = () => {
    setDialogState('none');
    setTotpUri('');
    setBackupCodes([]);
  };

  return (
    <>
      <Card>
        <CardHeader class="border-b">
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{t('user.settings.two-factor.title')}</CardTitle>
              <CardDescription>{t('user.settings.two-factor.description')}</CardDescription>
            </div>
            <Badge variant={props.twoFactorEnabled ? 'default' : 'secondary'}>
              {props.twoFactorEnabled
                ? t('user.settings.two-factor.status.enabled')
                : t('user.settings.two-factor.status.disabled')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="pt-6">
          <div class="flex flex-row justify-end gap-3">
            <Show
              when={props.twoFactorEnabled}
              fallback={(
                <Button onClick={() => setDialogState('enable-password')}>
                  {t('user.settings.two-factor.enable-button')}
                </Button>
              )}
            >
              <Button variant="outline" onClick={() => setDialogState('regenerate-codes')}>
                {t('user.settings.two-factor.regenerate-codes-button')}
              </Button>
              <Button variant="destructive" onClick={() => setDialogState('disable-password')}>
                {t('user.settings.two-factor.disable-button')}
              </Button>
            </Show>
          </div>
        </CardContent>
      </Card>

      <EnableTwoFactorDialog
        open={dialogState() === 'enable-password'}
        onOpenChange={open => !open && closeDialog()}
        onSuccess={handleEnableSuccess}
      />

      <SetupTwoFactorDialog
        open={dialogState() === 'setup-qr'}
        onOpenChange={open => !open && closeDialog()}
        totpUri={totpUri()}
        onSuccess={handleSetupSuccess}
      />

      <BackupCodesDialog
        open={dialogState() === 'backup-codes'}
        onOpenChange={open => !open && closeDialog()}
        backupCodes={backupCodes()}
      />

      <DisableTwoFactorDialog
        open={dialogState() === 'disable-password'}
        onOpenChange={open => !open && closeDialog()}
        onSuccess={handleDisableSuccess}
      />

      <RegenerateBackupCodesDialog
        open={dialogState() === 'regenerate-codes'}
        onOpenChange={open => !open && closeDialog()}
        onSuccess={handleRegenerateSuccess}
      />
    </>
  );
};
