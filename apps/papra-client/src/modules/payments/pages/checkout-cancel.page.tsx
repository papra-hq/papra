import type { Component } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { onMount } from 'solid-js';
import { createToast } from '../../ui/components/sonner';

export const CheckoutCancelPage: Component = () => {
  onMount(() => {
    createToast({ type: 'error', message: 'Payment canceled' });
  });

  return (
    <Navigate href="/upgrade-plan" />
  );
};
