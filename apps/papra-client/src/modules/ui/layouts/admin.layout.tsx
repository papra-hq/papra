import { signOut } from '@/modules/auth/auth.services';

import { cn } from '@/modules/shared/style/cn';

import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { A, useNavigate } from '@solidjs/router';
import { type Component, For, type ParentComponent, Show, Suspense } from 'solid-js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/dropdown-menu';
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
          <div class="flex items-center gap-2">
            <div class={cn(props.icon, 'size-5 text-muted-foreground')}></div>
            <div>{props.label}</div>
          </div>
        </Button>
      </Show>

      <Show when={!props.onClick}>
        <Button class="block" as={A} href={props.href!} variant="ghost" activeClass="bg-accent/50! text-accent-foreground!">
          <div class="flex items-center gap-2">
            <div class={cn(props.icon, 'size-5 text-muted-foreground')}></div>
            <div>{props.label}</div>
          </div>
        </Button>
      </Show>
    </>
  );
};

const SideNav: Component = () => {
  const navigate = useNavigate();

  const getMainMenuItems = () => [
    {
      label: 'Users',
      icon: 'i-tabler-users',
      href: '/admin/users',
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
      onClick: async () => {
        await signOut();
        navigate('/login');
      },
    },
  ];

  return (
    <div class="h-full flex flex-col pb-6">
      <div class="h-60px flex items-center">
        <Button href="/admin" class="text-lg font-bold hover:no-underline gap-1" variant="link" as={A}>
          Papra
          <span class="font-normal text-base text-muted-foreground">
            Admin
          </span>
        </Button>
      </div>

      <nav class="flex flex-col gap-0.5 mt-4 text-muted-foreground">
        <For each={getMainMenuItems()}>
          {menuItem => <MenuItemButton {...menuItem} />}
        </For>
      </nav>

      <div class="flex-1"></div>

      <nav class="flex flex-col gap-0.5 text-muted-foreground">
        <For each={getFooterMenuItems()}>
          {menuItem => <MenuItemButton {...menuItem} />}
        </For>
      </nav>
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

export const AdminLayout: ParentComponent = (props) => {
  const themeStore = useThemeStore();

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-64 border-r border-r-border px-2 flex-shrink-0 hidden md:block">
        <SideNav />
      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="h-60px border-b flex items-center justify-between px-6">
          <div>
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden">
                  <div class="i-tabler-menu-2 size-6"></div>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SideNav />
              </SheetContent>
            </Sheet>
          </div>

          <div class="flex items-center gap-2">

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base" variant="outline" aria-label="Theme switcher">
                <div classList={{ 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' }}></div>
                <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            <Button as={A} href="/renderings">
              <div class="i-tabler-home size-4 mr-1"></div>
              App
            </Button>

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
