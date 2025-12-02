/* eslint-disable antfu/no-top-level-await */
import { registerShutdownHooks } from './modules/app/graceful-shutdown/graceful-shutdown.usecases';
import { startApp } from './start';

const { shutdownServices } = await startApp();
registerShutdownHooks({ shutdownServices });
