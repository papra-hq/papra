import type { ParentComponent } from 'solid-js';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { SideNav } from '@/modules/ui/components/sidenav';
import { Button } from '../components/button';
import { SidenavLayout } from './sidenav.layout';

export const SettingsLayout: ParentComponent = (props) => {
  const { t } = useI18n();

  const getMainMenuItems = () => [
    {
      items: [
        {
          label: t('layout.menu.account'),
          icon: 'i-tabler-user',
          href: '/settings',
        },
        {
          label: t('layout.menu.api-keys'),
          icon: 'i-tabler-key',
          href: '/api-keys',
        },
        {
          label: t('layout.menu.invitations'),
          icon: 'i-tabler-mail',
          href: '/invitations',
        },
      ],
    },
  ];

  return (
    <SidenavLayout
      sideNav={() => (
        <SideNav
          mainMenu={getMainMenuItems()}
          header={() => (
            <div class="pl-6 py-3 border-b border-b-border flex items-center gap-1">
              <Button variant="ghost" size="icon" class="text-muted-foreground" as={A} href="/">
                <div class="i-tabler-arrow-left size-5" />
              </Button>
              <h1 class="text-lg font-bold">{t('layout.menu.settings')}</h1>
            </div>
          )}
        />
      )}
      children={props.children}
    />
  );
};
