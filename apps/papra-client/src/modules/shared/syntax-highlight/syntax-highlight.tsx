import type { Component, JSX } from 'solid-js';
import { codeToHtml } from 'shiki';
import { createEffect, createSignal, splitProps } from 'solid-js';
import { cn } from '../style/cn';
import { theme } from './theme';

export const SyntaxHighlight: Component<{ code: string; language: string } & JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, rest] = splitProps(props, ['code', 'language', 'class']);
  const [html, setHtml] = createSignal<string | undefined>();

  createEffect(async () => {
    const codeHtml = await codeToHtml(local.code, {
      lang: local.language,
      theme,
    });
    setHtml(codeHtml);
  });

  return (
    <div class={cn('rounded-lg px-8 py-6 bg-#111 overflow-auto text-muted-foreground', local.class)} {...rest}>
      {html() ? <div innerHTML={html()} /> : <pre>{local.code}</pre>}
    </div>
  );
};
