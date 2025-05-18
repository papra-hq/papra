import type { ParentComponent } from 'solid-js';
import { A } from '@solidjs/router';
import { cn } from '@/modules/shared/style/cn';
import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '../components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../components/dropdown-menu';
import { LanguageSwitcher, ThemeSwitcher } from './sidenav.layout';

export const AuthLayout: ParentComponent = (props) => {
  const themeStore = useThemeStore();

  return (
    <div class="h-screen w-full flex flex-col">
      <div class="p-6 flex justify-between items-center gap-2">
        <A href="/" class="group text-base text-muted-foreground flex gap-2 font-semibold hover:text-foreground transition">
          <div class="i-tabler-file-text size-6 text-primary transform rotate-12deg group-hover:rotate-25deg transition"></div>

          Papra
        </A>

        <div class="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" aria-label="Theme switcher">
              <div class={cn('size-4.5', { 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' })}></div>
              <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-42">
              <ThemeSwitcher />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" aria-label="Language switcher">
              <div class="i-tabler-language size-5"></div>
              <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-42">
              <LanguageSwitcher />
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      <div class="flex-1">
        {props.children}
      </div>

    </div>
  );
};
