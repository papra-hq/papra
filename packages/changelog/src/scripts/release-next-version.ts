#!/usr/bin/env node
import process from 'node:process';
import { releaseCommand } from '../commands/release';
import { getNextVersion } from '../utils';

releaseCommand({ version: getNextVersion() }).catch((error) => {
  console.error('Failed to release changelog:', error);
  process.exit(1);
});
