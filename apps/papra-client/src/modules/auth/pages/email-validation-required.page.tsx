import type { Component } from 'solid-js';
import { AuthLayout } from '../components/auth-layout.component';

export const EmailValidationRequiredPage: Component = () => {
  return (
    <AuthLayout>
      <div class="flex items-center justify-center min-h-screen p-6 pb-18">
        <div class="max-w-sm w-full">
          <div class="i-tabler-mail size-12 text-primary mb-2" />

          <h1 class="text-xl font-bold">
            Verify your email
          </h1>
          <p class="text-muted-foreground mt-1 mb-4">
            A verification email has been sent to your email address. Please verify your email address by clicking the link in the email.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
