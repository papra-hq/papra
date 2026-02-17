import type { Accessor, ParentComponent } from 'solid-js';
import { createContext, createSignal, useContext } from 'solid-js';
import { Dialog, DialogContent } from '@/modules/ui/components/dialog';
import { AboutContent } from './about-content';

const aboutDialogContext = createContext<{
  getIsOpen: Accessor<boolean>;
  open: () => void;
  close: () => void;
  toggle: () => void;
}>();

export function useAboutDialog() {
  const context = useContext(aboutDialogContext);

  if (!context) {
    throw new Error('useAboutDialog must be used within an AboutDialogProvider');
  }

  return context;
}

export const AboutDialogProvider: ParentComponent = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return (
    <aboutDialogContext.Provider value={{ getIsOpen, open, close, toggle }}>
      {props.children}

      <Dialog open={getIsOpen()} onOpenChange={setIsOpen}>
        <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
          <AboutContent />
        </DialogContent>
      </Dialog>
    </aboutDialogContext.Provider>
  );
};
