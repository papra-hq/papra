import Constants from 'expo-constants';

export const APP_SCHEME = String(Constants.expoConfig?.scheme ?? 'papra');
export const APP_VERSION = Constants.expoConfig?.version;

const gitCommitSha: unknown = Constants.expoConfig?.extra?.gitCommitSha;
export const APP_COMMIT_SHA = typeof gitCommitSha === 'string' ? gitCommitSha : undefined;
