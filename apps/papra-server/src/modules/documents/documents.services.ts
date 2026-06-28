import { getStreamSha256Hash } from '../shared/streams/stream-hash';

export async function getFileHash({ fileStream }: { fileStream: ReadableStream<Uint8Array> }) {
  const { hash } = await getStreamSha256Hash({ stream: fileStream });

  return { hash };
}
