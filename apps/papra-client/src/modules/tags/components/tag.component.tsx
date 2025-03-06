import { cn } from '@/modules/shared/style/cn';
import { A } from '@solidjs/router';
import { type Component, type ComponentProps, splitProps } from 'solid-js';

type TagProps = {
  name?: string;
  description?: string | null;
  color?: string;
  closable?: boolean;
  onClose?: () => void;
};

export const Tag: Component<TagProps & ComponentProps<'span'>> = (props) => {
  const [local, rest] = splitProps(props, ['name', 'description', 'color', 'class']);

  return (
    <span
      class={cn(
        'inline-flex gap-2 px-2.5 py-1 leading-none rounded-lg text-sm items-center bg-muted group',
        { 'cursor-pointer': props.closable },
        local.class,
      )}
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

type TagLinkProps = {
  name?: string;
  description?: string | null;
  color?: string;
  organizationId: string;
};

export const TagLink: Component<TagLinkProps & Omit<ComponentProps<typeof A>, 'href'> & { href?: string }> = (props) => {
  const [local, rest] = splitProps(props, ['name', 'description', 'color', 'class', 'href']);

  return (
    <A
      href={props.href ?? `/organizations/${props.organizationId}/documents?tags=${props.id}`}
      class={cn(
        'inline-flex gap-2 px-2.5 py-1 leading-none rounded-lg text-sm items-center bg-muted group hover:underline',
        local.class,
      )}
      {...rest}
    >
      <span class="size-1.5 rounded-full" style={{ 'background-color': props.color }} />
      {props.name}
    </A>
  );
};
