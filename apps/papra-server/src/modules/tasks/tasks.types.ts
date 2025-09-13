import type { JobRepositoryDriver } from '@cadence-mq/core';
import type { Config } from '../config/config.types';

export type TaskPersistenceConfig = Config['tasks']['persistence'];

export type TaskServiceDriverDefinition = { driver: JobRepositoryDriver; initialize?: () => Promise<void> };
export type TaskServiceDriverFactory = (args: { taskPersistenceConfig: TaskPersistenceConfig }) => TaskServiceDriverDefinition;
