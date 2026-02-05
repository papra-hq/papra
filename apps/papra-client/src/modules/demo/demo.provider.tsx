import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { createSignal, Match, Switch } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useI18n } from '../i18n/i18n.provider';
import { Button } from '../ui/components/button';
import { clearDemoStorage } from './demo.storage';

export const DemoIndicator: Component = () => {
  const [getPopupState, setPopupState] = createSignal<'minified' | 'expanded' | 'hidden'>('expanded');
  const { t, te } = useI18n();

  const clearDemo = async () => {
    await clearDemoStorage();
    // Navigate to / forcing a full reload
    window.location.href = '/';
  };

  const switchToStateUnlessCtrl = (state: 'minified' | 'expanded') => (e: MouseEvent) => {
    if (e.ctrlKey) {
      setPopupState('hidden');
      return;
    }

    setPopupState(state);
  };

  return (
    <Portal>
      <Switch>
        <Match when={getPopupState() === 'minified'}>
          <div class="fixed bottom-4 right-4 z-50 rounded-xl max-w-280px">
            <Button onClick={switchToStateUnlessCtrl('expanded')} size="icon">
              <div class="i-tabler-info-circle size-5.5" />
            </Button>
          </div>
        </Match>

        <Match when={getPopupState() === 'expanded'}>
          <div class="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-5 py-4 rounded-xl shadow-md max-w-300px">
            <p class="text-sm">
              {t('demo.popup.description')}
            </p>
            <p class="text-sm mt-2">
              {te('demo.popup.discord', { discordLink: <A href="https://papra.app/discord" target="_blank" rel="noopener noreferrer" class="underline font-bold">{t('demo.popup.discord-link-label')}</A> })}
            </p>
            <div class="flex justify-end mt-4 gap-2">
              <Button variant="secondary" onClick={clearDemo} size="sm" class="text-primary shadow-none">
                {t('demo.popup.reset')}
              </Button>

              <Button onClick={switchToStateUnlessCtrl('minified')} class="bg-transparent hover:text-primary" variant="outline" size="sm">
                {t('demo.popup.hide')}
              </Button>
            </div>
          </div>
        </Match>
      </Switch>
    </Portal>
  );
};
