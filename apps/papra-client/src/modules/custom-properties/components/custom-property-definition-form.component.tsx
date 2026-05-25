import type { Component, JSX } from 'solid-js';
import type { CustomPropertyDefinition, CustomPropertyType } from '../custom-properties.types';
import { getValue, insert, remove, setValue } from '@modular-forms/solid';
import { A } from '@solidjs/router';
import { For, Show } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { PROPERTY_TYPE_LABEL_I18N_KEYS } from '../custom-properties.constants';

const PROPERTY_TYPES: CustomPropertyType[] = ['text', 'number', 'date', 'boolean', 'select', 'multi_select', 'user_relation', 'document_relation'];
const SELECT_LIKE_TYPES: CustomPropertyType[] = ['select', 'multi_select'];

type OptionDraft = { id?: string; name: string };
export type PropertyDefinitionDraft = { name: string; description?: string; type: CustomPropertyType; options?: OptionDraft[] };

export const CustomPropertyDefinitionForm: Component<{
  onSubmit: (args: { propertyDefinition: PropertyDefinitionDraft }) => Promise<void> | void;
  organizationId: string;
  propertyDefinition?: CustomPropertyDefinition;
  submitButton: JSX.Element;
}> = (props) => {
  const hasExistingType = () => Boolean(props.propertyDefinition?.type);
  const { getErrorMessage } = useI18nApiErrors();
  const { t } = useI18n();

  const { form, Form, Field, FieldArray, createFormError } = createForm({
    onSubmit: async ({ name, description, type, options }) => {
      // TODO: make a discriminated union of the form values based on the type to avoid having to do this kind of validation
      if ((!options || options.length === 0) && SELECT_LIKE_TYPES.includes(type)) {
        throw createFormError({ message: t('custom-properties.form.options.validation.required') });
      }

      try {
        await props.onSubmit({
          propertyDefinition: {
            name,
            description,
            type,
            options,
          },
        });
      } catch (error) {
        const message = getErrorMessage({ error, defaultMessage: t('custom-properties.form.save-error') });
        throw createFormError({ message });
      }
    },
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('custom-properties.form.name.required')),
        v.maxLength(255, t('custom-properties.form.name.max-length')),
      ),
      description: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(1000, t('custom-properties.form.description.max-length')),
      ),
      type: v.picklist(PROPERTY_TYPES),
      options: v.optional(
        v.array(v.object({
          id: v.optional(v.string()),
          name: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, t('custom-properties.form.options.name.required')),
            v.maxLength(255, t('custom-properties.form.options.name.max-length')),
          ),
        })),
        [],
      ),
    }),
    initialValues: {
      name: props.propertyDefinition?.name ?? '',
      description: props.propertyDefinition?.description ?? '',
      type: props.propertyDefinition?.type ?? 'text',
      options: props.propertyDefinition?.options?.map(o => ({ id: o.id, name: o.name })) ?? [{ name: '' }],
    },
  });

  const currentType = () => getValue(form, 'type');
  const isSelectLike = () => SELECT_LIKE_TYPES.includes(currentType() as CustomPropertyType);

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1">
            <TextFieldLabel for="name">{t('custom-properties.form.name.label')}</TextFieldLabel>
            <TextField
              type="text"
              id="name"
              placeholder={t('custom-properties.form.name.placeholder')}
              {...inputProps}
              value={field.value}
              aria-invalid={Boolean(field.error)}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mt-6">
            <TextFieldLabel for="description">
              {t('custom-properties.form.description.label')}
              <span class="text-muted-foreground font-normal ml-1">{t('custom-properties.form.description.optional')}</span>
            </TextFieldLabel>
            <TextArea
              id="description"
              placeholder={t('custom-properties.form.description.placeholder')}
              {...inputProps}
              value={field.value}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="type">
        {field => (
          <div class="flex flex-col gap-1 mt-6">
            <label class="text-sm font-medium" for="type">{t('custom-properties.form.type.label')}</label>
            <Select
              id="type"
              defaultValue={field.value ?? 'text'}
              onChange={value => value && setValue(form, 'type', value as CustomPropertyType)}
              options={PROPERTY_TYPES}
              itemComponent={itemProps => (
                <SelectItem item={itemProps.item}>{t(PROPERTY_TYPE_LABEL_I18N_KEYS[itemProps.item.rawValue as CustomPropertyType])}</SelectItem>
              )}
              disabled={hasExistingType()}
            >
              <SelectTrigger class="w-full">
                <SelectValue<CustomPropertyType>>{state => t(PROPERTY_TYPE_LABEL_I18N_KEYS[state.selectedOption()])}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </div>
        )}
      </Field>

      <Show when={hasExistingType()}>
        <p class="text-xs text-muted-foreground">{t('custom-properties.form.type.immutable')}</p>
      </Show>

      <Show when={isSelectLike()}>
        <p class="mb-1 font-medium mt-6">{t('custom-properties.form.options.title')}</p>
        <p class="mb-3 text-sm text-muted-foreground">{t('custom-properties.form.options.description')}</p>

        <FieldArray name="options">
          {fieldArray => (
            <div class="flex flex-col gap-3">
              <For each={fieldArray.items}>
                {(_, index) => (
                  <Field name={`options.${index()}.id`}>
                    {() => (
                      <div class="flex gap-2 items-start">
                        <div class="flex-1">
                          <Field name={`options.${index()}.name`}>
                            {(field, inputProps) => (
                              <TextFieldRoot>
                                <TextField
                                  placeholder={t('custom-properties.form.options.name.placeholder')}
                                  {...inputProps}
                                  value={field.value}
                                  aria-invalid={Boolean(field.error)}
                                />
                                {field.error && <div class="text-red-500 text-xs mt-1">{field.error}</div>}
                              </TextFieldRoot>
                            )}
                          </Field>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          class="shrink-0"
                          onClick={() => remove(form, 'options', { at: index() })}
                        >
                          <div class="i-tabler-x size-4" />
                        </Button>
                      </div>
                    )}
                  </Field>
                )}
              </For>

              <Button
                variant="outline"
                class="gap-2 mt-1 self-start"
                onClick={() => insert(form, 'options', { value: { name: '' } })}
              >
                <div class="i-tabler-plus size-4" />
                {t('custom-properties.form.options.add')}
              </Button>

              {fieldArray.error && <div class="text-red-500 text-sm">{fieldArray.error}</div>}
            </div>
          )}
        </FieldArray>
      </Show>

      <div class="flex justify-end mt-8 gap-2">
        <Button variant="outline" as={A} href={`/organizations/${props.organizationId}/custom-properties`}>
          {t('custom-properties.form.cancel')}
        </Button>
        {props.submitButton}
      </div>

      <div class="text-red-500 text-sm mt-4">{form.response.message}</div>

    </Form>
  );
};
