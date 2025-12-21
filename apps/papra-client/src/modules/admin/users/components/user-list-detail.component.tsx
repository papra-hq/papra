import type { Component } from 'solid-js';
import { A } from '@solidjs/router';

export const UserListDetail: Component<{ id: string; name?: string | null; email: string; href?: string }> = (props) => {
  return (
    <A href={props.href ?? `/admin/users/${props.id}`} class="flex items-center gap-2 group">
      <div class="size-9 flex items-center justify-center rounded bg-muted">
        <div class="i-tabler-user size-5 group-hover:text-primary" />
      </div>

      <div>

        <div class="font-medium group-hover:text-primary transition">
          {props.name || '-'}
        </div>

        <div class="text-muted-foreground text-xs">
          {props.email}
        </div>
      </div>
    </A>
  );
};
