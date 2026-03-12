import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
import type { CustomPropertyDefinition, CustomPropertyType } from '../custom-properties.types';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { Switch, SwitchControl, SwitchThumb } from '@/modules/ui/components/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { CUSTOM_PROPERTY_TYPES_LIST } from '../custom-properties.constants';
import {
  createCustomPropertyDefinition,
  deleteCustomPropertyDefinition,
  fetchCustomPropertyDefinitions,
  updateCustomPropertyDefinition,
} from '../custom-properties.services';

const PROPERTY_TYPE_LABEL_KEYS = {
  text: 'custom-properties.types.text',
  number: 'custom-properties.types.number',
  date: 'custom-properties.types.date',
  boolean: 'custom-properties.types.boolean',
  select: 'custom-properties.types.select',
  multi_select: 'custom-properties.types.multi_select',
} as const;

function isSelectLikeType(type: string): boolean {
  return type === 'select' || type === 'multi_select';
}

const SelectOptionsEditor: Component<{
  options: { value: string; color?: string | null }[];
  onChange: (options: { value: string; color?: string | null }[]) => void;
}> = (props) => {
  const { t } = useI18n();

  const addOption = () => {
    props.onChange([...props.options, { value: '' }]);
  };

  const removeOption = (index: number) => {
    props.onChange(props.options.filter((_, i) => i !== index));
  };

  const updateOptionValue = (index: number, value: string) => {
    const updated = [...props.options];
    updated[index] = { ...updated[index], value };
    props.onChange(updated);
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="text-sm font-medium">{t('custom-properties.form.options.label')}</div>

      <Show when={props.options.length === 0}>
        <p class="text-sm text-muted-foreground">{t('custom-properties.form.options.empty')}</p>
      </Show>

      <For each={props.options}>
        {(option, index) => (
          <div class="flex items-center gap-2">
            <TextFieldRoot class="flex-1">
              <TextField
                type="text"
                value={option.value}
                onInput={e => updateOptionValue(index(), e.currentTarget.value)}
                placeholder={t('custom-properties.form.options.value.placeholder')}
              />
            </TextFieldRoot>
            <Button type="button" variant="outline" size="icon" class="size-9 flex-shrink-0" onClick={() => removeOption(index())}>
              <div class="i-tabler-x size-4" />
            </Button>
          </div>
        )}
      </For>

      <Button type="button" variant="outline" size="sm" onClick={addOption} class="w-fit">
        <div class="i-tabler-plus size-4 mr-1" />
        {t('custom-properties.form.options.add')}
      </Button>
    </div>
  );
};

