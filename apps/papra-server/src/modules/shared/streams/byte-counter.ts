import { Transform } from 'node:stream';

export function createByteCounter({ onByteCountChange }: { onByteCountChange?: (arg: { byteCount: number; destroy: (args: { error: Error }) => void }) => void } = {}) {
  let byteCount = 0;

  const tap = new Transform({
    async transform(chunk: Uint8Array, _, callback) {
      byteCount += chunk.length;

      onByteCountChange?.({ byteCount, destroy: ({ error }) => tap.destroy(error) });

      callback(null, chunk);
    },
  });

  return {
    getByteCount: () => byteCount,
    tap,
  };
}
