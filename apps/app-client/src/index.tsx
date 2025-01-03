/* @refresh reload */

import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from '@kobalte/core/color-mode';
import { Router } from '@solidjs/router';
import { QueryClientProvider } from '@tanstack/solid-query';

import { render, Suspense } from 'solid-js/web';
import { ConfirmModalProvider } from './modules/shared/confirm';
import { queryClient } from './modules/shared/query/query-client';
import { Toaster } from './modules/ui/components/sonner';
import { routes } from './routes';
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import './app.css';

render(
  () => {
    const initialColorMode = 'system';
    const colorModeStorageKey = 'papra_color_mode';
    const localStorageManager = createLocalStorageManager(colorModeStorageKey);

    return (
      <Router
        children={routes}
        root={props => (
          <QueryClientProvider client={queryClient}>
            <Suspense>
              <ConfirmModalProvider>
                <ColorModeScript storageType={localStorageManager.type} storageKey={colorModeStorageKey} initialColorMode={initialColorMode} />
                <ColorModeProvider
                  initialColorMode={initialColorMode}
                  storageManager={localStorageManager}
                >
                  <div class="min-h-screen font-sans text-sm font-400">{props.children}</div>
                  <Toaster />

                </ColorModeProvider>
              </ConfirmModalProvider>
            </Suspense>
          </QueryClientProvider>
        )}
      />
    );
  },
  document.getElementById('root')!,
);
