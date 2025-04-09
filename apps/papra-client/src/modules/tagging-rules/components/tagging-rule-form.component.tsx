import type { TaggingRule, TaggingRuleForCreation } from '../tagging-rules.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { DocumentTagPicker } from '@/modules/tags/components/tag-picker.component';
import { CreateTagModal } from '@/modules/tags/pages/tags.page';
import { Button } from '@/modules/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { Separator } from '@/modules/ui/components/separator';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { insert, remove, setValue } from '@modular-forms/solid';
import { A } from '@solidjs/router';
import { type Component, For, Show } from 'solid-js';
import * as v from 'valibot';
import { TAGGING_RULE_FIELDS, TAGGING_RULE_FIELDS_LOCALIZATION_KEYS, TAGGING_RULE_OPERATORS, TAGGING_RULE_OPERATORS_LOCALIZATION_KEYS } from '../tagging-rules.constants';

export const TaggingRuleForm: Component<{
  onSubmit: (args: { taggingRule: TaggingRuleForCreation }) => Promise<void> | void;
  organizationId: string;
  taggingRule?: TaggingRule;
  submitButtonText?: string;
}> = (props) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();

  const { form, Form, Field, FieldArray } = createForm({
    onSubmit: async ({ name, conditions = [], tagIds, description }) => {
      if (conditions.length === 0) {
        const confirmed = await confirm({
          title: t('tagging-rules.form.conditions.no-conditions.title'),
          message: t('tagging-rules.form.conditions.no-conditions.description'),
          confirmButton: {
            variant: 'default',
            text: t('tagging-rules.form.conditions.no-conditions.confirm'),
          },
          cancelButton: {
            text: t('tagging-rules.form.conditions.no-conditions.cancel'),
          },
        });

        if (!confirmed) {
          return;
        }
      }

      props.onSubmit({ taggingRule: { name, conditions, tagIds, description } });
    },
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.minLength(1, t('tagging-rules.form.name.min-length')),
        v.maxLength(64, t('tagging-rules.form.name.max-length')),
      ),
      description: v.pipe(
        v.string(),
        v.maxLength(256, t('tagging-rules.form.description.max-length')),
      ),
      conditions: v.optional(
        v.array(v.object({
          field: v.picklist(Object.values(TAGGING_RULE_FIELDS)),
          operator: v.picklist(Object.values(TAGGING_RULE_OPERATORS)),
          value: v.pipe(
            v.string(),
            v.minLength(1, t('tagging-rules.form.conditions.value.min-length')),
          ),
        })),
      ),
      tagIds: v.pipe(
        v.array(v.string()),
        v.minLength(1, t('tagging-rules.form.tags.min-length')),
      ),
    }),
    initialValues: {
      conditions: props.taggingRule?.conditions ?? [],
      tagIds: props.taggingRule?.actions.map(action => action.tagId) ?? [],
      name: props.taggingRule?.name,
      description: props.taggingRule?.description,
    },
  });

  const getOperatorLabel = (operator: string) => {
    return t(TAGGING_RULE_OPERATORS_LOCALIZATION_KEYS[operator as keyof typeof TAGGING_RULE_OPERATORS_LOCALIZATION_KEYS]);
  };

  const getFieldLabel = (field: string) => {
    return t(TAGGING_RULE_FIELDS_LOCALIZATION_KEYS[field as keyof typeof TAGGING_RULE_FIELDS_LOCALIZATION_KEYS]);
  };

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1">
            <TextFieldLabel for="name">{t('tagging-rules.form.name.label')}</TextFieldLabel>
            <TextField
              type="text"
              id="name"
              placeholder={t('tagging-rules.form.name.placeholder')}
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
            <TextFieldLabel for="description">{t('tagging-rules.form.description.label')}</TextFieldLabel>
            <TextArea
              id="description"
              placeholder={t('tagging-rules.form.description.placeholder')}
              {...inputProps}
              value={field.value}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Separator class="my-6" />

      <p class="mb-1 font-medium">{t('tagging-rules.form.conditions.label')}</p>
      <p class="mb-2 text-sm text-muted-foreground">{t('tagging-rules.form.conditions.description')}</p>

      <FieldArray name="conditions">
        {fieldArray => (
          <div>
            <For each={fieldArray.items}>
              {(_, index) => (
                <div class="px-4 py-4 mb-1 flex gap-2 items-center bg-card border rounded-md">
                  <div>When</div>

                  <Field name={`conditions.${index()}.field`}>
                    {field => (
                      <Select
                        id="field"
                        defaultValue={field.value}
                        onChange={value => value && setValue(form, `conditions.${index()}.field`, value)}
                        options={Object.values(TAGGING_RULE_FIELDS)}
                        itemComponent={props => (
                          <SelectItem item={props.item}>{getFieldLabel(props.item.rawValue)}</SelectItem>
                        )}
                      >
                        <SelectTrigger class="w-[180px]">
                          <SelectValue<string>>{state => getFieldLabel(state.selectedOption())}</SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    )}
                  </Field>

                  <Field name={`conditions.${index()}.operator`}>
                    {field => (
                      <Select
                        id="operator"
                        defaultValue={field.value}
                        onChange={value => value && setValue(form, `conditions.${index()}.operator`, value)}
                        options={Object.values(TAGGING_RULE_OPERATORS)}
                        itemComponent={props => (
                          <SelectItem item={props.item}>{getOperatorLabel(props.item.rawValue)}</SelectItem>
                        )}
                      >
                        <SelectTrigger class="w-[140px]">
                          <SelectValue<string>>{state => getOperatorLabel(state.selectedOption())}</SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    )}
                  </Field>

                  <Field name={`conditions.${index()}.value`}>
                    {(field, inputProps) => (
                      <TextFieldRoot class="flex flex-col gap-1 flex-1">
                        <TextField
                          id="value"
                          {...inputProps}
                          value={field.value}
                          placeholder={t('tagging-rules.form.conditions.value.placeholder')}

                        />
                        {field.error && <div class="text-red-500 text-sm">{field.error}</div>}

                      </TextFieldRoot>
                    )}
                  </Field>

                  <Button variant="outline" size="icon" onClick={() => remove(form, 'conditions', { at: index() })}>
                    <div class="i-tabler-x size-4"></div>
                  </Button>
                </div>
              )}
            </For>
            {fieldArray.error && <div class="text-red-500 text-sm">{fieldArray.error}</div>}
          </div>
        )}
      </FieldArray>

      <Button
        variant="outline"
        onClick={() => insert(form, 'conditions', { value: { field: 'name', operator: 'contains', value: '' } })}
        class="gap-2 mt-2"
      >
        <div class="i-tabler-plus size-4"></div>
        {t('tagging-rules.form.conditions.add-condition')}
      </Button>

      <Separator class="my-6" />

      <p class="mb-1 font-medium">{t('tagging-rules.form.tags.label')}</p>
      <p class="mb-2 text-sm text-muted-foreground">{t('tagging-rules.form.tags.description')}</p>

      <Field name="tagIds" type="string[]">
        {field => (
          <>
            <div class="flex gap-2 sm:items-center sm:flex-row flex-col">
              <div class="flex-1">

                <DocumentTagPicker
                  organizationId={props.organizationId}
                  tagIds={field.value ?? []}
                  onTagsChange={({ tags }) => setValue(form, 'tagIds', tags.map(tag => tag.id))}
                />
              </div>

              <CreateTagModal organizationId={props.organizationId}>
                {props => (
                  <Button variant="outline" {...props}>
                    <div class="i-tabler-plus size-4 mr-2"></div>
                    {t('tagging-rules.form.tags.add-tag')}
                  </Button>
                )}
              </CreateTagModal>
            </div>
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </>
        )}
      </Field>

      <div class="flex justify-end mt-6 gap-2">
        <Show when={props.taggingRule}>
          <Button variant="outline" as={A} href={`/organizations/${props.organizationId}/tagging-rules`}>
            {t('tagging-rules.update.cancel')}
          </Button>
        </Show>

        <Button type="submit">{props.submitButtonText ?? t('tagging-rules.form.submit')}</Button>
      </div>
    </Form>
  );
};
