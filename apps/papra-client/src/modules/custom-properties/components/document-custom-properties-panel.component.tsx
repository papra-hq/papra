import type { Component } from 'solid-js';
import type { CustomPropertyDefinition } from '../custom-properties.types';
import type { Document } from '@/modules/documents/documents.types';
import Calendar from '@corvu/calendar';
import { A } from '@solidjs/router';

import { useMutation, useQuery } from '@tanstack/solid-query';
import { createMemo, createSignal, For, Match, Show, Switch as SolidSwitch, Suspense } from 'solid-js';
import { fetchOrganizationDocuments } from '@/modules/documents/documents.services';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganizationMembers } from '@/modules/organizations/organizations.services';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { useDebounce } from '@/modules/shared/utils/timing';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid } from '@/modules/ui/components/calendar';
import { CalendarMonthYearHeader } from '@/modules/ui/components/calendar-month-year-header';
import { NumberField, NumberFieldDecrementTrigger, NumberFieldGroup, NumberFieldIncrementTrigger, NumberFieldInput } from '@/modules/ui/components/number-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { Separator } from '@/modules/ui/components/separator';
import { createToast } from '@/modules/ui/components/sonner';
import { Switch, SwitchControl, SwitchThumb } from '@/modules/ui/components/switch';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { rawPropertyValueAsOption, rawPropertyValueAsOptionArray, rawPropertyValueAsRelatedDocumentArray, rawPropertyValueAsUserArray } from '../custom-properties.models';
import { deleteDocumentCustomPropertyValue, setDocumentCustomPropertyValue } from '../custom-properties.services';

type SelectOption = { optionId: string; name: string };

