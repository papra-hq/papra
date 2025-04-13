import process from 'node:process';
import { memoize } from 'lodash-es';

export const getRootDirPath = memoize(() => process.cwd());