const PropertyDefinitionForm: Component<{
  onSubmit: (values: {
    name: string;
    description: string;
    type: CustomPropertyType;
    isRequired: boolean;
    options: { value: string; color?: string | null }[];
  }) => Promise<unknown> | unknown;
  initialValues?: {
    name?: string;
    description?: string | null;
    type?: CustomPropertyType;
    isRequired?: boolean;
    options?: { value: string; color?: string | null }[];
  };
  submitButton: JSX.Element;
  isTypeDisabled?: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [getType, setType] = createSignal<CustomPropertyType>(props.initialValues?.type ?? 'text');
  const [getIsRequired, setIsRequired] = createSignal(props.initialValues?.isRequired ?? false);
  const [getOptions, setOptions] = createSignal<{ value: string; color?: string | null }[]>(props.initialValues?.options ?? []);

  const { Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(async (values: { name: string; description: string }) => {
      await props.onSubmit({
        ...values,
        type: getType(),
        isRequired: getIsRequired(),
        options: isSelectLikeType(getType()) ? getOptions() : [],
      });
    }),
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('custom-properties.form.name.required')),
        v.maxLength(128, t('custom-properties.form.name.max-length')),
      ),
      description: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(512, t('custom-properties.form.description.max-length')),
      ),
    }),
    initialValues: {
      name: props.initialValues?.name ?? '',
      description: props.initialValues?.description ?? '',
    },
  });

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">{t('custom-properties.form.name.label')}</TextFieldLabel>
            <TextField type="text" id="name" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('custom-properties.form.name.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="description">
              {t('custom-properties.form.description.label')}
              <span class="font-normal ml-1 text-muted-foreground">{t('custom-properties.form.description.optional')}</span>
            </TextFieldLabel>
            <TextArea id="description" {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('custom-properties.form.description.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex flex-col gap-1 mb-4">
        <div class="text-sm font-medium">{t('custom-properties.form.type.label')}</div>
        <Select
          options={CUSTOM_PROPERTY_TYPES_LIST}
          value={getType()}
          onChange={(value) => {
            if (value) {
              setType(value as CustomPropertyType);
            }
          }}
          disabled={props.isTypeDisabled}
          optionValue={value => value}
          optionTextValue={value => t(PROPERTY_TYPE_LABEL_KEYS[value as CustomPropertyType])}
          placeholder={t('custom-properties.form.type.placeholder')}
          itemComponent={itemProps => (
            <SelectItem item={itemProps.item}>
              {t(PROPERTY_TYPE_LABEL_KEYS[itemProps.item.rawValue as CustomPropertyType])}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<string>>
              {state => t(PROPERTY_TYPE_LABEL_KEYS[state.selectedOption() as CustomPropertyType])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <Show when={isSelectLikeType(getType())}>
        <div class="mb-4">
          <SelectOptionsEditor options={getOptions()} onChange={setOptions} />
        </div>
      </Show>

      <div class="flex items-center gap-3 mb-4">
        <Switch checked={getIsRequired()} onChange={setIsRequired} class="flex items-center gap-2">
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <div class="text-sm font-medium cursor-pointer">{t('custom-properties.form.required.label')}</div>
        </Switch>
      </div>

      <div class="flex flex-row-reverse justify-between items-center mt-6">
        {props.submitButton}
      </div>
    </Form>
  );
};

const CreatePropertyDefinitionModal: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const createMutation = useMutation(() => ({
    mutationFn: (data: { name: string; description: string; type: CustomPropertyType; isRequired: boolean; options: { value: string; color?: string | null }[] }) => createCustomPropertyDefinition({
      name: data.name,
      description: data.description || null,
      type: data.type,
      isRequired: data.isRequired,
      options: data.options.filter(o => o.value.trim() !== '').map((o, i) => ({ value: o.value.trim(), color: o.color, displayOrder: i })),
      organizationId: props.organizationId,
    }),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'custom-properties'],
        refetchType: 'all',
      });

      createToast({
        message: t('custom-properties.create.success', { name: variables.name }),
        type: 'success',
      });

      setIsModalOpen(false);
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      {props.children && <DialogTrigger as={props.children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('custom-properties.create')}</DialogTitle>
        </DialogHeader>

        <PropertyDefinitionForm
          onSubmit={createMutation.mutateAsync}
          submitButton={(
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!getIsModalOpen()}
            >
              {t('custom-properties.create')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

const UpdatePropertyDefinitionModal: Component<{
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
  propertyDefinition: CustomPropertyDefinition;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const updateMutation = useMutation(() => ({
    mutationFn: (data: { name: string; description: string; type: CustomPropertyType; isRequired: boolean; options: { value: string; color?: string | null }[] }) => updateCustomPropertyDefinition({
      name: data.name,
      description: data.description || null,
      isRequired: data.isRequired,
      options: data.options.filter(o => o.value.trim() !== '').map((o, i) => ({ value: o.value.trim(), color: o.color, displayOrder: i })),
      organizationId: props.organizationId,
      propertyDefinitionId: props.propertyDefinition.id,
    }),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId],
        refetchType: 'all',
      });

      createToast({
        message: t('custom-properties.update.success', { name: variables.name }),
        type: 'success',
      });

      setIsModalOpen(false);
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('custom-properties.update')}</DialogTitle>
        </DialogHeader>

        <PropertyDefinitionForm
          onSubmit={updateMutation.mutateAsync}
          initialValues={{
            name: props.propertyDefinition.name,
            description: props.propertyDefinition.description,
            type: props.propertyDefinition.type,
            isRequired: props.propertyDefinition.isRequired,
            options: props.propertyDefinition.options?.map(o => ({ value: o.value, color: o.color })) ?? [],
          }}
          isTypeDisabled
          submitButton={(
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={!getIsModalOpen()}
            >
              {t('custom-properties.update')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

export const CustomPropertiesPage: Component = () => {
  const params = useParams();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'custom-properties'],
    queryFn: () => fetchCustomPropertyDefinitions({ organizationId: params.organizationId }),
  }));

  const del = async ({ propertyDefinition }: { propertyDefinition: CustomPropertyDefinition }) => {
    const confirmed = await confirm({
      title: t('custom-properties.delete.confirm.title'),
      message: t('custom-properties.delete.confirm.message'),
      cancelButton: {
        text: t('custom-properties.delete.confirm.cancel-button'),
        variant: 'secondary',
      },
      confirmButton: {
        text: t('custom-properties.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteCustomPropertyDefinition({
      organizationId: params.organizationId,
      propertyDefinitionId: propertyDefinition.id,
    }));

    if (error) {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });

      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId, 'custom-properties'],
      refetchType: 'all',
    });

    createToast({
      message: t('custom-properties.delete.success'),
      type: 'success',
    });
  };

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <Suspense>
        <Show when={query.data?.propertyDefinitions}>
          {getPropertyDefinitions => (
            <Show
              when={getPropertyDefinitions().length > 0}
              fallback={(
                <EmptyState
                  title={t('custom-properties.no-properties.title')}
                  icon="i-tabler-forms"
                  description={t('custom-properties.no-properties.description')}
                  cta={(
                    <CreatePropertyDefinitionModal organizationId={params.organizationId}>
                      {triggerProps => (
                        <Button {...triggerProps}>
                          <div class="i-tabler-plus size-4 mr-2" />
                          {t('custom-properties.no-properties.create')}
                        </Button>
                      )}
                    </CreatePropertyDefinitionModal>
                  )}
                />
              )}
            >
              <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
                <div>
                  <h2 class="text-xl font-bold">
                    {t('custom-properties.title')}
                  </h2>

                  <p class="text-muted-foreground mt-1">
                    {t('custom-properties.description')}
                  </p>
                </div>

                <div class="flex-shrink-0">
                  <CreatePropertyDefinitionModal organizationId={params.organizationId}>
                    {triggerProps => (
                      <Button class="w-full" {...triggerProps}>
                        <div class="i-tabler-plus size-4 mr-2" />
                        {t('custom-properties.create')}
                      </Button>
                    )}
                  </CreatePropertyDefinitionModal>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('custom-properties.table.headers.name')}</TableHead>
                    <TableHead>{t('custom-properties.table.headers.type')}</TableHead>
                    <TableHead>{t('custom-properties.table.headers.description')}</TableHead>
                    <TableHead>{t('custom-properties.table.headers.required')}</TableHead>
                    <TableHead>{t('custom-properties.table.headers.created')}</TableHead>
                    <TableHead class="text-right">{t('custom-properties.table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={getPropertyDefinitions()}>
                    {propDef => (
                      <TableRow>
                        <TableCell>
                          <span class="font-medium">{propDef.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {t(PROPERTY_TYPE_LABEL_KEYS[propDef.type])}
                          </Badge>
                        </TableCell>
                        <TableCell class="text-wrap">
                          {propDef.description || <span class="text-muted-foreground">{t('custom-properties.form.no-description')}</span>}
                        </TableCell>
                        <TableCell>
                          {propDef.isRequired
                            ? <Badge variant="default">{t('custom-properties.document.true')}</Badge>
                            : <span class="text-muted-foreground">{t('custom-properties.document.false')}</span>}
                        </TableCell>
                        <TableCell class="text-muted-foreground" title={propDef.createdAt.toLocaleString()}>
                          <RelativeTime date={propDef.createdAt} />
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-2 justify-end">
                            <UpdatePropertyDefinitionModal organizationId={params.organizationId} propertyDefinition={propDef}>
                              {triggerProps => (
                                <Button size="icon" variant="outline" class="size-7" {...triggerProps}>
                                  <div class="i-tabler-edit size-4" />
                                </Button>
                              )}
                            </UpdatePropertyDefinitionModal>

                            <Button size="icon" variant="outline" class="size-7 text-red" onClick={() => del({ propertyDefinition: propDef })}>
                              <div class="i-tabler-trash size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
