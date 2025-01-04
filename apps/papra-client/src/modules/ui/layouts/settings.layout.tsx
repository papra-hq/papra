import type { ParentComponent } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/button';

export const SettingsLayout: ParentComponent = (props) => {
  const navigation = [
    {
      name: 'Account',
      href: '/settings/account',
    },
    {
      name: 'Billing & Plan',
      href: '/settings/billing',
    },
  ];

  return (
    <div class="p-6 max-w-5xl mx-auto mt-4 pb-32">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold">Settings</h1>
      </div>

      <div class="flex gap-6 mb-6 border-b">
        {navigation.map(item => (
          <Button as={A} href={item.href} variant="ghost" class="px-0 border-b border-transparent text-muted-foreground rounded-b-none !bg-transparent" activeClass="!text-foreground !border-foreground">
            {item.name}
          </Button>
        ))}
      </div>

      {props.children}
    </div>
  );
};
