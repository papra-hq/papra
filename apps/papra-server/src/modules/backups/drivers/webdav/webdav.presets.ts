// A "preset" just knows how to turn (server URL, username, a folder path the
// user picked) into the actual WebDAV root URL to talk to. Nextcloud (and
// ownCloud) namespace every user's files under a fixed, username-dependent path;
// plain/generic WebDAV servers don't.

export type WebdavPreset = 'generic' | 'nextcloud';

export function resolveWebdavRootUrl({
  preset,
  baseUrl,
  username,
}: {
  preset: WebdavPreset;
  baseUrl: string;
  username?: string;
}): string {
  const trimmed = baseUrl.replace(/\/+$/, '');

  if (preset === 'nextcloud') {
    if (!username) {
      throw new Error('Nextcloud preset requires a username to build the WebDAV root path');
    }
    return `${trimmed}/remote.php/dav/files/${encodeURIComponent(username)}`;
  }

  // Generic: the base URL the user gave us IS the WebDAV root.
  return trimmed;
}
