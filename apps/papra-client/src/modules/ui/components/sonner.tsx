import type { JSX } from 'solid-js';
import type { ExternalToast } from 'solid-sonner';
import { Toaster as Sonner, toast } from 'solid-sonner';

export { toast } from 'solid-sonner';

export function Toaster(props: Parameters<typeof Sonner>[0]) {
  return (
    <Sonner
      class="toaster group"
      toastOptions={{
        classes: {
          toast: 'group toast group-[.toaster]:(bg-background text-foreground border border-border shadow-lg) px-4 py-3 gap-4',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:(bg-primary text-primary-foreground)',
          cancelButton: 'group-[.toast]:(bg-muted text-muted-foreground)',
        },
      }}
      icons={{
        success: <div class="i-tabler-circle-check size-5 text-primary" />,
        info: <div class="i-tabler-info-circle size-5 text-primary" />,
        warning: <div class="i-tabler-alert-triangle size-5 text-red" />,
        error: <div class="i-tabler-alert-octagon size-5 text-red" />,
        loading: <div class="i-tabler-loader size-5 text-primary" />,
      }}

      {...props}
    />
  );
}

export function createToast({
  type = 'message',
  message,
  ...rest
}: {
  type?: 'success' | 'info' | 'warning' | 'error' | 'message' | 'loading';
  message: string | JSX.Element;
} & ExternalToast) {
  toast[type](message, rest);
}
