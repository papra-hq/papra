export type ServerEnvironment = 'managed' | 'self-hosted';

export type AppConfig = {
  serverUrl: string;
  environment: ServerEnvironment;
};

export const MANAGED_SERVER_URL = 'https://api.papra.app';
