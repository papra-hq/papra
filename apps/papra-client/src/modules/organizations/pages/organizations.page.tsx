import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { fetchOrganizations } from '../organizations.services';

export const OrganizationsPage: Component = () => {
  const queries = createQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  return (
    <div class="p-6 mt-4 pb-32">
      <h2 class="text-xl font-bold mb-6">
        Organizations
      </h2>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {queries.data?.organizations.map(organization => (
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-card border-b flex items-center justify-center p-6">
              <div class="size-16 text-muted-foreground"></div>
            </div>

            <div class="p-4">

              <div class="w-full text-left">
                <A
                  href={`/organizations/${organization.id}`}
                  class="text-xs font-bold truncate block"
                >
                  {organization.name}
                </A>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
