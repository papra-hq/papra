import { cn } from '@/modules/shared/style/cn';
import { type Component, type ComponentProps, splitProps } from 'solid-js';

export const Tag: Component<{
  name?: string;
  description?: string | null;
  color?: string;
  closable?: boolean;
  onClose?: () => void;
} & ComponentProps<'span'>> = (props) => {
  const [local, rest] = splitProps(props, ['name', 'description', 'color', 'class']);

  return (
    <span
      class={cn('inline-flex gap-2 px-2.5 py-1 leading-none rounded-lg text-sm items-center bg-muted group', local.class)}
      {...rest}
      {...(props.closable && {
        onClick: (e) => {
          e.preventDefault();
          props.onClose?.();
        },
      })}
    >
      <span class="size-1.5 rounded-full" style={{ 'background-color': props.color }} />
      {props.name}
      {props.closable && <div class="i-tabler-x text-muted-foreground group-hover:text-foreground transition" />}
    </span>
  );
};