function getDateValue(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const TextPropertyEditor: Component<{
  value: string | null;
  onSave: (value: string | null) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const [draft, setDraft] = createSignal('');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(props.value ?? '');
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    const val = draft().trim();
    props.onSave(val === '' ? null : val);
    setOpen(false);
  };

  const handleClear = () => {
    props.onSave(null);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={handleOpen} placement="bottom-start">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={props.isPending}
      >
        <Show
          when={props.value}
          keyed
          fallback={<span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>}
        >
          {v => <span>{v}</span>}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-72 p-3">
        <div class="flex flex-col gap-2">
          <TextFieldRoot>
            <TextField
              value={draft()}
              onInput={e => setDraft(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={t('documents.custom-properties.text-placeholder')}
            />
          </TextFieldRoot>
          <div class="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              {t('documents.custom-properties.clear')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t('documents.custom-properties.save')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const NumberPropertyEditor: Component<{
  value: number | null;
  onSave: (value: number | null) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const [draft, setDraft] = createSignal<number | undefined>(undefined);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(props.value ?? undefined);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    const val = draft();
    props.onSave(val != null && Number.isFinite(val) ? val : null);
    setOpen(false);
  };

  const handleClear = () => {
    props.onSave(null);
    setOpen(false);
  };

  const onChange = (value: number) => {
    setDraft(value);
  };

  return (
    <Popover open={open()} onOpenChange={handleOpen} placement="bottom-start">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={props.isPending}
      >
        <Show when={props.value != null} fallback={<span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>}>
          <span>{props.value}</span>
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-56 p-3">
        <div class="flex flex-col gap-2">
          <NumberField rawValue={draft()} onRawValueChange={onChange}>
            <NumberFieldGroup>
              <NumberFieldInput onKeyDown={e => e.key === 'Enter' && handleSave()} />
              <NumberFieldDecrementTrigger />
              <NumberFieldIncrementTrigger />
            </NumberFieldGroup>
          </NumberField>
          <div class="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              {t('documents.custom-properties.clear')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t('documents.custom-properties.save')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DatePropertyEditor: Component<{
  value: Date | null;
  onSave: (value: Date | null) => void;
  isPending: boolean;
}> = (props) => {
  const { t, formatDate } = useI18n();
  const [open, setOpen] = createSignal(false);

  const handleSave = (date: Date | null) => {
    props.onSave(date);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={props.isPending}
      >
        <Show when={props.value} keyed fallback={<span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>}>
          {d => formatDate(d, { dateStyle: 'medium' })}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-auto p-3">
        <Calendar
          mode="single"
          value={props.value ?? null}
          onValueChange={handleSave}
          fixedWeeks
        >
          {() => (
            <div class="flex">
              <div class="flex flex-col gap-2">
                <CalendarMonthYearHeader />
                <CalendarGrid />
              </div>
              <div class="flex flex-col gap-1 min-w-28 ml-2 border-l pl-2">
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start text-sm"
                  onClick={() => handleSave(new Date())}
                  disabled={props.isPending}
                >
                  <div class="i-tabler-calendar-event size-4 mr-2 text-muted-foreground" />
                  {t('documents.info.today')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start text-sm"
                  onClick={() => handleSave(null)}
                  disabled={props.isPending}
                >
                  <div class="i-tabler-x size-4 mr-2 text-muted-foreground" />
                  {t('documents.custom-properties.clear')}
                </Button>
              </div>
            </div>
          )}
        </Calendar>
      </PopoverContent>
    </Popover>
  );
};

const BooleanPropertyEditor: Component<{
  value: boolean | null;
  onSave: (value: boolean) => void;
  isPending: boolean;
}> = (props) => {
  return (
    <Switch
      checked={props.value ?? false}
      onChange={checked => props.onSave(checked)}
      disabled={props.isPending}
    >
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  );
};

const SelectPropertyEditor: Component<{
  value: SelectOption | null;
  options: { id: string; name: string }[];
  onSave: (value: string | null) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);

  const handleSelect = (optionId: string) => {
    props.onSave(optionId);
    setOpen(false);
  };

  const handleClear = () => {
    props.onSave(null);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={props.isPending}
      >
        <Show when={props.value?.name} keyed fallback={<span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>}>
          {name => <span>{name}</span>}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-48 p-2">
        <div class="flex flex-col gap-1">
          <For each={props.options}>
            {option => (
              <button
                type="button"
                class={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full${props.value?.optionId === option.id ? ' bg-accent' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                {option.name}
              </button>
            )}
          </For>
          <Show when={props.value !== null}>
            <Separator class="my-1" />
            <button
              type="button"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full text-muted-foreground"
              onClick={handleClear}
            >
              <div class="i-tabler-x size-4" />
              {t('documents.custom-properties.clear')}
            </button>
          </Show>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const MultiSelectPropertyEditor: Component<{
  value: SelectOption[];
  options: { id: string; name: string }[];
  onSave: (value: string[]) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);

  const selectedIds = createMemo(() => (props.value ?? []).map(v => v.optionId));
  const displayText = createMemo(() => {
    const selected = props.value ?? [];
    return selected.length === 0 ? null : selected.map(v => v.name ?? v.optionId).join(', ');
  });

  const toggleOption = (optionId: string) => {
    const current = selectedIds();
    const next = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    props.onSave(next);
  };

  const handleClear = () => {
    props.onSave([]);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={props.isPending}
      >
        <Show when={displayText()} keyed fallback={<span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>}>
          {text => <span class="max-w-40 truncate">{text}</span>}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-52 p-2">
        <div class="flex flex-col gap-1">
          <For each={props.options}>
            {(option) => {
              const isSelected = () => selectedIds().includes(option.id);
              return (
                <button
                  type="button"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full"
                  onClick={() => toggleOption(option.id)}
                >
                  <div class={`size-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected() ? 'bg-primary border-primary' : 'border-input'}`}>
                    <Show when={isSelected()}>
                      <div class="i-tabler-check size-3 text-primary-foreground" />
                    </Show>
                  </div>
                  {option.name}
                </button>
              );
            }}
          </For>
          <Show when={selectedIds().length > 0}>
            <Separator class="my-1" />
            <button
              type="button"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full text-muted-foreground"
              onClick={handleClear}
            >
              <div class="i-tabler-x size-4" />
              {t('documents.custom-properties.clear')}
            </button>
          </Show>
        </div>
      </PopoverContent>
    </Popover>
  );
};

type UserRelationValue = { userId: string; name: string | null; email: string };

const UserRelationPropertyEditor: Component<{
  value: UserRelationValue[];
  organizationId: string;
  onSave: (value: string[]) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);

  const membersQuery = useQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'members'],
    queryFn: () => fetchOrganizationMembers({ organizationId: props.organizationId }),
    enabled: open(),
  }));

  const members = () => membersQuery.data?.members ?? [];
  const selectedUserIds = createMemo(() => props.value.map(u => u.userId));

  const toggleUser = (userId: string) => {
    const current = selectedUserIds();
    const next = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    props.onSave(next);
  };

  const handleClear = () => {
    props.onSave([]);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start">
      <div class="flex flex-col gap-0.5 min-w-0">
        <Show when={props.value.length > 0}>
          <For each={props.value}>
            {user => (
              <span class="text-sm truncate">
                {user.name ?? user.email}
              </span>
            )}
          </For>
        </Show>
        <PopoverTrigger
          as={Button}
          variant="ghost"
          class="flex items-center gap-1 group bg-transparent! p-0 h-auto text-left w-fit"
          disabled={props.isPending}
        >
          <Show
            when={props.value.length === 0}
            fallback={<span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('documents.custom-properties.user-relation-manage')}</span>}
          >
            <span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>
          </Show>
          <div class="i-tabler-pencil size-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </PopoverTrigger>
      </div>
      <PopoverContent class="w-64 p-2">
        <Suspense>
          <div class="flex flex-col gap-1">
            <For each={members()}>
              {(member) => {
                const userId = member.user?.id ?? '';
                const isSelected = () => selectedUserIds().includes(userId);
                const displayName = member.user?.name ?? member.user?.email ?? userId;
                return (
                  <button
                    type="button"
                    class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full"
                    onClick={() => toggleUser(userId)}
                  >
                    <div class={`size-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected() ? 'bg-primary border-primary' : 'border-input'}`}>
                      <Show when={isSelected()}>
                        <div class="i-tabler-check size-3 text-primary-foreground" />
                      </Show>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="truncate">{displayName}</span>
                      <Show when={member.user?.name}>
                        <span class="text-xs text-muted-foreground truncate">{member.user?.email}</span>
                      </Show>
                    </div>
                  </button>
                );
              }}
            </For>
            <Show when={selectedUserIds().length > 0}>
              <Separator class="my-1" />
              <button
                type="button"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full text-muted-foreground"
                onClick={handleClear}
              >
                <div class="i-tabler-x size-4" />
                {t('documents.custom-properties.clear')}
              </button>
            </Show>
          </div>
        </Suspense>
      </PopoverContent>
    </Popover>
  );
};

