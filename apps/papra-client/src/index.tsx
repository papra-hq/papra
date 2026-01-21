/* @refresh reload */

import type { ConfigColorMode } from '@kobalte/core/color-mode';
import { ColorModeProvider, createLocalStorageManager } from '@kobalte/core/color-mode';
import { Router } from '@solidjs/router';
import { QueryClientProvider } from '@tanstack/solid-query';

import { lazy, Suspense } from 'solid-js';
import { render } from 'solid-js/web';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { isDemoMode } from './modules/config/config';
import { ConfigProvider } from './modules/config/config.provider';
import { RenameDocumentDialogProvider } from './modules/documents/components/rename-document-button.component';
import { I18nProvider } from './modules/i18n/i18n.provider';
import { ConfirmModalProvider } from './modules/shared/confirm';
import { queryClient } from './modules/shared/query/query-client';
import { IdentifyUser } from './modules/tracking/components/identify-user.component';
import { PageViewTracker } from './modules/tracking/components/pageview-tracker.component';
import { Toaster } from './modules/ui/components/sonner';
import { routes } from './routes';
import 'virtual:uno.css';
import './app.css';

const DemoIndicator = isDemoMode
  ? lazy(() => import('./modules/demo/demo.provider').then(mod => ({ default: mod.DemoIndicator })))
  : null;

render(
  () => {
    const initialColorMode: ConfigColorMode = 'dark';
    const colorModeStorageKey = 'papra_color_mode';
    const localStorageManager = createLocalStorageManager(colorModeStorageKey);

    return (
      <QueryClientProvider client={queryClient}>
        <Router
          children={routes}
          root={props => (
            <Suspense>
              <PageViewTracker />
              <IdentifyUser />
              <I18nProvider>
                <ConfirmModalProvider>
                  <ColorModeProvider
                    initialColorMode={initialColorMode}
                    storageManager={localStorageManager}
                  >
                    <CommandPaletteProvider>
                      <ConfigProvider>
                        <RenameDocumentDialogProvider>
                          <div class="min-h-screen font-sans text-sm font-400">
                            {props.children}
                          </div>
                        </RenameDocumentDialogProvider>
                        {DemoIndicator && <DemoIndicator />}
                      </ConfigProvider>

                      <Toaster />
                    </CommandPaletteProvider>
                  </ColorModeProvider>

                </ConfirmModalProvider>
              </I18nProvider>
            </Suspense>
          )}
        />
      </QueryClientProvider>
    );
  },
  document.getElementById('root')!,
);
