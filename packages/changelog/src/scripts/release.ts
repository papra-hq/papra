#!/usr/bin/env node
import process from 'node:process';
import { parseArgs } from 'node:util';
import { releaseCommand } from '../commands/release';

const { values: { version } } = parseArgs({
  options: {
    version: {
      type: 'string',
      short: 'v',
    },
  },
});

releaseCommand({ version }).catch((error) => {
  console.error('Failed to release changelog:', error);
  process.exit(1);
});

