import type { Component } from 'solid-js';
import type { CustomPropertyDefinition, CustomPropertyType, DocumentPropertyValue } from '../custom-properties.types';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createEffect, createSignal, For, on, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { Switch, SwitchControl, SwitchThumb } from '@/modules/ui/components/switch';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import {
  deleteDocumentPropertyValue,
  fetchCustomPropertyDefinitions,
  setDocumentPropertyValue,
} from '../custom-properties.services';

function getDocumentQueryKey({ organizationId, documentId }: { organizationId: string; documentId: string }) {
  return ['organizations', organizationId, 'documents', documentId];
}

function getDefinitionsQueryKey({ organizationId }: { organizationId: string }) {
  return ['organizations', organizationId, 'custom-properties'];
}

function findValueForDefinition({ propertyValues, definitionId }: { propertyValues: DocumentPropertyValue[]; definitionId: string }): DocumentPropertyValue | undefined {
  return propertyValues.find(v => v.propertyDefinitionId === definitionId);
}

const TextPropertyEditor: Component<{
  value: string | null;
  onSave: (value: string | null) => void;
}> = (props) => {
  const [getLocalValue, setLocalValue] = createSignal(props.value ?? '');

  createEffect(on(() => props.value, (value) => {
    setLocalValue(value ?? '');
  }));

  const handleBlur = () => {
    const trimmed = getLocalValue().trim();
    const newValue = trimmed === '' ? null : trimmed;

    if (newValue !== props.value) {
      props.onSave(newValue);
    }
  };

  return (
    <TextFieldRoot>
      <TextField
        type="text"
        value={getLocalValue()}
        onInput={e => setLocalValue(e.currentTarget.value)}
        onBlur={handleBlur}
        class="h-8 text-sm"
      />
    </TextFieldRoot>
  );
};

const NumberPropertyEditor: Component<{
  value: number | null;
  onSave: (value: number | null) => void;
}> = (props) => {
  const [getLocalValue, setLocalValue] = createSignal(props.value != null ? String(props.value) : '');

  createEffect(on(() => props.value, (value) => {
    setLocalValue(value != null ? String(value) : '');
  }));

  const handleBlur = () => {
    const trimmed = getLocalValue().trim();

    if (trimmed === '') {
      if (props.value != null) {
        props.onSave(null);
      }
      return;
    }

    const num = Number(trimmed);

    if (!Number.isNaN(num) && num !== props.value) {
      props.onSave(num);
    }
  };

  return (
    <TextFieldRoot>
      <TextField
        type="number"
        value={getLocalValue()}
        onInput={e => setLocalValue(e.currentTarget.value)}
        onBlur={handleBlur}
        class="h-8 text-sm"
      />
    </TextFieldRoot>
  );
};

const DatePropertyEditor: Component<{
  value: string | null;
  onSave: (value: string | null) => void;
}> = (props) => {
  const [getLocalValue, setLocalValue] = createSignal(props.value ?? '');

  createEffect(on(() => props.value, (value) => {
    setLocalValue(value ?? '');
  }));

  const handleChange = (value: string) => {
    setLocalValue(value);
    const newValue = value === '' ? null : value;

    if (newValue !== props.value) {
      props.onSave(newValue);
    }
  };

  return (
    <TextFieldRoot>
      <TextField
        type="date"
        value={getLocalValue()}
        onChange={e => handleChange(e.currentTarget.value)}
        class="h-8 text-sm"
      />
    </TextFieldRoot>
  );
};

const BooleanPropertyEditor: Component<{
  value: boolean | null;
  onSave: (value: boolean) => void;
  onClear: () => void;
}> = (props) => {
  return (
    <div class="flex items-center gap-2">
      <Switch checked={props.value === true} onChange={value => props.onSave(value)}>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <Show when={props.value != null}>
        <Button variant="ghost" size="icon" class="size-6" onClick={() => props.onClear()}>
          <div class="i-tabler-x size-3" />
        </Button>
      </Show>
    </div>
  );
};

