import type { Organization } from '@/modules/organizations/organizations.types';

import { authStore } from '@/modules/auth/auth.store';
import { uploadDocument } from '@/modules/documents/documents.services';
import { fetchOrganizations } from '@/modules/organizations/organizations.services';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';
import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';

import { A, useNavigate, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { type Component, createEffect, type ParentComponent, Show, Suspense } from 'solid-js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';

type MenuItem = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
};

const MenuItemButton: Component<MenuItem> = (props) => {
  return (
    <>
      <Show when={props.onClick}>
        <Button class="block" onClick={props.onClick} variant="ghost">
          <div class="flex items-center gap-2 dark:text-muted-foreground">
            <div class={cn(props.icon, 'size-5')}></div>
            <div>{props.label}</div>
          </div>
        </Button>
      </Show>

      <Show when={!props.onClick}>
        <Button class="block dark:text-muted-foreground" as={A} href={props.href!} variant="ghost" activeClass="bg-accent/50! text-accent-foreground! ">
          <div class="flex items-center gap-2">
            <div class={cn(props.icon, 'size-5')}></div>
            <div>{props.label}</div>
          </div>
        </Button>
      </Show>
    </>
  );
};

const SideNav: Component = () => {
  const navigate = useNavigate();
  const params = useParams();

  const getMainMenuItems = () => [
    {
      label: 'Documents',
      icon: 'i-tabler-file-text',
      href: `/organizations/${params.organizationId}`,
    },
    {
      label: 'Deleted documents',
      icon: 'i-tabler-trash',
      href: `/organizations/${params.organizationId}/deleted`,
    },
    {
      label: 'Settings',
      icon: 'i-tabler-settings',
      href: `/organizations/${params.organizationId}/settings`,
    },

  ];

  const getFooterMenuItems = () => [
    {
      label: 'Settings',
      icon: 'i-tabler-settings',
      href: '/settings',
    },
    {
      label: 'Logout',
      icon: 'i-tabler-logout',
      onClick: () => {
        authStore.logout();
        navigate('/login');
      },
    },
  ];

  const query = createQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  return (
    <div class="flex h-full">
      <div class="w-65px border-r bg-card pt-4">
        <Button variant="link" as={A} href="/" class="text-lg font-bold hover:no-underline flex items-center text-foreground mb-4">
          <div class="i-tabler-file-text size-8"></div>
        </Button>

        <Button variant="link" as={A} href="/organizations" class="text-lg font-bold hover:no-underline flex items-center text-foreground dark:text-muted-foreground">
          <div class="i-tabler-building-community size-5"></div>
        </Button>

        <Button variant="link" as={A} href="/docs" class="text-lg font-bold hover:no-underline flex items-center text-foreground dark:text-muted-foreground mt-1">
          <div class="i-tabler-book-2 size-5"></div>
        </Button>

      </div>
      <div class="h-full flex flex-col pb-6 flex-1">

        <div class="px-6 pt-4">
          <Select
            options={[...query.data?.organizations ?? [], { id: 'create' }]}
            optionValue="id"
            optionTextValue="name"
            value={query.data?.organizations.find(organization => organization.id === params.organizationId)}
            onChange={value => value && (
              value.id === 'create'
                ? navigate('/organizations/create')
                : navigate(`/organizations/${value.id}`)
            )}

            itemComponent={props => props.item.rawValue.id === 'create'
              ? (
                  <SelectItem class="cursor-pointer" item={props.item}>
                    <div class="flex items-center gap-2 text-muted-foreground">
                      <div class="i-tabler-plus size-4"></div>
                      <div>Create new organization</div>
                    </div>
                  </SelectItem>
                )
              : (
                  <SelectItem class="cursor-pointer" item={props.item}>{props.item.rawValue.name}</SelectItem>
                )}
          >
            <SelectTrigger>
              <SelectValue<Organization>>
                {state => state.selectedOption().name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>

        </div>

        <nav class="flex flex-col gap-0.5 mt-4 px-4">
          {getMainMenuItems().map(menuItem => <MenuItemButton {...menuItem} />)}
        </nav>

        <div class="flex-1"></div>

        <nav class="flex flex-col gap-0.5 px-4">
          {getFooterMenuItems().map(menuItem => <MenuItemButton {...menuItem} />)}
        </nav>
      </div>
    </div>
  );
};

const ThemeSwitcher: Component = () => {
  const themeStore = useThemeStore();

  return (
    <>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'light' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-sun text-lg"></div>
        Light Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'dark' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-moon text-lg"></div>
        Dark Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'system' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-device-laptop text-lg"></div>
        System Mode
      </DropdownMenuItem>
    </>
  );
};

export const OrganizationLayout: ParentComponent = (props) => {
  const { user } = useCurrentUser();
  const themeStore = useThemeStore();
  const params = useParams();
  const navigate = useNavigate();

  const query = createQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  createEffect(() => {
    if (query.data?.organizations && query.data.organizations.length === 0) {
      navigate('/organizations/create');
    }
  });

  const promptImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) {
        return;
      }

      for (const file of Array.from(input.files)) {
        await uploadDocument({ file, organizationId: params.organizationId });
      }

      queryClient.invalidateQueries({
        queryKey: ['organizations', params.organizationId, 'documents'],
        refetchType: 'all',
      });
    };
    input.click();
  };

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-320px border-r border-r-border  flex-shrink-0 hidden md:block bg-card">
        <SideNav />
      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="flex justify-between px-6 pt-4">

          <div class="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden mr-2">
                  <div class="i-tabler-menu-2 size-6"></div>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" class="bg-card p-0!">
                <SideNav />
              </SheetContent>
            </Sheet>

            <Button variant="outline" class="lg:min-w-64  justify-start">
              <div class="i-tabler-search size-4 mr-2"></div>
              Search...
            </Button>
          </div>

          <div class="flex items-center gap-2">
            <Button onClick={promptImport}>
              <div class="i-tabler-upload size-4"></div>
              <span class="hidden sm:inline ml-2">
                Import a document
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base hidden sm:flex" variant="outline" aria-label="Theme switcher">
                <div classList={{ 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' }}></div>
                <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            {user.roles.includes('admin') && (
              <Button as={A} href="/admin">
                <div class="i-tabler-settings size-4 mr-2"></div>
                Admin
              </Button>
            )}

          </div>
        </div>
        <div class="flex-1 overflow-auto max-w-screen">
          <Suspense>
            {props.children}
          </Suspense>
        </div>
      </div>
    </div>
  );
};