type RelatedDocumentValue = { documentId: string; name: string };

const DocumentRelationPropertyEditor: Component<{
  value: RelatedDocumentValue[];
  organizationId: string;
  onSave: (value: string[]) => void;
  isPending: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');
  const debouncedSearch = useDebounce(search, 300);

  const isSearchActive = () => debouncedSearch().length > 0;

  const documentsQuery = useQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'documents', { searchQuery: debouncedSearch() }],
    queryFn: () => fetchOrganizationDocuments({ organizationId: props.organizationId, searchQuery: debouncedSearch(), pageIndex: 0, pageSize: 10 }),
    enabled: open() && isSearchActive(),
  }));

  const searchResults = () => documentsQuery.data?.documents ?? [];
  const selectedDocumentIds = createMemo(() => props.value.map(d => d.documentId));

  const toggleDocument = (documentId: string) => {
    const current = selectedDocumentIds();
    const next = current.includes(documentId)
      ? current.filter(id => id !== documentId)
      : [...current, documentId];
    props.onSave(next);
  };

  const handleClear = () => {
    props.onSave([]);
    setOpen(false);
  };

  return (
    <Popover
      open={open()}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearch('');
        }
      }}
      placement="bottom-start"
    >
      <div class="flex flex-col gap-0.5 min-w-0">
        <Show when={props.value.length > 0}>
          <For each={props.value}>
            {doc => (
              <A
                href={`/organizations/${props.organizationId}/documents/${doc.documentId}`}
                class="text-sm hover:underline truncate"
              >
                {doc.name}
              </A>
            )}
          </For>
        </Show>
        <PopoverTrigger
          as={Button}
          variant="ghost"
          class="flex items-center gap-1 group bg-transparent! p-0 h-auto text-left w-fit"
          disabled={props.isPending}
        >
          <Show
            when={props.value.length === 0}
            fallback={<span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('documents.custom-properties.document-relation-manage')}</span>}
          >
            <span class="text-muted-foreground">{t('documents.custom-properties.no-value')}</span>
          </Show>
          <div class="i-tabler-pencil size-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </PopoverTrigger>
      </div>
      <PopoverContent class="w-72 p-2">
        <div class="flex flex-col gap-1">
          <TextFieldRoot class="mb-1">
            <TextField
              value={search()}
              onInput={e => setSearch(e.currentTarget.value)}
              placeholder={t('documents.custom-properties.document-relation-search-placeholder')}
            />
          </TextFieldRoot>
          <Suspense>
            <Show
              when={isSearchActive()}
              fallback={(
                <Show
                  when={props.value.length > 0}
                  fallback={<span class="text-sm text-muted-foreground px-2 py-1.5">{t('documents.custom-properties.no-results')}</span>}
                >
                  <For each={props.value}>
                    {doc => (
                      <button
                        type="button"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full"
                        onClick={() => toggleDocument(doc.documentId)}
                      >
                        <div class="size-4 rounded border flex-shrink-0 flex items-center justify-center bg-primary border-primary">
                          <div class="i-tabler-check size-3 text-primary-foreground" />
                        </div>
                        <span class="truncate">{doc.name}</span>
                      </button>
                    )}
                  </For>
                </Show>
              )}
            >
              <Show
                when={searchResults().length > 0}
                fallback={<span class="text-sm text-muted-foreground px-2 py-1.5">{t('documents.custom-properties.no-results')}</span>}
              >
                <For each={searchResults()}>
                  {(doc) => {
                    const isSelected = () => selectedDocumentIds().includes(doc.id);
                    return (
                      <button
                        type="button"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full"
                        onClick={() => toggleDocument(doc.id)}
                      >
                        <div class={`size-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected() ? 'bg-primary border-primary' : 'border-input'}`}>
                          <Show when={isSelected()}>
                            <div class="i-tabler-check size-3 text-primary-foreground" />
                          </Show>
                        </div>
                        <span class="truncate">{doc.name}</span>
                      </button>
                    );
                  }}
                </For>
              </Show>
            </Show>
            <Show when={selectedDocumentIds().length > 0}>
              <Separator class="my-1" />
              <button
                type="button"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left w-full text-muted-foreground"
                onClick={handleClear}
              >
                <div class="i-tabler-x size-4" />
                {t('documents.custom-properties.clear')}
              </button>
            </Show>
          </Suspense>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PropertyValueEditor: Component<{
  definition: CustomPropertyDefinition;
  rawValue: unknown;
  documentId: string;
  organizationId: string;
}> = (props) => {
  const { getErrorMessage } = useI18nApiErrors();

  const mutation = useMutation(() => ({
    mutationFn: (value: string | number | boolean | string[] | null) => {
      if (value === null) {
        return deleteDocumentCustomPropertyValue({
          organizationId: props.organizationId,
          documentId: props.documentId,
          propertyDefinitionId: props.definition.id,
        });
      }
      return setDocumentCustomPropertyValue({
        organizationId: props.organizationId,
        documentId: props.documentId,
        propertyDefinitionId: props.definition.id,
        value,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['organizations', props.organizationId, 'documents', props.documentId],
    }),
    onError: (error: unknown) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const save = (value: string | number | boolean | string[] | null) => {
    mutation.mutate(value);
  };

  return (
    <SolidSwitch>
      <Match when={props.definition.type === 'text'}>
        <TextPropertyEditor
          value={typeof props.rawValue === 'string' ? props.rawValue : null}
          onSave={save}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'number'}>
        <NumberPropertyEditor
          value={typeof props.rawValue === 'number' ? props.rawValue : null}
          onSave={save}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'date'}>
        <DatePropertyEditor
          value={getDateValue(props.rawValue)}
          onSave={date => save(date ? date.toISOString() : null)}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'boolean'}>
        <BooleanPropertyEditor
          value={typeof props.rawValue === 'boolean' ? props.rawValue : null}
          onSave={save}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'select'}>
        <SelectPropertyEditor
          value={rawPropertyValueAsOption(props.rawValue)}
          options={props.definition.options}
          onSave={optionId => save(optionId)}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'multi_select'}>
        <MultiSelectPropertyEditor
          value={rawPropertyValueAsOptionArray(props.rawValue)}
          options={props.definition.options}
          onSave={ids => save(ids)}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'user_relation'}>
        <UserRelationPropertyEditor
          value={rawPropertyValueAsUserArray(props.rawValue)}
          organizationId={props.organizationId}
          onSave={ids => save(ids)}
          isPending={mutation.isPending}
        />
      </Match>
      <Match when={props.definition.type === 'document_relation'}>
        <DocumentRelationPropertyEditor
          value={rawPropertyValueAsRelatedDocumentArray(props.rawValue)}
          organizationId={props.organizationId}
          onSave={ids => save(ids)}
          isPending={mutation.isPending}
        />
      </Match>
    </SolidSwitch>
  );
};

