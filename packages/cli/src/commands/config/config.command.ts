import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import * as v from 'valibot';
import { ensureString } from '../commands.models';
import { apiKeySchema, apiUrlSchema } from './config.schemas';
import { getConfig, updateConfig } from './config.services';

function defineConfigSetter({
  name,
  description,
  configKey,
  argument,
}: {
  name: string;
  description: string;
  configKey: string;
  argument: {
    description: string;
    valueHint: string;
    promptLabel: string;
  };
}) {
  return defineCommand({
    meta: {
      name,
      description,
    },
    args: {
      [name]: {
        type: 'positional',
        description: argument.description,
        valueHint: argument.valueHint,
        required: false,
      },
    },
    run: async ({ args }) => {
      const valueFromArgs = args[name];

      if (valueFromArgs) {
        await updateConfig(config => ({ ...config, [configKey]: ensureString(valueFromArgs) }));

        prompts.log.info(`${name} set to ${valueFromArgs}`);

        return;
      }

      const valueFromPrompt = await prompts.text({
        message: argument.promptLabel,
      });

      if (prompts.isCancel(valueFromPrompt)) {
        return;
      }

      await updateConfig(config => ({ ...config, [configKey]: valueFromPrompt }));

      prompts.log.info(`${name} set to ${valueFromPrompt}`);
    },
  });
}

export const configCommand = defineCommand({
  meta: {
    name: 'config',
    description: 'Manage Papra CLI configuration',
  },
  subCommands: {
    init: defineCommand({
      meta: {
        name: 'init',
        description: 'Initialize the configuration',
      },
      run: async () => {
        const group = await prompts.group(
          {
            apiUrl: () => prompts.text({
              message: 'Enter your instance URL (e.g. https://api.papra.app)',
              validate: (value) => {
                const result = v.safeParser(apiUrlSchema)(value);

                if (result.success) {
                  return undefined;
                }

                return result.issues.map(({ message }) => message).join('\n');
              },
            }),
            apiKey: () => prompts.text({
              message: `Enter your API key (can be be found in your User Settings)`,
              validate: (value) => {
                const result = v.safeParser(apiKeySchema)(value);

                if (result.success) {
                  return undefined;
                }

                return result.issues.map(({ message }) => message).join('\n');
              },
            }),
          },
          {
            onCancel: () => {
              prompts.cancel('Configuration initialization cancelled');

              process.exit(0);
            },
          },
        );

        await updateConfig(config => ({
          ...config,
          ...group,
        }));

        prompts.log.info('Configuration initialized!');
      },
    }),

    list: defineCommand({
      meta: {
        name: 'list',
        description: 'List all configuration values',
      },
      run: async () => {
        const config = await getConfig();

        const isEmpty = Object.keys(config).length === 0;

        if (isEmpty) {
          prompts.log.warn('No configuration values set');

          return;
        }

        prompts.log.info(JSON.stringify(config, null, 2));
      },
    }),

    set: defineCommand({
      meta: {
        name: 'set',
        description: 'Set a configuration value',
      },
      subCommands: {
        'api-key': defineConfigSetter({
          name: 'api-key',
          description: 'Set the API key',
          configKey: 'apiKey',
          argument: {
            description: 'The API key',
            valueHint: 'your-api-key',
            promptLabel: 'Enter the API key',
          },
        }),

        'api-url': defineConfigSetter({
          name: 'api-url',
          description: 'Set the API URL',
          configKey: 'apiUrl',
          argument: {
            description: 'The API URL',
            valueHint: 'https://api.papra.app',
            promptLabel: 'Enter the API URL',
          },
        }),

        'default-org-id': defineConfigSetter({
          name: 'default-org-id',
          description: 'Set a default organization ID to use when running commands',
          configKey: 'defaultOrganizationId',
          argument: {
            description: 'The default organization ID',
            valueHint: 'organization-id',
            promptLabel: 'Enter the default organization ID',
          },
        }),
      },
    }),
  },
});
