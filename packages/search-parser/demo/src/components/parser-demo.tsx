import type { Expression } from '@papra/search-parser';
import type { Component } from 'solid-js';
import { parseSearchQuery } from '@papra/search-parser';
import { createHighlighter } from 'shiki';
import { createMemo, createResource } from 'solid-js';
import { match } from 'ts-pattern';
import { createQueryParamSignal } from '../signals/query-params';

const queryExamples = [
  {
    label: 'Simple keywords',
    query: 'my documents',
  },
  {
    label: 'Filters and keywords',
    query: 'status:open priority:high bug',
  },
  {
    label: 'Conditions with operators',
    query: '(status:open OR status:closed) -created:>2026 "critical issue"',
  },
  {
    label: 'Complex query',
    query: 'type:feature AND (status:open OR (priority:high -tag:review)) "user feedback"',
  },
  {
    label: 'Unbalanced parentheses/quotes',
    query: '(status:open OR bug priority:"critical issue',
  },
  {
    label: 'Optimizable query',
    query: 'type:feature AND (status:open AND (priority:high -tag:review)) NOT (NOT bug)',
  },
];

const ExpressionViewer: Component<{ expression: Expression }> = (props) => {
  return (
    <>
      {match(props.expression)
        .with({ type: 'empty' }, () => <div class="text-muted">[empty]</div>)
        .with({ type: 'filter' }, expr => (
          <div class="bg-secondary border border-border rounded-md px-2 py-1 flex sm:gap-2 flex-col sm:flex-row">
            <span class="font-semibold">FILTER</span>

            <span>
              <span class="text-muted">field: </span>
              <span class="bg-surface border border-border rounded-md px-2">{expr.field}</span>
            </span>

            <span>
              <span class="text-muted">operator: </span>
              <span class="bg-surface border border-border rounded-md px-2">{expr.operator}</span>
            </span>

            <span>
              <span class="text-muted">value: </span>
              <span class="bg-surface border border-border rounded-md px-2">{expr.value}</span>
            </span>
          </div>
        ))
        .with({ type: 'text' }, expr => (
          <div class="bg-secondary border border-border rounded-md px-2 py-1 flex gap-2">
            <span class="font-semibold">TEXT</span>
            <span class="bg-surface border border-border rounded-md px-2">{expr.value}</span>
          </div>
        ))
        .with({ type: 'and' }, expr => (
          <div>
            <div class="font-bold mb-1">AND</div>
            <div class="space-y-2 pl-4 border-l-2 border-border">
              {expr.operands.map(subExpr => (
                <ExpressionViewer expression={subExpr} />
              ))}
            </div>
          </div>
        ))
        .with({ type: 'or' }, expr => (
          <div>
            <div class="font-bold mb-1">OR</div>
            <div class="space-y-2 pl-4 border-l-2 border-border">
              {expr.operands.map(subExpr => (
                <ExpressionViewer expression={subExpr} />
              ))}
            </div>
          </div>
        ))
        .with({ type: 'not' }, expr => (
          <div>
            <div class="font-bold mb-1">NOT</div>
            <div class="pl-4 border-l-2 border-border">
              <ExpressionViewer expression={expr.operand} />
            </div>
          </div>
        ))
        .exhaustive()}

    </>
  );
};

export const JsonViewer: Component<{ json: string }> = (props) => {
  const [highlighter] = createResource(async () => {
    return await createHighlighter({
      themes: ['github-light'],
      langs: ['json'],
    });
  });

  const getHtml = () => {
    return highlighter()?.codeToHtml(props.json, {
      lang: 'json',
      theme: 'github-light',
      colorReplacements: {
        '#fff': 'transparent', // background
        '#032f62': '#ff5724', // values
        '#005cc5': '#1c1917', // keys
        '#24292e': '#6b696588', // punctuation
      },
    });
  };

  return (<div innerHTML={getHtml()} class="overflow-x-auto text-sm bg-secondary p-4" />);
};

export const ParserDemo: Component = () => {
  const [getSearchQuery, setSearchQuery] = createQueryParamSignal('query');
  const [getOutputFormat, setOutputFormat] = createQueryParamSignal('format', 'expression');
  const [getOptimized, setOptimized] = createQueryParamSignal('optimized', 'yes');

  const getParsed = createMemo(() => parseSearchQuery({
    query: getSearchQuery(),
    optimize: getOptimized() === 'yes',
  }));

  return (
    <div>

      <h2 class="text-lg font-bold mb-1">
        Search Query:
      </h2>
      <input
        type="text"
        placeholder="Ex: status:open priority:high bug"
        value={getSearchQuery()}
        onInput={e => setSearchQuery(e.currentTarget.value)}
        class="text-base border border-border py-2 px-4 w-full bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        autofocus
      />
      <div class="mt-2 flex flex-wrap gap-2 flex-col sm:flex-row">
        {queryExamples.map(example => (
          <button
            class="px-2 py-1 bg-secondary rounded-lg hover:(bg-primary border-primary text-primary-foreground) transition text-sm font-medium border border-border"
            onClick={() => setSearchQuery(example.query)}
          >
            {example.label}
          </button>
        )) }
      </div>

      <h2 class="text-lg font-bold mb-1 mt-8">Parsed Output:</h2>

      <div class="flex gap-1 sm:gap-6 flex-col sm:flex-row mb-2">
        <div class="text-muted">
          Display AST as
          <div class="inline-flex ml-2 border border-border rounded-lg overflow-hidden bg-secondary text-sm">
            <button class={getOutputFormat() === 'expression' ? 'bg-surface px-4 py-1 rounded-md border border-border text-foreground' : 'px-4  border border-transparent'} onClick={() => setOutputFormat('expression')}>
              Expression tree
            </button>
            <button class={getOutputFormat() === 'json' ? 'bg-surface px-4 py-1 rounded-md border border-border text-foreground' : 'px-4 py-1 border border-transparent'} onClick={() => setOutputFormat('json')}>
              JSON
            </button>
          </div>
        </div>

        <div class="text-muted">
          Optimize AST?
          <div class="inline-flex ml-2 border border-border rounded-lg overflow-hidden bg-secondary text-sm">
            <button class={getOptimized() === 'yes' ? 'bg-surface px-4 py-1 rounded-md border border-border text-foreground' : 'px-4  border border-transparent'} onClick={() => setOptimized('yes')}>
              Yes
            </button>
            <button class={getOptimized() === 'no' ? 'bg-surface px-4 py-1 rounded-md border border-border text-foreground' : 'px-4 py-1 border border-transparent'} onClick={() => setOptimized('no')}>
              No
            </button>
          </div>
        </div>
      </div>

      <div class=" bg-background border border-border rounded-lg">
        {getOutputFormat() === 'json'
          ? <JsonViewer json={JSON.stringify(getParsed(), null, 2)} />
          : <div class="p-4"><ExpressionViewer expression={getParsed().expression} /></div>}
      </div>

      {getParsed().issues.length > 0 && getOutputFormat() === 'expression' && (
        <>
          <h2 class="text-lg font-bold mb-1 mt-8">Issues:</h2>
          <div class="p-4 bg-background border border-border rounded-lg space-y-2">
            <ul class="text-red-600 list-disc list-inside">
              {getParsed().issues.map(issue => (
                <li>
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
