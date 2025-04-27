import type { Component } from 'solid-js';
import { signOut } from '@/modules/auth/auth.services';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { useUpdateCurrentUser } from '../users.composables';
import { nameSchema } from '../users.schemas';
import { fetchCurrentUser } from '../users.services';

const LogoutCard: Component = () => {
  const [getIsLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut();
    navigate('/login');
  };

  return (
    <Card class="flex flex-row justify-between items-center p-6 border-destructive">
      <div class="flex flex-col gap-1.5">
        <CardTitle>Logout</CardTitle>
        <CardDescription>
          Logout from your account. You can login again later.
        </CardDescription>
      </div>
      <Button onClick={handleLogout} variant="destructive" isLoading={getIsLoading()}>
        Logout
      </Button>
    </Card>
  );
};

const UserEmailCard: Component<{ email: string }> = (props) => {
  return (
    <Card>
      <CardHeader class="border-b">
        <CardTitle>Email address</CardTitle>
        <CardDescription>Your email address cannot be changed.</CardDescription>
      </CardHeader>
      <CardContent class="pt-6">
        <TextFieldRoot>
          <TextFieldLabel for="email" class="sr-only">
            Email address
          </TextFieldLabel>
          <TextField id="email" value={props.email} disabled readOnly />
        </TextFieldRoot>
      </CardContent>
    </Card>
  );
};

const UpdateFullNameCard: Component<{ name: string }> = (props) => {
  const { updateCurrentUser } = useUpdateCurrentUser();

  const { form, Form, Field } = createForm({
    schema: v.object({
      name: nameSchema,
    }),
    initialValues: {
      name: props.name,
    },
    onSubmit: async ({ name }) => {
      await updateCurrentUser({
        name: name.trim(),
      });

      createToast({ type: 'success', message: 'Your full name has been updated' });
    },
  });

  return (
    <Card>
      <CardHeader class="border-b">
        <CardTitle>Full name</CardTitle>
        <CardDescription>Your full name is displayed to other organization members.</CardDescription>
      </CardHeader>

      <Form>
        <CardContent class="pt-6">
          <Field name="name">
            {(field, inputProps) => (
              <TextFieldRoot class="flex flex-col gap-1">
                <TextFieldLabel for="name" class="sr-only">
                  Full name
                </TextFieldLabel>
                <div class="flex gap-2 flex-col sm:flex-row">
                  <TextField
                    type="text"
                    id="name"
                    placeholder="Eg. John Doe"
                    {...inputProps}
                    value={field.value}
                    aria-invalid={Boolean(field.error)}
                  />
                  <Button
                    type="submit"
                    isLoading={form.submitting}
                    class="flex-shrink-0"
                    disabled={field.value?.trim() === props.name}
                  >
                    Update name
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
  );
};

export const UserSettingsPage: Component = () => {
  const query = createQuery(() => ({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
  }));

  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl">
      <Suspense>
        <Show when={query.data?.user}>
          {getUser => (
            <>
              <div class="border-b pb-4">
                <h1 class="text-2xl font-semibold mb-1">User settings</h1>
                <p class="text-muted-foreground">Manage your account settings here.</p>
              </div>

              <div class="mt-6 flex flex-col gap-6">
                <UserEmailCard email={getUser().email} />
                <UpdateFullNameCard name={getUser().name} />
                <LogoutCard />
              </div>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
