import type { Component } from 'solid-js';
import type { TranslationKeys } from '@/modules/i18n/locales.types';
import { createSignal, For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
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
          description: t(`api-keys.permissions.${section.section}.${permission}` as TranslationKeys),
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

  const toggleSection = (sectionName: typeof API_KEY_PERMISSIONS[number]['section']) => {
    const section = API_KEY_PERMISSIONS.find(s => s.section === sectionName);
    if (!section) {
      return;
    }

    const sectionPermissions: ReadonlyArray<string> = section.permissions;
    const currentPermissions = permissions();

    const allSelected = sectionPermissions.every(p => currentPermissions.includes(p));

    setPermissions((prev) => {
      if (allSelected) {
        return [...prev.filter(p => !sectionPermissions.includes(p))];
      }

      return [...new Set([...prev, ...sectionPermissions])];
    });
  };

  return (
    <div class="p-6 pb-8 border rounded-md mt-2">

      <div class="flex flex-col gap-6">
        <For each={getPermissionsSections()}>
          {section => (
            <div>
              <Button variant="link" class="text-muted-foreground text-xs p-0 h-auto hover:no-underline" onClick={() => toggleSection(section.section)}>{section.title}</Button>

              <div class="pl-4 flex flex-col mt-2">
                <For each={section.permissions}>
                  {permission => (
                    <Checkbox
                      class="flex items-center gap-2"
                      checked={isPermissionSelected(permission.name)}
                      onChange={() => togglePermission(permission.name)}
                    >
                      <CheckboxControl />
                      <div class="flex flex-col gap-1">
                        <CheckboxLabel class="text-sm leading-none py-1">
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

      <div class="flex items-center gap-2 mt-6 border-t pt-6">
        <Button
          variant="outline"
          size="sm"
          class="disabled:(op-100! border-op-50 text-muted-foreground)"
          onClick={() => setPermissions(API_KEY_PERMISSIONS.flatMap(section => section.permissions))}
          disabled={permissions().length === API_KEY_PERMISSIONS.flatMap(section => section.permissions).length}
        >
          {t('api-keys.permissions.select-all')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="disabled:(op-100! border-op-50 text-muted-foreground)"
          onClick={() => setPermissions([])}
          disabled={permissions().length === 0}
        >
          {t('api-keys.permissions.deselect-all')}
        </Button>
      </div>
    </div>
  );
};
