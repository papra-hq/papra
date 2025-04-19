import type { FieldElement } from '@modular-forms/solid';
import type { Component, JSX } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { createEffect, createSignal, For } from 'solid-js';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Slider } from './slider';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from './tabs';
import { TextField } from './textfield';

const DEFAULT_COLORS = [
  '#d8ff75', // Default tag color
  '#75a8ff', // Blue
  '#75ffd8', // Cyan
  '#ffd875', // Yellow
  '#ff7575', // Red
  '#75ff75', // Green
  '#d875ff', // Purple
  '#757575', // Gray
] as const;

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = 60 * ((g - b) / diff + (g < b ? 6 : 0));
        break;
      case g:
        h = 60 * ((b - r) / diff + 2);
        break;
      case b:
        h = 60 * ((r - g) / diff + 4);
        break;
    }
  }

  return { h, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number) {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else if (h >= 300 && h <= 360) {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export const ColorPicker: Component<{
  'value'?: string;
  'onChange'?: JSX.EventHandler<FieldElement, Event>;
  'onInput'?: JSX.EventHandler<FieldElement, InputEvent>;
  'class'?: string;
  'id'?: string;
  'aria-invalid'?: boolean;
  'placeholder'?: string;
}> = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getCurrentColor, setCurrentColor] = createSignal(props.value || DEFAULT_COLORS[0]);
  const [getHexInput, setHexInput] = createSignal(props.value || DEFAULT_COLORS[0]);

  const initialRgb = () => hexToRgb(getCurrentColor()) || { r: 0, g: 0, b: 0 };
  const [getRed, setRed] = createSignal(initialRgb().r);
  const [getGreen, setGreen] = createSignal(initialRgb().g);
  const [getBlue, setBlue] = createSignal(initialRgb().b);

  const initialHsv = () => rgbToHsv(getRed(), getGreen(), getBlue());
  const [getHue, setHue] = createSignal(initialHsv().h);
  const [getSaturation, setSaturation] = createSignal(initialHsv().s);
  const [getValue, setValue] = createSignal(initialHsv().v);

  createEffect(() => {
    if (props.value) {
      setCurrentColor(props.value);
      setHexInput(props.value);
      const rgb = hexToRgb(props.value);
      if (rgb) {
        setRed(rgb.r);
        setGreen(rgb.g);
        setBlue(rgb.b);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
      }
    }
  });

  const triggerChange = (color: string) => {
    const element = { value: color } as FieldElement;

    const eventBase = {
      currentTarget: element,
      target: element,
    } as unknown;

    const event = eventBase as Event & { currentTarget: FieldElement; target: Element };
    props.onChange?.(event);

    const inputEvent = eventBase as InputEvent & { currentTarget: FieldElement; target: Element };
    props.onInput?.(inputEvent);
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    setHexInput(color);
    triggerChange(color);
  };

  const handleRgbChange = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    setCurrentColor(hex);
    setHexInput(hex);
    const hsv = rgbToHsv(r, g, b);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    triggerChange(hex);
  };

  const handleHsvChange = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    setRed(rgb.r);
    setGreen(rgb.g);
    setBlue(rgb.b);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setCurrentColor(hex);
    setHexInput(hex);
    triggerChange(hex);
  };

  const handleHexInput = (value: string) => {
    const hex = value.startsWith('#') ? value : `#${value}`;
    setHexInput(hex);

    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setCurrentColor(hex);
      const rgb = hexToRgb(hex);
      if (rgb) {
        setRed(rgb.r);
        setGreen(rgb.g);
        setBlue(rgb.b);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
      }
      triggerChange(hex);
    }
  };

  return (
    <div class={cn('w-full', props.class)}>
      <div class="flex gap-2">
        <Popover open={getIsOpen()} onOpenChange={setIsOpen}>
          <PopoverTrigger
            type="button"
            class={cn(
              'w-[4rem] h-[2.25rem] p-1',
              props['aria-invalid'] && 'border-red-500',
            )}
            id={props.id}
          >
            <div
              class="w-full h-full rounded"
              style={{ 'background-color': getCurrentColor() }}
            />
          </PopoverTrigger>
          <PopoverContent class="w-[20rem] p-4">
            <div class="space-y-4">
              <div class="h-[3rem] rounded-md" style={{ 'background-color': getCurrentColor() }} />

              <Tabs defaultValue="rgb" class="w-full">
                <TabsList class="w-full h-8">
                  <TabsTrigger value="rgb">RGB</TabsTrigger>
                  <TabsTrigger value="hsv">HSV</TabsTrigger>
                  <TabsIndicator />
                </TabsList>

                <TabsContent value="rgb">
                  <div class="space-y-2">
                    <For each={['r', 'g', 'b'] as const}>
                      {(channel) => {
                        const getValue = channel === 'r' ? getRed : channel === 'g' ? getGreen : getBlue;
                        const setValue = channel === 'r' ? setRed : channel === 'g' ? setGreen : setBlue;

                        return (
                          <div class="flex items-center gap-2">
                            <span class="w-2 uppercase">{channel}</span>
                            <Slider
                              min={0}
                              max={255}
                              value={[getValue()]}
                              onChange={(value) => {
                                const newValue = Array.isArray(value) ? value[0] : value;
                                setValue(newValue);
                                handleRgbChange(
                                  channel === 'r' ? newValue : getRed(),
                                  channel === 'g' ? newValue : getGreen(),
                                  channel === 'b' ? newValue : getBlue(),
                                );
                              }}
                              class="flex-1"
                            />
                            <span class="w-8 text-right">{getValue()}</span>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </TabsContent>

                <TabsContent value="hsv">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="w-2">H</span>
                      <Slider
                        min={0}
                        max={360}
                        value={[getHue()]}
                        onChange={(value) => {
                          const h = Array.isArray(value) ? value[0] : value;
                          setHue(h);
                          handleHsvChange(h, getSaturation(), getValue());
                        }}
                        class="flex-1"
                      />
                      <span class="w-8 text-right">{Math.round(getHue())}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-2">S</span>
                      <Slider
                        min={0}
                        max={100}
                        value={[getSaturation()]}
                        onChange={(value) => {
                          const s = Array.isArray(value) ? value[0] : value;
                          setSaturation(s);
                          handleHsvChange(getHue(), s, getValue());
                        }}
                        class="flex-1"
                      />
                      <span class="w-8 text-right">{Math.round(getSaturation())}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-2">V</span>
                      <Slider
                        min={0}
                        max={100}
                        value={[getValue()]}
                        onChange={(value) => {
                          const v = Array.isArray(value) ? value[0] : value;
                          setValue(v);
                          handleHsvChange(getHue(), getSaturation(), v);
                        }}
                        class="flex-1"
                      />
                      <span class="w-8 text-right">{Math.round(getValue())}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div class="grid grid-cols-4 gap-1">
                <For each={DEFAULT_COLORS}>
                  {color => (
                    <Button
                      type="button"
                      variant="outline"
                      class="w-full h-[2rem] p-1"
                      onClick={() => handleColorChange(color)}
                    >
                      <div
                        class="w-full h-full rounded"
                        style={{ 'background-color': color }}
                      />
                    </Button>
                  )}
                </For>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <TextField
          value={getHexInput()}
          onInput={e => handleHexInput(e.currentTarget.value)}
          class="flex-1 font-mono"
          maxLength={7}
          placeholder={props.placeholder ?? 'Hex color (e.g. #ff0000)'}
          aria-invalid={props['aria-invalid']}
        />
      </div>
    </div>
  );
};
