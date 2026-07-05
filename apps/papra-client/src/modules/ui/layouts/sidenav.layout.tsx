import type { Component, ParentComponent } from 'solid-js';
import { createEffect, createSignal, For, on, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '../components/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';
import { useLocation } from '@solidjs/router';

export const LanguageSwitcher: Component = () => {
  const { getLocale, setLocale, locales } = useI18n();
  const languageName = new Intl.DisplayNames(getLocale(), {
    type: 'language',
    languageDisplay: 'standard',
  });

  return (
    <DropdownMenuRadioGroup value={getLocale()} onChange={setLocale}>
      <For each={locales}>
        {(locale) => (
          <DropdownMenuRadioItem value={locale.key} disabled={getLocale() === locale.key}>
            <span translate="no" lang={getLocale() === locale.key ? undefined : locale.key}>
              {locale.name}
            </span>
            <Show when={getLocale() !== locale.key}>
              <span class="text-muted-foreground pl-1">({languageName.of(locale.key)})</span>
            </Show>
          </DropdownMenuRadioItem>
        )}
      </For>
    </DropdownMenuRadioGroup>
  );
};

export const SidenavLayout: ParentComponent<{
  sideNav: Component;
  header?: Component;
  topSection?: Component;
}> = (props) => {
  const [getIsSheetOpen, setIsSheetOpen] = createSignal(false);
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      () => setIsSheetOpen(false),
      { defer: true },
    ),
  );

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-280px border-r border-r-border  flex-shrink-0 hidden lg:block bg-card">
        <props.sideNav />
      </div>

      <div class="flex-1 min-h-0 flex flex-col">
        {props.topSection && <props.topSection />}

        <div class="flex items-center px-6 pt-4">
          <Sheet open={getIsSheetOpen()} onOpenChange={setIsSheetOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon" class="lg:hidden mr-2">
                <div class="i-tabler-menu-2 size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="bg-card p-0!">
              <props.sideNav />
            </SheetContent>
          </Sheet>

          {props.header && <props.header />}
        </div>
        <div class="flex-1 overflow-auto max-w-screen">
          <Suspense>{props.children}</Suspense>
        </div>
      </div>
    </div>
  );
};
