import { authStore } from '@/modules/auth/auth.store';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A } from '@solidjs/router';
import { useCurrentUser } from '../composables/useCurrentUser';

export function SettingsAccountPage() {
  const { user } = useCurrentUser();
  return (
    <div class="mt-8">
      <Card>
        <CardHeader class="border-b">
          <CardTitle>
            Account Email
          </CardTitle>
        </CardHeader>

        <CardContent class="p-6">

          <TextFieldRoot class="text-muted-foreground">
            <TextFieldLabel>Your email</TextFieldLabel>
            <TextField value={user.email} readOnly />
          </TextFieldRoot>
        </CardContent>

        <CardFooter class="border-t p-6">
          <p class="text-muted-foreground">
            Your email is used to log in and send you notifications. It cannot be changed.
          </p>
        </CardFooter>

      </Card>

      <Card class="mt-4">
        <CardHeader class="border-b">
          <CardTitle>
            Onboarding
          </CardTitle>
        </CardHeader>

        <CardContent class="p-6">
          <p class="text-muted-foreground">
            See the onboarding page to get started with setting up your api key.
          </p>
        </CardContent>

        <CardFooter class="border-t p-6">
          <Button as={A} href="/onboarding">
            Go to the onboarding
          </Button>
        </CardFooter>

      </Card>

      <Card class="mt-4 border-destructive">
        <CardHeader class="border-b">
          <CardTitle>
            Logout
          </CardTitle>
        </CardHeader>

        <CardContent class="p-6">
          <p class="text-muted-foreground">
            You can logout from your account here. You will be redirected to the login page.
          </p>
        </CardContent>

        <CardFooter class="border-t p-6">
          <Button onClick={() => authStore.logout()} variant="destructive">
            Logout
          </Button>
        </CardFooter>

      </Card>
    </div>
  );
}
