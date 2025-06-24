import type { Color } from '@kobalte/core/colors';
import type { VariantProps } from 'class-variance-authority';
import type { Component, ParentProps } from 'solid-js';
import { ColorSlider } from '@kobalte/core/color-slider';
import { parseColor } from '@kobalte/core/colors';
import { cva } from 'class-variance-authority';
import { createSignal, For, splitProps } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { getLuminance } from '@/modules/shared/colors/luminance';
import { cn } from '@/modules/shared/style/cn';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { TextField, TextFieldRoot } from './textfield';

const Slider: Component<{
  channel: 'hue' | 'saturation' | 'lightness';
  label: string;
  value: Color;
  onChange?: (value: Color) => void;
}> = (props) => {
  return (
    <ColorSlider channel={props.channel} class="relative flex flex-col gap-0.5 w-full" value={props.value} onChange={props.onChange}>
      <div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <ColorSlider.Label>{props.label}</ColorSlider.Label>
        <ColorSlider.ValueLabel />
      </div>
      <ColorSlider.Track class="w-full h-24px rounded relative ">
        <ColorSlider.Thumb class="w-4 h-4 top-4px rounded-full bg-[var(--kb-color-current)] border-2 border-#0a0a0a">
          <ColorSlider.Input />
        </ColorSlider.Thumb>
      </ColorSlider.Track>
    </ColorSlider>
  );
};

const ColorPicker: Component<{
  color: string;
  onChange?: (color: string) => void;
}> = (props) => {
  const { t } = useI18n();
  const [color, setColor] = createSignal<Color>(parseColor(props.color).toFormat('hsl'));

  const onUpdateColor = (color: Color) => {
    setColor(color.toFormat('hsl'));
    props.onChange?.(color.toString('hex').toUpperCase());
  };

  const onInputColorChange = (e: Event) => {
    const color = (e.target as HTMLInputElement).value;

    try {
      const parsedColor = parseColor(color);
      onUpdateColor(parsedColor);
    } catch (_error) {
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <Slider channel="hue" label={t('color-picker.hue')} value={color()} onChange={onUpdateColor} />
      <Slider channel="saturation" label={t('color-picker.saturation')} value={color()} onChange={onUpdateColor} />
      <Slider channel="lightness" label={t('color-picker.lightness')} value={color()} onChange={onUpdateColor} />

      <TextFieldRoot>
        <TextField value={color().toString('hex').toUpperCase()} onInput={onInputColorChange} placeholder="#000000" />
      </TextFieldRoot>
    </div>
  );
};

export const colorSwatchVariants = cva(
  'rounded-lg border-2 border-background shadow-sm transition-all hover:scale-110 focus-visible:(outline-none ring-1.5 ring-ring ring-offset-1)',
  {
    variants: {
      size: {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
      },
      selected: {
        true: 'ring-1.5 ring-primary! ring-offset-1',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      selected: false,
    },
  },
);

type ColorSwatchPickerProps = ParentProps<{
  value?: string;
  onChange?: (color: string) => void;
  colors?: string[];
  size?: VariantProps<typeof colorSwatchVariants>['size'];
  class?: string;
  disabled?: boolean;
}>;

export function ColorSwatchPicker(props: ColorSwatchPickerProps) {
  const { t } = useI18n();
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'colors',
    'size',
    'class',
    'disabled',
    'children',
  ]);

  const colors = () => local.colors ?? [];
  const selectedColor = () => local.value ?? colors()[0];

  const handleColorSelect = (color: string) => {
    if (!local.disabled && local.onChange) {
      local.onChange(color);
    }
  };

  const getIsNotInSwatch = (color?: string) => color && !colors().includes(color);

  function getContrastTextColor(color: string) {
    const luminance = getLuminance(color);
    // 0.179 is the threshold for WCAG 2.0 level AA
    return luminance > 0.179 ? 'black' : 'white';
  }

  return (
    <div
      class={cn(
        'inline-flex items-center gap-1 flex-wrap',
        local.disabled && 'opacity-50 cursor-not-allowed',
        local.class,
      )}
      {...rest}
    >
      <For each={colors()}>
        {color => (
          <button
            type="button"
            class={cn(
              colorSwatchVariants({
                size: local.size,
                selected: selectedColor() === color,
              }),
            )}
            style={{ 'background-color': color }}
            onClick={() => handleColorSelect(color)}
            disabled={local.disabled}
            aria-label={`${t('color-picker.select-color')} ${color}`}
            title={color}
          />
        )}
      </For>

      <Popover>
        <PopoverTrigger
          as={Button}
          variant="outline"
          size="icon"
          class={cn(getIsNotInSwatch(local.value) && 'ring-1.5 ring-primary! ring-offset-1')}
          style={{ 'background-color': getIsNotInSwatch(local.value) ? local.value : '' }}
          aria-label={t('color-picker.select-a-color')}
        >
          <div class="i-tabler-plus size-4" style={{ color: getIsNotInSwatch(local.value) ? getContrastTextColor(local.value ?? '') : undefined }}></div>
        </PopoverTrigger>
        <PopoverContent>
          <p class="text-sm font-medium mb-4">{t('color-picker.select-a-color')}</p>

          <ColorPicker color={local.value ?? ''} onChange={local?.onChange} />
        </PopoverContent>
      </Popover>

    </div>
  );
}
