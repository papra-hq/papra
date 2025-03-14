import { useSession } from '@/modules/auth/auth.services';
import { buildTimeConfig } from '@/modules/config/config';
import { type Component, createEffect } from 'solid-js';
import { trackingServices } from '../tracking.services';

export const IdentifyUser: Component = () => {
  if (buildTimeConfig.isDemoMode) {
    return null;
  }

  const session = useSession();

  createEffect(() => {
    const user = session()?.data?.user;

    if (user) {
      trackingServices.identify({
        userId: user.id,
        email: user.email,
      });
    }
  });

  return null;
};
