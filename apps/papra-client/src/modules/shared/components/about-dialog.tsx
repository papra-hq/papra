import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { Dialog, DialogContent } from '@/modules/ui/components/dialog';
import { AboutContent } from './about-content';

export const AboutDialog: Component<{ open?: boolean; onOpenChange?: (open: boolean) => void }> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
        <AboutContent />
      </DialogContent>
    </Dialog>
  );
};

export function useAboutDialog() {
  const [isOpen, setIsOpen] = createSignal(false);

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
