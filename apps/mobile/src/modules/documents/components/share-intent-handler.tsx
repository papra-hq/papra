import { usePathname, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';

import { shouldRedirectShareIntent } from '../share-intent.models';

export function ShareIntentHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!shouldRedirectShareIntent({ hasShareIntent, pathname })) {
      return;
    }

    router.push('/(app)/(with-organizations)/share');
  }, [hasShareIntent, pathname, router]);

  return null;
}
