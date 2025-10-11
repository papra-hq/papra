import type { JSX, ParentComponent } from 'solid-js';
import { createContext, createSignal, Show, useContext } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '../ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/components/dialog';
import { TextField, TextFieldLabel, TextFieldRoot } from '../ui/components/textfield';

type ConfirmModalConfig = {
  title: JSX.Element | string;
  message?: JSX.Element | string;
  confirmButton?: {
    text?: string;
    variant?: 'default' | 'destructive';
  };
  cancelButton?: {
    text?: string;
    variant?: 'default' | 'secondary';
  };
  shouldType?: string;
};

const ConfirmModalContext = createContext<{ confirm: (config: ConfirmModalConfig) => Promise<boolean> }>(undefined);

export function useConfirmModal() {
  const context = useContext(ConfirmModalContext);

  if (!context) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }

  return context;
}

export const ConfirmModalProvider: ParentComponent = (props) => {
  const { t } = useI18n();
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getConfig, setConfig] = createSignal<ConfirmModalConfig | undefined>();
  const [getResolve, setResolve] = createSignal<((isConfirmed: boolean) => void) | undefined>();
  const [getTypedText, setTypedText] = createSignal<string>('');

  const confirm = ({ title, message, confirmButton, cancelButton, shouldType }: ConfirmModalConfig) => {
    setConfig({
      title,
      message,
      shouldType,
      confirmButton: {
        text: confirmButton?.text,
        variant: confirmButton?.variant ?? 'default',
      },
      cancelButton: {
        text: cancelButton?.text ?? 'Cancel',
        variant: cancelButton?.variant ?? 'secondary',
      },
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolve(() => resolve);
    });
  };

  function onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      getResolve()?.(false);
    }

    setIsOpen(isOpen);
  }

  function handleConfirm({ isConfirmed }: { isConfirmed: boolean }) {
    getResolve()?.(isConfirmed);
    setIsOpen(false);
  }

  const getIsConfirmEnabled = () => {
    const { shouldType } = getConfig() ?? {};

    if (shouldType === undefined) {
      return true;
    }

    return getTypedText().trim().toLowerCase() === shouldType.trim().toLowerCase();
  };

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      <Dialog open={getIsOpen()} onOpenChange={onOpenChange}>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getConfig()?.title ?? 'Confirm ?'}</DialogTitle>
            {getConfig()?.message && <DialogDescription>{getConfig()?.message}</DialogDescription>}
          </DialogHeader>

          <Show when={getConfig()?.shouldType}>
            {getText => (
              <div class="mt-0">
                <TextFieldRoot>
                  <TextFieldLabel class="font-semibold">{t('common.confirm-modal.type-to-confirm', { text: getText() })}</TextFieldLabel>
                  <TextField
                    value={getTypedText()}
                    onInput={e => setTypedText(e.currentTarget.value)}
                  />
                </TextFieldRoot>
              </div>
            )}
          </Show>

          <DialogFooter>
            <div class="flex gap-2 justify-end flex-col-reverse sm:flex-row">

              <Button onClick={() => handleConfirm({ isConfirmed: false })} variant={getConfig()?.cancelButton?.variant ?? 'secondary'}>
                {getConfig()?.cancelButton?.text ?? 'Cancel'}
              </Button>
              <Button onClick={() => handleConfirm({ isConfirmed: true })} variant={getConfig()?.confirmButton?.variant ?? 'default'} disabled={!getIsConfirmEnabled()}>
                {getConfig()?.confirmButton?.text ?? 'Confirm'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {props.children}
    </ConfirmModalContext.Provider>
  );
};
