import type { ConfigDefinition, ConfigDefinitionElement } from 'figue';

import { configDefinition } from '../../papra-server/src/modules/config/config';
import { renderMarkdown } from './markdown';

function walk(configDefinition: ConfigDefinition, path: string[] = []): (ConfigDefinitionElement & { path: string[] })[] {
  return Object
    .entries(configDefinition)
    .flatMap(([key, value]) => {
      if ('schema' in value) {
        return [{ ...value, path: [...path, key] }] as (ConfigDefinitionElement & { path: string[] })[];
      }

      return walk(value, [...path, key]);
    });
}

const configDetails = walk(configDefinition);

function formatDoc(doc: string | undefined): string {
  const coerced = (doc ?? '').trim();

  if (coerced.endsWith('.')) {
    return coerced;
  }

  return `${coerced}.`;
}

function getIsEmptyDefaultValue(defaultValue: unknown): boolean {
  return defaultValue === undefined || defaultValue === null || defaultValue === '' || (Array.isArray(defaultValue) && defaultValue.length === 0);
}

const rows = configDetails
  .filter(({ showInDocumentation }) => showInDocumentation !== false)
  .map(({ doc, default: defaultValue, env, path }) => {
    const isEmptyDefaultValue = getIsEmptyDefaultValue(defaultValue);

    const rawDocumentation = formatDoc(doc);

    // The client baseUrl default value is overridden in the Dockerfiles
    const defaultOverride = path.join('.') === 'client.baseUrl' ? 'http://localhost:1221' : undefined;

    return {
      path,
      env,
      documentation: rawDocumentation,
      defaultValue: defaultOverride ?? (isEmptyDefaultValue ? undefined : defaultValue),
    };
  });

const mdSections = rows.map(({ documentation, env, path, defaultValue }) => {
  const envs = Array.isArray(env) ? env : [env];
  const [firstEnv, ...restEnvs] = envs;

  return `
### ${firstEnv}
${documentation}

- Path: \`${path.join('.')}\`
- Environment variable: \`${firstEnv}\` ${restEnvs.length ? `, with fallback to: ${restEnvs.map(e => `\`${e}\``).join(', ')}` : ''}
- Default value: \`${defaultValue}\`


`.trim();
}).join('\n\n---\n\n');

function wrapText(text: string, maxLength = 75) {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length + 1 <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.map(line => `# ${line}`);
}

const fullDotEnv = rows.map(({ env, defaultValue, documentation }) => {
  const isEmptyDefaultValue = getIsEmptyDefaultValue(defaultValue);
  const envs = Array.isArray(env) ? env : [env];
  const [firstEnv] = envs;

  return [
    ...wrapText(documentation),
    `# ${firstEnv}=${isEmptyDefaultValue ? '' : defaultValue}`,
  ].join('\n');
}).join('\n\n');

const sectionsHtml = renderMarkdown(mdSections);

export { fullDotEnv, mdSections, sectionsHtml };
