import type { ConfigDefinition, ConfigDefinitionElement } from 'figue';
import { isArray, isEmpty, isNil } from 'lodash-es';
import { configDefinition } from '../../papra-server/src/modules/config/config';

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

const rows = configDetails
  .filter(({ path }) => path[0] !== 'env')
  .map(({ doc, default: defaultValue, env, path }) => {
    const isEmptyDefaultValue = isNil(defaultValue) || (isArray(defaultValue) && isEmpty(defaultValue)) || defaultValue === '';

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

const mdSections = rows.map(({ documentation, env, path, defaultValue }) => `
###  ${env}
${documentation}

- Path: \`${path.join('.')}\`
- Environment variable: \`${env}\`
- Default value: \`${defaultValue}\`


`.trim()).join('\n\n---\n\n');

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
  const isEmptyDefaultValue = isNil(defaultValue) || (isArray(defaultValue) && isEmpty(defaultValue)) || defaultValue === '';

  return [
    ...wrapText(documentation),
    `# ${env}=${isEmptyDefaultValue ? '' : defaultValue}`,
  ].join('\n');
}).join('\n\n');

export { fullDotEnv, mdSections };
