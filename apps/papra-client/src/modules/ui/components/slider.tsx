import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { SliderRootProps } from '@kobalte/core/slider';
import type { ValidComponent } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Slider as SliderPrimitive } from '@kobalte/core/slider';
import { splitProps } from 'solid-js';

type sliderProps<T extends ValidComponent = 'div'> = SliderRootProps<T> & {
  class?: string;
  value?: number[];
  onChange?: (value: number[]) => void;
  min?: number;
  max?: number;
};

export function Slider<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, sliderProps<T>>) {
  const [local, rest] = splitProps(props as sliderProps, ['class', 'value', 'onChange', 'min', 'max']);

  return (
    <SliderPrimitive
      class={cn(
        'relative flex w-full touch-none select-none items-center',
        local.class,
      )}
      value={local.value ?? undefined}
      onChange={value => local.onChange?.(value)}
      minValue={local.min ?? 0}
      maxValue={local.max ?? 100}
      defaultValue={[Array.isArray(local.value) ? local.value[0] : (local.value ?? 0)]}
      {...rest}
    >
      <SliderPrimitive.Track class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Fill class="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:(outline-none ring-1.5 ring-ring) disabled:pointer-events-none" />
    </SliderPrimitive>
  );
}
