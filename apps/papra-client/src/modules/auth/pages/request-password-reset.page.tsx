import { config } from '@/modules/config/config';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { buildUrl } from '@corentinth/chisels';
import { A } from '@solidjs/router';
import { type Component, createSignal } from 'solid-js';
import * as v from 'valibot';
import { forgetPassword } from '../auth.services';
import { AuthLayout } from '../components/auth-layout.component';
import { OpenEmailProvider } from '../components/open-email-provider.component';

export const ResetPasswordForm: Component<{ onSubmit: (args: { email: string }) => Promise<void> }> = (props) => {
  const { form, Form, Field } = createForm({
    onSubmit: props.onSubmit,
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty('Please enter your email address'),
        v.email('This is not a valid email address'),
      ),
    }),
  });

  return (
    <Form>
      <Field name="email">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="email">Email</TextFieldLabel>
            <TextField type="email" id="email" placeholder="Eg. ada@papra.app" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">
        Request password reset
      </Button>

      <div class="text-red-500 text-sm mt-2">{form.response.message}</div>

    </Form>
  );
};

export const RequestPasswordResetPage: Component = () => {
  const [getHasPasswordResetBeenRequested, setHasPasswordResetBeenRequested] = createSignal(false);
  const [getEmail, setEmail] = createSignal<string | undefined>(undefined);

  const onPasswordResetRequested = async ({ email }: { email: string }) => {
    const { error } = await forgetPassword({
      email,
      redirectTo: buildUrl({
        path: '/reset-password',
        baseUrl: config.baseUrl,
      }),
    });

    if (error) {
      throw error;
    }

    setEmail(email);
    setHasPasswordResetBeenRequested(true);
  };

  return (
    <AuthLayout>
      <div class="flex items-center justify-center min-h-screen p-6 pb-18">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            Reset your password
          </h1>

          {getHasPasswordResetBeenRequested()
            ? (
                <>
                  <div class="text-muted-foreground mt-1 mb-4">
                    If an account exists for this email, we've sent you an email to reset your password.
                  </div>

                  <OpenEmailProvider email={getEmail()} variant="secondary" class="w-full mb-4" />
                </>
              )
            : (
                <>
                  <p class="text-muted-foreground mt-1 mb-4">
                    Enter your email to reset your password.
                  </p>

                  <ResetPasswordForm onSubmit={onPasswordResetRequested} />
                </>
              )}

          <Button as={A} href="/login" class="w-full" variant={getHasPasswordResetBeenRequested() ? 'default' : 'ghost'}>
            <div class="i-tabler-arrow-left mr-2 size-4" />
            Back to login
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};
