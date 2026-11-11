import type { PublicConfig } from './config.api.contracts';
import type { Logger } from '@crowlog/logger';
import type { IntakeEmailsServices } from '../intake-emails/drivers/intake-emails.drivers.models';
import type { Config } from './config.types';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { pick } from '../shared/objects';

export function getPublicConfig({
  config,
  intakeEmailsServices,
}: {
  config: Config;
  intakeEmailsServices: Pick<IntakeEmailsServices, 'getDomains'>;
}) {
  const publicConfig: PublicConfig = {
    version: config.version,
    gitCommitSha: config.gitCommitSha,
    gitCommitDate: config.gitCommitDate,
    auth: {
      isEmailVerificationRequired: config.auth.isEmailVerificationRequired,
      isPasswordResetEnabled: config.auth.isPasswordResetEnabled,
      isRegistrationEnabled: config.auth.isRegistrationEnabled,
      showLegalLinksOnAuthPage: config.auth.showLegalLinksOnAuthPage,
      providers: {
        email: { isEnabled: config.auth.providers.email.isEnabled },
        github: { isEnabled: config.auth.providers.github.isEnabled },
        google: { isEnabled: config.auth.providers.google.isEnabled },
        customs:
          config.auth.providers.customs?.map((custom) =>
            pick(custom, ['providerId', 'providerName', 'providerIconUrl']),
          ) ?? [],
      },
    },
    documents: {
      deletedDocumentsRetentionDays: config.documents.deletedDocumentsRetentionDays,
      isReprocessingEnabled: config.documents.isReprocessingEnabled,
    },
    intakeEmails: {
      isEnabled: config.intakeEmails.isEnabled,
      address: {
        canCustomizeUsername: config.intakeEmails.username.canCustomize,
        domains: intakeEmailsServices.getDomains(),
      },
    },
    organizations: {
      deletedOrganizationsPurgeDaysDelay: config.organizations.deletedOrganizationsPurgeDaysDelay,
    },
    autoTagging: {
      isEnabled: config.autoTagging.isEnabled && config.ai.isEnabled,
    },
  };

  return {
    publicConfig,
  };
}

export function getServerBaseUrl({ config }: { config: Config }) {
  return {
    serverBaseUrl: config.appBaseUrl ?? config.server.baseUrl,
  };
}

export function getClientBaseUrl({ config }: { config: Config }) {
  return {
    clientBaseUrl: config.appBaseUrl ?? config.client.baseUrl,
  };
}

export function exitProcessDueToConfigError({
  error,
  logger,
}: {
  error: Error;
  logger: Logger;
}): never {
  logger.error({ error }, `Invalid configuration: ${error.message}`);
  process.exit(1);
}

export function validateParsedConfig({
  config,
  logger,
  validators,
}: {
  config: Config;
  logger: Logger;
  validators: ((args: { config: Config }) => void)[];
}) {
  for (const validator of validators) {
    const [, error] = safelySync(() => validator({ config }));

    if (error) {
      exitProcessDueToConfigError({ error, logger });
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Walks a figue config definition and returns every environment variable name it can be read from
export function getConfigDefinitionEnvNames({ configDefinition }: { configDefinition: Record<string, unknown> }): string[] {
  const names = new Set<string>();

  const walk = (node: Record<string, unknown>) => {
    if ('schema' in node) {
      const { env } = node;

      for (const name of Array.isArray(env) ? env : [env]) {
        if (typeof name === 'string') {
          names.add(name);
        }
      }

      return;
    }

    for (const child of Object.values(node)) {
      if (isRecord(child)) {
        walk(child);
      }
    }
  };

  walk(configDefinition);

  return [...names];
}

// Supports the `<ENV_VAR>_FILE` convention (Docker/Kubernetes secrets): when `FOO_FILE` is set to a path, the
// content of that file is used as the value of `FOO`. Only variables known by the config definition are resolved.
export async function resolveEnvVarsFromFiles({
  env,
  configDefinition,
  readTextFile = async (path) => readFile(path, 'utf-8'),
}: {
  env: Record<string, string | undefined>;
  configDefinition: Record<string, unknown>;
  readTextFile?: (path: string) => Promise<string>;
}): Promise<{ env: Record<string, string | undefined> }> {
  const resolvedEnv = { ...env };

  for (const name of getConfigDefinitionEnvNames({ configDefinition })) {
    const fileVarName = `${name}_FILE`;
    const filePath = env[fileVarName];

    if (filePath === undefined || filePath === '') {
      continue;
    }

    if (env[name] !== undefined && env[name] !== '') {
      throw new Error(`Both ${name} and ${fileVarName} are set, only one of them can be used`);
    }

    try {
      const content = await readTextFile(filePath);

      // Secret files usually end with a trailing newline that is not part of the value
      resolvedEnv[name] = content.replace(/\r?\n$/, '');
    } catch (error) {
      throw new Error(`Unable to read the file "${filePath}" referenced by ${fileVarName}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  }

  return { env: resolvedEnv };
}
