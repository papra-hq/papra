import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type {
  TabsContentProps,
  TabsIndicatorProps,
  TabsListProps,
  TabsRootProps,
  TabsTriggerProps,
} from '@kobalte/core/tabs';
import type { VariantProps } from 'class-variance-authority';
import type { ValidComponent, VoidProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Tabs as TabsPrimitive } from '@kobalte/core/tabs';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';

type tabsProps<T extends ValidComponent = 'div'> = TabsRootProps<T> & {
  class?: string;
};

export function Tabs<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, tabsProps<T>>) {
  const [local, rest] = splitProps(props as tabsProps, ['class']);

  return (
    <TabsPrimitive
      class={cn('w-full data-[orientation=vertical]:flex', local.class)}
      {...rest}
    />
  );
}

type tabsListProps<T extends ValidComponent = 'div'> = TabsListProps<T> & {
  class?: string;
};

export function TabsList<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, tabsListProps<T>>) {
  const [local, rest] = splitProps(props as tabsListProps, ['class']);

  return (
    <TabsPrimitive.List
      class={cn(
        'relative flex rounded-lg bg-muted p-1 text-muted-foreground data-[orientation=vertical]:(flex-col items-stretch) data-[orientation=horizontal]:items-center w-full',
        local.class,
      )}
      {...rest}
    />
  );
}

type tabsContentProps<T extends ValidComponent = 'div'> =
  TabsContentProps<T> & {
    class?: string;
  };

export function TabsContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, tabsContentProps<T>>) {
  const [local, rest] = splitProps(props as tabsContentProps, ['class']);

  return (
    <TabsPrimitive.Content
      class={cn(
        'data-[orientation=vertical]:ml-2 data-[orientation=horizontal]:mt-2 transition-shadow duration-200 focus-visible:(ring-offset-background outline-none ring-1.5 ring-ring ring-offset-2)',
        local.class,
      )}
      {...rest}
    />
  );
}

type tabsTriggerProps<T extends ValidComponent = 'button'> =
  TabsTriggerProps<T> & {
    class?: string;
  };

export function TabsTrigger<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, tabsTriggerProps<T>>) {
  const [local, rest] = splitProps(props as tabsTriggerProps, ['class']);

  return (
    <TabsPrimitive.Trigger
      class={cn(
        'w-full relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors disabled:(pointer-events-none opacity-50) data-[selected]:text-foreground peer h-7 outline-none',
        local.class,
      )}
      {...rest}
    />
  );
}

const tabsIndicatorVariants = cva(
  'absolute transition-all duration-200 outline-none',
  {
    variants: {
      variant: {
        block: 'data-[orientation=horizontal]:(bottom-1 left-0 h-[calc(100%-0.5rem)]) data-[orientation=vertical]:(right-1 top-0 w-[calc(100%-0.5rem)]) bg-background shadow rounded-md peer-focus-visible:(ring-1.5 ring-ring ring-offset-2 ring-offset-background outline-none)',
        underline: 'data-[orientation=horizontal]:(-bottom-[1px] left-0 h-2px) data-[orientation=vertical]:(-right-[1px] top-0 w-2px) bg-primary',
      },
    },
    defaultVariants: {
      variant: 'block',
    },
  },
);

type tabsIndicatorProps<T extends ValidComponent = 'div'> = VoidProps<
  TabsIndicatorProps<T> &
  VariantProps<typeof tabsIndicatorVariants> & {
    class?: string;
  }
>;

export function TabsIndicator<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, tabsIndicatorProps<T>>) {
  const [local, rest] = splitProps(props as tabsIndicatorProps, [
    'class',
    'variant',
  ]);

  return (
    <TabsPrimitive.Indicator
      class={cn(tabsIndicatorVariants({ variant: local.variant }), local.class)}
      {...rest}
    />
  );
}
