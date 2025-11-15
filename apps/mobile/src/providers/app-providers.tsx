import type { ReactNode } from 'react';
import { ApiProvider } from './api-provider';
import { QueryProvider } from './query-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
