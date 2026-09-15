/* @refresh reload */

import type { ParentComponent } from 'solid-js';
import { Router } from '@solidjs/router';
import { QueryClientProvider } from '@tanstack/solid-query';

import { lazy } from 'solid-js';
import { render } from 'solid-js/web';
import { CommandPaletteProvider } from './modules/command-palette/command-palette.provider';
import { isDemoMode } from './modules/config/config';
import { ConfigProvider } from './modules/config/config.provider';
import { ShareDocumentDialogProvider } from './modules/document-share-links/components/share-document-dialog.component';
import { RenameDocumentDialogProvider } from './modules/documents/components/rename-document-button.component';
import { I18nProvider } from './modules/i18n/i18n.provider';
import { AboutDialogProvider } from './modules/shared/components/about-dialog';
import { ConfirmModalProvider } from './modules/shared/confirm';
import { queryClient } from './modules/shared/query/query-client';
import { ThemeProvider } from './modules/theme/theme.provider';
import { IdentifyUser } from './modules/tracking/components/identify-user.component';
import { PageViewTracker } from './modules/tracking/components/pageview-tracker.component';
import { Toaster } from './modules/ui/components/sonner';
import { routes } from './routes';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import 'virtual:uno.css';
import './app.css';

// Keep the dynamic import behind Vite's compile-time flag: no devtools modules in production.
const DevtoolsProvider: ParentComponent = import.meta.env.DEV
  ? lazy(async () =>
      import('./modules/devtools/devtools.provider').then((mod) => ({
        default: mod.DevtoolsProvider,
      })),
    )
  : (props) => props.children;

const DemoIndicator = isDemoMode
  ? lazy(async () =>
      import('./modules/demo/demo.provider').then((mod) => ({ default: mod.DemoIndicator })),
    )
  : null;

render(() => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        children={routes}
        root={(props) => (
          <>
            <PageViewTracker />
            <IdentifyUser />
            <I18nProvider>
              <ConfirmModalProvider>
                <ThemeProvider>
                  <CommandPaletteProvider>
                    <ConfigProvider>
                      <AboutDialogProvider>
                        <RenameDocumentDialogProvider>
                          <ShareDocumentDialogProvider>
                            <DevtoolsProvider>
                              <div class="min-h-screen font-sans text-sm font-400">
                                {props.children}
                              </div>
                            </DevtoolsProvider>
                          </ShareDocumentDialogProvider>
                        </RenameDocumentDialogProvider>
                        {DemoIndicator && <DemoIndicator />}
                      </AboutDialogProvider>
                    </ConfigProvider>

                    <Toaster />
                  </CommandPaletteProvider>
                </ThemeProvider>
              </ConfirmModalProvider>
            </I18nProvider>
          </>
        )}
      />
    </QueryClientProvider>
  );
}, document.getElementById('root')!);
