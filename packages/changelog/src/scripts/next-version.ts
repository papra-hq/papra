#!/usr/bin/env node
import process from 'node:process';
import { nextVersionCommand } from '../commands/next-version';

nextVersionCommand().catch((error) => {
  console.error('Failed to get next version:', error);
  process.exit(1);
});
