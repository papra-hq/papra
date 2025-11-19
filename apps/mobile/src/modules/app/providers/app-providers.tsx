import type { ReactNode } from 'react';
import { QueryProvider } from '../../api/providers/query.provider';
import { AlertProvider } from '../../ui/providers/alert-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AlertProvider>
        {children}
      </AlertProvider>
    </QueryProvider>
  );
}
