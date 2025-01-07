import { useNavigate } from '@solidjs/router';
import { type Component, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { config } from '../config/config';
import { Button } from '../ui/components/button';
import { clearDemoStorage } from './demo.storage';

export const DemoIndicator: Component = () => {
  const [getIsMinified, setIsMinified] = createSignal(false);
  const navigate = useNavigate();

  const clearDemo = async () => {
    await clearDemoStorage();
    navigate('/');
  };

  return (
    <>
      {config.isDemoMode && (
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
                    This is a demo environment, all data is save to your browser local storage.
                  </p>
                  <div class="flex justify-end mt-4 gap-2">
                    <Button variant="secondary" onClick={clearDemo} size="sm" class="text-primary shadow-none">
                      Reset demo data
                    </Button>

                    <Button onClick={() => setIsMinified(true)} class="bg-transparent hover:text-primary" variant="outline" size="sm">
                      Hide
                    </Button>
                  </div>
                </div>
              )}

        </Portal>
      )}
    </>
  );
};
