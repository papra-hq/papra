import { createId } from '@paralleldrive/cuid2';

export { generateId };

function generateId({ prefix }: { prefix?: string } = {}) {
  const id = createId();

  return prefix ? `${prefix}_${id}` : id;
}
