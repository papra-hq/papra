import type { LocaleKeys } from '@/modules/i18n/locales.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import { type Component, createSignal, For } from 'solid-js';
import { API_KEY_PERMISSIONS } from '../api-keys.constants';

export const ApiKeyPermissionsPicker: Component<{ permissions: string[]; onChange: (permissions: string[]) => void }> = (props) => {
  const [permissions, setPermissions] = createSignal<string[]>(props.permissions);
  const { t } = useI18n();

  const getPermissionsSections = () => {
    return API_KEY_PERMISSIONS.map(section => ({
      ...section,
      title: t(`api-keys.permissions.${section.section}.title`),
      permissions: section.permissions.map((permission) => {
        const [prefix, suffix] = permission.split(':');

        return {
          name: permission,
          prefix,
          suffix,
          description: t(`api-keys.permissions.${section.section}.${permission}` as LocaleKeys),
        };
      }),
    }));
  };

  const isPermissionSelected = (permission: string) => {
    return permissions().includes(permission);
  };

  const togglePermission = (permission: string) => {
    setPermissions((prev) => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      }

      return [...prev, permission];
    });

    props.onChange(permissions());
  };

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <For each={getPermissionsSections()}>
        {section => (
          <div>
            <p class="text-muted-foreground text-xs">{section.title}</p>

            <div class="pl-4 flex flex-col gap-4 mt-4">
              <For each={section.permissions}>
                {permission => (
                  <Checkbox
                    class="flex items-center gap-2"
                    checked={isPermissionSelected(permission.name)}
                    onChange={() => togglePermission(permission.name)}
                  >
                    <CheckboxControl />
                    <div class="flex flex-col gap-1">
                      <CheckboxLabel class="text-sm leading-none">
                        {permission.description}
                      </CheckboxLabel>
                    </div>
                  </Checkbox>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};
