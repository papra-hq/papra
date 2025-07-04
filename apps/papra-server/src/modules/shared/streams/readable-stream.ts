export async function collectReadableStreamToString({ stream }: { stream: ReadableStream }) {
  return new Response(stream).text();
}
