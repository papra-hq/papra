import type { Component } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { onMount } from 'solid-js';
import { toast } from '../../ui/components/sonner';

export const CheckoutCancelPage: Component = () => {
  onMount(() => {
    toast.error('Payment canceled');
  });

  return (
    <Navigate href="/upgrade-plan" />
  );
};
