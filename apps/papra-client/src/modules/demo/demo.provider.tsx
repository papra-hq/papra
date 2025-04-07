import { A, useNavigate } from '@solidjs/router';
import { type Component, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { buildTimeConfig } from '../config/config';
import { useI18n } from '../i18n/i18n.provider';
import { Button } from '../ui/components/button';
import { clearDemoStorage } from './demo.storage';

export const DemoIndicator: Component = () => {
  const [getIsMinified, setIsMinified] = createSignal(false);
  const navigate = useNavigate();
  const { t, te } = useI18n();

  const clearDemo = async () => {
    await clearDemoStorage();
    navigate('/');
  };

  return (
    <>
      {buildTimeConfig.isDemoMode && (
        <Portal>
          {getIsMinified()
            ? (
                <div class="fixed bottom-4 right-4 z-50 rounded-xl max-w-280px">
                  <Button onClick={() => setIsMinified(false)} size="icon">
                    <div class="i-tabler-info-circle size-5.5"></div>
                  </Button>
                </div>
              )
            : (
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

                    <Button onClick={() => setIsMinified(true)} class="bg-transparent hover:text-primary" variant="outline" size="sm">
                      {t('demo.popup.hide')}
                    </Button>
                  </div>
                </div>
              )}

        </Portal>
      )}
    </>
  );
};