export const DocumentCustomPropertiesPanel: Component<{
  document: Document;
  organizationId: string;
  propertyDefinitions: CustomPropertyDefinition[];
}> = (props) => {
  const { t } = useI18n();

  const definitions = createMemo(() => props.propertyDefinitions.toSorted((a, b) => a.displayOrder - b.displayOrder));
  const getPropertyValueByKey = createMemo(() => Object.fromEntries(props.document.customProperties?.map(p => [p.key, p.value]) ?? []));
  const getPropertyValue = (key: string) => getPropertyValueByKey()[key] ?? null;

  return (
    <Show when={definitions().length > 0}>
      <>
        <div class="col-span-2 mt-4">
          <Separator class="mb-3" />
          <p class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            {t('documents.custom-properties.section-title')}
          </p>
        </div>
        <For each={definitions()}>
          {definition => (
            <>
              <div class="py-1 pr-2 text-sm text-muted-foreground flex items-start">
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <div class="i-tabler-tag size-4" />
                  {definition.name}
                </div>

              </div>
              <div class="py-1 pl-2 text-sm">
                <PropertyValueEditor
                  definition={definition}
                  rawValue={getPropertyValue(definition.key)}
                  documentId={props.document.id}
                  organizationId={props.organizationId}
                />
              </div>
            </>
          )}
        </For>
      </>
    </Show>
  );
};
