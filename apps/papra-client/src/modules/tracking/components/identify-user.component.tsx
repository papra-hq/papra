import { useSession } from '@/modules/auth/auth.services';
import { type Component, createEffect } from 'solid-js';
import { trackingServices } from '../tracking.services';

export const IdentifyUser: Component = () => {
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
