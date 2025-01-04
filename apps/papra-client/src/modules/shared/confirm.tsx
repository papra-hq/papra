import type { JSX, ParentComponent } from 'solid-js';
import { createContext, createSignal, useContext } from 'solid-js';
import { Button } from '../ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/components/dialog';

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
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getConfig, setConfig] = createSignal<ConfirmModalConfig | undefined>();
  const [getResolve, setResolve] = createSignal<((isConfirmed: boolean) => void) | undefined>();

  const confirm = ({ title, message, confirmButton, cancelButton }: ConfirmModalConfig) => {
    setConfig({
      title,
      message,
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

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      <Dialog open={getIsOpen()} onOpenChange={onOpenChange}>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getConfig()?.title ?? 'Confirm ?'}</DialogTitle>
            {getConfig()?.message && <DialogDescription>{getConfig()?.message}</DialogDescription>}
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => handleConfirm({ isConfirmed: false })} variant={getConfig()?.cancelButton?.variant ?? 'secondary'}>
              {getConfig()?.cancelButton?.text ?? 'Cancel'}
            </Button>
            <Button onClick={() => handleConfirm({ isConfirmed: true })} variant={getConfig()?.confirmButton?.variant ?? 'default'}>
              {getConfig()?.confirmButton?.text ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {props.children}
    </ConfirmModalContext.Provider>
  );
};
