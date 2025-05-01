import { homedir as getHomedir, platform as getPlatform } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

function getWindowsConfigDir() {
  return join(getHomedir(), 'AppData', 'Roaming');
}

function getUnixConfigDir() {
  return join(getHomedir(), '.config');
}

function getMacOSConfigDir() {
  return join(getHomedir(), 'Library', 'Application Support');
}

export function getConfigDir({ platform = getPlatform() }: { platform?: NodeJS.Platform } = {}) {
  const customAppData = process.env.APPDATA;

  if (customAppData) {
    return customAppData;
  }

  if (platform === 'win32') {
    return getWindowsConfigDir();
  }

  if (platform === 'darwin') {
    return getMacOSConfigDir();
  }

  if (platform === 'linux') {
    return getUnixConfigDir();
  }

  return getUnixConfigDir();
}

export function getConfigFilePath() {
  return join(getConfigDir(), 'papra', 'cli', 'papra.cli-config.json');
}
