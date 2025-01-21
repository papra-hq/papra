import { cn } from '@/modules/shared/style/cn';
import { type ComponentProps, splitProps } from 'solid-js';

export function Table(props: ComponentProps<'table'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div class="w-full overflow-auto">
      <table
        class={cn('w-full caption-bottom text-sm text-nowrap', local.class)}
        {...rest}
      />
    </div>
  );
}

export function TableHeader(props: ComponentProps<'thead'>) {
  const [local, rest] = splitProps(props, ['class']);

  return <thead class={cn('[&_tr]:border-b', local.class)} {...rest} />;
}

export function TableBody(props: ComponentProps<'tbody'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tbody class={cn('[&_tr:last-child]:border-0', local.class)} {...rest} />
  );
}

export function TableFooter(props: ComponentProps<'tfoot'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tbody
      class={cn('bg-primary font-medium text-primary-foreground', local.class)}
      {...rest}
    />
  );
}

export function TableRow(props: ComponentProps<'tr'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tr
      class={cn(
        'border-b transition-colors data-[state=selected]:bg-muted',
        local.class,
      )}
      {...rest}
    />
  );
}

export function TableHead(props: ComponentProps<'th'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <th
      class={cn(
        'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        local.class,
      )}
      {...rest}
    />
  );
}

export function TableCell(props: ComponentProps<'td'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <td
      class={cn(
        'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        local.class,
      )}
      {...rest}
    />
  );
}

export function TableCaption(props: ComponentProps<'caption'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <caption
      class={cn('mt-4 text-sm text-muted-foreground', local.class)}
      {...rest}
    />
  );
}
