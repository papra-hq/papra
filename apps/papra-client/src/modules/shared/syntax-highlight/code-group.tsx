import type { BuiltinLanguage } from 'shiki';
import type { Component, JSX } from 'solid-js';

import { Card, CardContent, CardHeader } from '@/modules/ui/components/card';
import { ToggleGroup, ToggleGroupItem } from '@/modules/ui/components/toggle-group';
import { keys, map } from 'lodash-es';
import { createSignal, splitProps } from 'solid-js';
import { cn } from '../style/cn';
import { CopyButton } from '../utils/copy';
import { SyntaxHighlight } from './syntax-highlight';

export type CodeGroupItem = {
  language: BuiltinLanguage;
  label: string;
  icon?: string;
  code: string;
};

export type CodeGroupItems = Record<string, CodeGroupItem>;

export const CodeGroup: Component<{ items: CodeGroupItems } & JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [getSelectedKey, setSelectedKey] = createSignal(keys(props.items)[0]);

  const getCurrentItem = () => props.items[getSelectedKey()];

  const [local, rest] = splitProps(props, ['class', 'items']);

  return (
    <Card class={cn('w-full overflow-hidden', local.class)} {...rest}>
      <CardHeader class="py-2 px-2 flex items-center justify-between flex-row light:bg-white">
        <div class="overflow-x-auto">
          <ToggleGroup value={getSelectedKey()} onChange={setSelectedKey} class="justify-start">
            {map(local.items, (group, index) => (
              <ToggleGroupItem class="px-3 py-1.5 leading-tight h-auto" value={index}>
                {group.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <CopyButton text={getCurrentItem().code} class="!mt-0" size="sm" variant="secondary" />
      </CardHeader>
      <CardContent class="p-0 ">
        <SyntaxHighlight code={getCurrentItem().code} language={getCurrentItem().language} class="rounded-none" />
      </CardContent>
    </Card>
  );
};
