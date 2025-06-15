import type { Component, JSX } from 'solid-js';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';

type AuthCardProps = {
  icon: string;
  title: string;
  description: string;
  iconVariant?: 'primary' | 'destructive';
  children?: JSX.Element;
};

export const AuthCard: Component<AuthCardProps> = (props) => {
  const iconBgClass = () => {
    switch (props.iconVariant) {
      case 'destructive':
        return 'bg-destructive/10';
      case 'primary':
      default:
        return 'bg-primary/10';
    }
  };

  const iconTextClass = () => {
    switch (props.iconVariant) {
      case 'destructive':
        return 'text-destructive';
      case 'primary':
      default:
        return 'text-primary';
    }
  };

  return (
    <AuthLayout>
      <div class="flex items-center justify-center min-h-full p-6 sm:pb-32">
        {/* Background decoration */}
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div class="relative w-full max-w-md">
          {/* Main card */}
          <div class="bg-card border shadow-xl rounded-2xl p-8 backdrop-blur-sm">
            {/* Icon and header */}
            <div class="text-center mb-8">
              <div class={`inline-flex items-center justify-center w-16 h-16 ${iconBgClass()} rounded-2xl mb-4`}>
                <div class={`${props.icon} size-8 ${iconTextClass()}`} />
              </div>
              <h1 class="text-2xl font-bold tracking-tight">{props.title}</h1>
              <p class="text-muted-foreground mt-2 text-base">{props.description}</p>
            </div>

            {/* Content */}
            {props.children}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
