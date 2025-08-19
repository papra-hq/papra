import { pullTestContainerImages } from '../../test/containers/images.services';
import { runScript } from './commons/run-script';

await runScript(
  { scriptName: 'pull-test-container-images' },
  async () => {
    await pullTestContainerImages();
  },
);
