import type { ComponentProps, ParentComponent } from 'solid-js';
import { createSignal } from 'solid-js';
import { Button } from '@/modules/ui/components/button';

export function useCopy() {
  const [getIsJustCopied, setIsJustCopied] = createSignal(false);

  const copy = ({ text }: { text: string }) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsJustCopied(true);
      setTimeout(() => setIsJustCopied(false), 2000);
    });
  };

  return { copy, getIsJustCopied };
}

export const CopyButton: ParentComponent<{ text: string; label?: string; copiedLabel?: string } & ComponentProps<typeof Button>> = (props) => {
  const { copy, getIsJustCopied } = useCopy();

  return (
    <Button
      onClick={() => copy({ text: props.text })}
      {...props}
    >
      <div classList={{ 'i-tabler-copy': !getIsJustCopied(), 'i-tabler-check': getIsJustCopied() }} class="mr-2 text-lg" />
      {(getIsJustCopied() ? props.copiedLabel ?? 'Copied!' : props.children ?? props.label ?? 'Copy')}
    </Button>
  );
};
