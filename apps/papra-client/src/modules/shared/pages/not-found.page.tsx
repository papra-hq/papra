import type { Component } from 'solid-js';
import { Button } from '@/modules/ui/components/button';
import { A } from '@solidjs/router';

export const NotFoundPage: Component = () => {
  return (
    <div class="h-screen flex flex-col items-center justify-center p-6">

      <div class="flex items-center flex-row sm:gap-24">
        <div class="max-w-350px">
          <h1 class="text-xl mr-4 py-2">404 - Not Found</h1>
          <p class="text-muted-foreground">
            Sorry, the page you are looking for does seem to exist. Please check the URL and try again.
          </p>
          <Button as={A} href="/" class="mt-4" variant="default">
            <div class="i-tabler-arrow-left mr-2"></div>
            Go back to home
          </Button>
        </div>

        <div class="hidden sm:block light:text-muted-foreground">
          <div class="i-tabler-file-shredder text-200px"></div>
        </div>
      </div>
    </div>
  );
};
