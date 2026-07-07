import { usePathname, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';

// While the user is on one of these screens, a pending share intent is kept
// on hold instead of redirecting: they first need to select a server, sign in,
// or create their first organization. Once they land back on a regular app
// screen, the pending share resumes.
const holdPathPrefixes = ['/auth', '/config', '/organizations/create'];

const sharePath = '/share';

export function ShareIntentHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent) {
      return;
    }

    if (pathname === sharePath || holdPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }

    router.push('/(app)/(with-organizations)/share');
  }, [hasShareIntent, pathname, router]);

  return null;
}
