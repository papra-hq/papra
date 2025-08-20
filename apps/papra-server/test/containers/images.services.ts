import { getContainerRuntimeClient, ImageName } from 'testcontainers';
import { createLogger } from '../../src/modules/shared/logger/logger';
import { TEST_CONTAINER_IMAGES } from './images';

const logger = createLogger({ namespace: 'test-containers' });

export async function pullTestContainerImages() {
  const containerRuntimeClient = await getContainerRuntimeClient();

  await Promise.all(
    Object
      .values(TEST_CONTAINER_IMAGES)
      .map(async (image) => {
        const startedAt = Date.now();
        await containerRuntimeClient.image.pull(ImageName.fromString(image));
        const durationMs = Date.now() - startedAt;

        logger.info({ durationMs }, `Pulled image ${image}`);
      }),
  );
}
