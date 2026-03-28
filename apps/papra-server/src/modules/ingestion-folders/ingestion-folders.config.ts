import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema } from '../config/config.schemas';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { IN_MS } from '../shared/units';
import { defaultIgnoredPatterns } from './ingestion-folders.constants';

export const ingestionFolderConfig = {
  isEnabled: {
    doc: 'Whether ingestion folders are enabled',
    schema: booleanishSchema,
    default: false,
    env: 'INGESTION_FOLDER_IS_ENABLED',
  },
  folderRootPath: {
    doc: 'The root directory in which ingestion folders for each organization are stored',
    schema: v.string(),
    default: './ingestion',
    env: 'INGESTION_FOLDER_ROOT_PATH',
  },
  watcher: {
    usePolling: {
      doc: 'Whether to use polling for the ingestion folder watcher',
      schema: booleanishSchema,
      default: false,
      env: 'INGESTION_FOLDER_WATCHER_USE_POLLING',
    },
    pollingInterval: {
      doc: 'When polling is used, this is the interval at which the watcher checks for changes in the ingestion folder (in milliseconds)',
      schema: coercedStrictlyPositiveIntegerSchema,
      default: 2 * IN_MS.SECOND,
      env: 'INGESTION_FOLDER_WATCHER_POLLING_INTERVAL_MS',
    },
  },
  processingConcurrency: {
    doc: 'The number of files that can be processed concurrently by the server. Increasing this can improve processing speed, but it will also increase CPU and memory usage.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 1,
    env: 'INGESTION_FOLDER_PROCESSING_CONCURRENCY',
  },
  errorFolder: {
    doc: 'The folder to move the file when the ingestion fails, the path is relative to the organization ingestion folder (<ingestion root>/<organization id>)',
    schema: v.string(),
    default: './ingestion-error',
    env: 'INGESTION_FOLDER_ERROR_FOLDER_PATH',
  },
  postProcessing: {
    strategy: {
      doc: 'The action done on the file after it has been ingested',
      schema: v.picklist(['delete', 'move']),
      default: 'delete',
      env: 'INGESTION_FOLDER_POST_PROCESSING_STRATEGY',
    },
    moveToFolderPath: {
      doc: 'The folder to move the file when the post-processing strategy is "move", the path is relative to the organization ingestion folder (<ingestion root>/<organization id>)',
      schema: v.string(),
      default: './ingestion-done',
      env: 'INGESTION_FOLDER_POST_PROCESSING_MOVE_FOLDER_PATH',
    },
  },
  ignoredPatterns: {
    doc: `Comma separated list of patterns to ignore when watching the ingestion folder. Note that if you update this variable, it'll override the default patterns, not merge them. Regarding the format and syntax, please refer to the [picomatch documentation](https://github.com/micromatch/picomatch/blob/bf6a33bd3db990edfbfd20b3b160eed926cd07dd/README.md#globbing-features)`,

    schema: v.union([
      v.pipe(
        v.string(),
        v.transform(value => value.split(',')),
      ),
      v.array(v.string()),
    ]),
    default: defaultIgnoredPatterns,
    env: 'INGESTION_FOLDER_IGNORED_PATTERNS',
  },
} as const satisfies ConfigDefinition;
