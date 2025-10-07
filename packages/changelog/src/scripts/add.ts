#!/usr/bin/env node
import process from 'node:process';
import { addCommand } from '../commands/add';

addCommand().catch((error) => {
  console.error('Failed to add changelog entry:', error);
  process.exit(1);
});