const SelectPropertyEditor: Component<{
  value: string | null;
  options: { value: string; color?: string | null }[];
  onSave: (value: string | null) => void;
}> = (props) => {
  const { t } = useI18n();

  const getOptionValues = () => ['', ...props.options.map(o => o.value)];

  return (
    <Select
      value={props.value ?? ''}
      onChange={(value) => {
        const newValue = value === '' ? null : value;
        props.onSave(newValue);
      }}
      options={getOptionValues()}
      optionValue={value => value}
      optionTextValue={value => value === '' ? t('custom-properties.document.no-value') : value}
      itemComponent={itemProps => (
        <SelectItem item={itemProps.item}>
          {itemProps.item.rawValue === '' ? <span class="text-muted-foreground">{t('custom-properties.document.no-value')}</span> : itemProps.item.rawValue}
        </SelectItem>
      )}
    >
      <SelectTrigger class="h-8 text-sm">
        <SelectValue<string>>
          {state => state.selectedOption() === '' ? <span class="text-muted-foreground">{t('custom-properties.document.no-value')}</span> : state.selectedOption()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
};

const MultiSelectPropertyEditor: Component<{
  value: string[] | null;
  options: { value: string; color?: string | null }[];
  onSave: (value: string[] | null) => void;
}> = (props) => {
  const getSelectedValues = () => new Set(props.value ?? []);

  const toggleOption = (optionValue: string) => {
    const current = getSelectedValues();
    const updated = new Set(current);

    if (updated.has(optionValue)) {
      updated.delete(optionValue);
    } else {
      updated.add(optionValue);
    }

    const newValue = updated.size === 0 ? null : [...updated];
    props.onSave(newValue);
  };

  return (
    <div class="flex flex-wrap gap-1">
      <For each={props.options}>
        {option => (
          <Badge
            variant={getSelectedValues().has(option.value) ? 'default' : 'outline'}
            class="cursor-pointer select-none"
            onClick={() => toggleOption(option.value)}
          >
            {option.value}
          </Badge>
        )}
      </For>
    </div>
  );
};

const PropertyValueEditor: Component<{
  definition: CustomPropertyDefinition;
  propertyValue: DocumentPropertyValue | undefined;
  organizationId: string;
  documentId: string;
}> = (props) => {
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const saveMutation = useMutation(() => ({
    mutationFn: ({ value }: { value: string | number | boolean | string[] | null }) => setDocumentPropertyValue({
      organizationId: props.organizationId,
      documentId: props.documentId,
      propertyDefinitionId: props.definition.id,
      value,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getDocumentQueryKey({ organizationId: props.organizationId, documentId: props.documentId }),
      });
      createToast({ message: t('custom-properties.document.save.success'), type: 'success' });
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const deleteMutation = useMutation(() => ({
    mutationFn: () => deleteDocumentPropertyValue({
      organizationId: props.organizationId,
      documentId: props.documentId,
      propertyDefinitionId: props.definition.id,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getDocumentQueryKey({ organizationId: props.organizationId, documentId: props.documentId }),
      });
      createToast({ message: t('custom-properties.document.remove.success'), type: 'success' });
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const handleSave = (value: string | number | boolean | string[] | null) => {
    if (value == null) {
      deleteMutation.mutate();
      return;
    }

    saveMutation.mutate({ value });
  };

  const getRawValue = () => props.propertyValue?.value ?? null;

  const getEditor = (type: CustomPropertyType) => {
    switch (type) {
      case 'text':
        return <TextPropertyEditor value={getRawValue() as string | null} onSave={handleSave} />;
      case 'number':
        return <NumberPropertyEditor value={getRawValue() as number | null} onSave={handleSave} />;
      case 'date':
        return <DatePropertyEditor value={getRawValue() as string | null} onSave={handleSave} />;
      case 'boolean':
        return (
          <BooleanPropertyEditor
            value={getRawValue() as boolean | null}
            onSave={value => handleSave(value)}
            onClear={() => handleSave(null)}
          />
        );
      case 'select':
        return (
          <SelectPropertyEditor
            value={getRawValue() as string | null}
            options={props.definition.options ?? []}
            onSave={handleSave}
          />
        );
      case 'multi_select':
        return (
          <MultiSelectPropertyEditor
            value={getRawValue() as string[] | null}
            options={props.definition.options ?? []}
            onSave={handleSave}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">{props.definition.name}</span>
        <Show when={props.definition.isRequired}>
          <span class="text-xs text-destructive">*</span>
        </Show>
      </div>
      {getEditor(props.definition.type)}
    </div>
  );
};

export const DocumentCustomProperties: Component<{
  documentId: string;
  organizationId: string;
  propertyValues: DocumentPropertyValue[];
}> = (props) => {
  const { t } = useI18n();

  const definitionsQuery = useQuery(() => ({
    queryKey: getDefinitionsQueryKey({ organizationId: props.organizationId }),
    queryFn: () => fetchCustomPropertyDefinitions({ organizationId: props.organizationId }),
  }));

  return (
    <Show when={definitionsQuery.data?.propertyDefinitions}>
      {getDefinitions => (
        <Show when={getDefinitions().length > 0}>
          <div class="flex flex-col gap-3">
            <span class="text-sm font-medium">{t('custom-properties.document.title')}</span>

            <For each={getDefinitions()}>
              {definition => (
                <PropertyValueEditor
                  definition={definition}
                  propertyValue={findValueForDefinition({
                    propertyValues: props.propertyValues,
                    definitionId: definition.id,
                  })}
                  organizationId={props.organizationId}
                  documentId={props.documentId}
                />
              )}
            </For>
          </div>
        </Show>
      )}
    </Show>
  );
};
