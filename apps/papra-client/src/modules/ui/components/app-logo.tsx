import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { ValidComponent } from 'solid-js';
import { Polymorphic } from '@kobalte/core/polymorphic';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export function AppLogo<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, { class?: string }>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <Polymorphic
      as="div"
      class={cn(`text-lg flex items-center gap-2 font-semibold group`, local.class)}
      {...rest}
    >
      <div class="i-tabler-file-text text-primary rotate-12 size-6 group-hover:rotate-25 transition" />
      Papra
    </Polymorphic>
  );
}
