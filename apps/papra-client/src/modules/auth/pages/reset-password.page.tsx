import { useConfig } from '@/modules/config/config.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router';
import { type Component, createSignal } from 'solid-js';
import { onMount } from 'solid-js';
import * as v from 'valibot';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { resetPassword } from '../auth.services';

export const ResetPasswordForm: Component<{ onSubmit: (args: { newPassword: string }) => Promise<void> }> = (props) => {
  const { form, Form, Field } = createForm({
    onSubmit: props.onSubmit,
    schema: v.object({
      newPassword: v.pipe(
        v.string(),
        v.nonEmpty('Please enter your new password'),
        v.minLength(8, 'Password must be at least 8 characters long'),
        v.maxLength(128, 'Password must be at most 128 characters long'),
      ),
    }),
  });

  return (
    <Form>
      <Field name="newPassword">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="newPassword">New password</TextFieldLabel>
            <TextField type="password" id="newPassword" placeholder="Your new password" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">
        Reset password
      </Button>

      <div class="text-red-500 text-sm mt-2">{form.response.message}</div>

    </Form>
  );
};

export const ResetPasswordPage: Component = () => {
  const [getHasPasswordBeenReset, setHasPasswordBeenReset] = createSignal(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.token;

  if (!token || typeof token !== 'string') {
    return <Navigate href="/login" />;
  }

  const { config } = useConfig();
  const navigate = useNavigate();

  onMount(() => {
    if (config.auth.isPasswordResetEnabled) {
      navigate('/login');
    }
  });

  const onPasswordResetRequested = async ({ newPassword }: { newPassword: string }) => {
    const { error } = await resetPassword({
      newPassword,
      token,
    });

    if (error) {
      throw error;
    }

    setHasPasswordBeenReset(true);
  };

  return (
    <AuthLayout>
      <div class="flex items-center justify-center p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            Reset your password
          </h1>

          {getHasPasswordBeenReset()
            ? (
                <>
                  <div class="text-muted-foreground mt-1 mb-4">
                    Your password has been reset.
                  </div>

                  <Button as={A} href="/login" class="w-full">
                    Go to login
                    <div class="i-tabler-login-2 ml-2 size-4" />
                  </Button>
                </>
              )
            : (
                <>
                  <p class="text-muted-foreground mt-1 mb-4">
                    Enter your new password.
                  </p>

                  <ResetPasswordForm onSubmit={onPasswordResetRequested} />
                </>
              )}

        </div>
      </div>
    </AuthLayout>
  );
};
