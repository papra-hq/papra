import type { FieldArrayProps, FieldProps, FormProps } from '@formisch/solid';
import type * as v from 'valibot';
import { createForm as createFormishForm, Field, FieldArray, Form } from '@formisch/solid';
import { createHook } from '../hooks/hooks';

// Extracted from the library to avoid type errors
type FormishDeepPartial<TValue> = TValue extends readonly unknown[] ? number extends TValue['length'] ? TValue : { [Key in keyof TValue]?: FormishDeepPartial<TValue[Key]> | undefined } : TValue extends Record<PropertyKey, unknown> ? { [Key in keyof TValue]?: FormishDeepPartial<TValue[Key]> | undefined } : TValue | undefined;

export function createForm<Schema extends v.ObjectSchema<any, any>>({
  schema,
  initialValues,
  onSubmit,
}: {
  schema: Schema;
  initialValues?: FormishDeepPartial<v.InferInput<Schema>>;
  onSubmit?: (values: v.InferInput<Schema>) => Promise<void>;
}) {
  const submitHook = createHook<v.InferInput<Schema>>();

  if (onSubmit) {
    submitHook.on(onSubmit);
  }

  const form = createFormishForm({
    schema,
    initialInput: initialValues,
  });

  return {
    form,
    Form: (props: Omit<FormProps<Schema>, 'of' | 'onSubmit'>) => Form({ of: form, ...props, onSubmit: async (args) => {
      await submitHook.trigger(args);
    } }),
    Field: (props: Omit<FieldProps<Schema>, 'of'>) => Field({ of: form, ...props }),
    FieldArray: (props: Omit<FieldArrayProps<Schema>, 'of'>) => FieldArray({ of: form, ...props }),
    submit: submitHook.trigger,
  };
}
