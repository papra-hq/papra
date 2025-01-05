import type { FormProps, PartialValues } from '@modular-forms/solid';
import type * as v from 'valibot';
import { createForm as createModularForm, valiForm } from '@modular-forms/solid';
import { createHook } from '../hooks/hooks';

export function createForm<Schema extends v.ObjectSchema<any, any>>({
  schema,
  initialValues,
  onSubmit,
}: {
  schema: Schema;
  initialValues?: PartialValues<v.InferInput<Schema>>;
  onSubmit?: (values: v.InferInput<Schema>) => Promise<void>;
}) {
  const submitHook = createHook<v.InferInput<Schema>>();

  if (onSubmit) {
    submitHook.on(onSubmit);
  }

  const [form, { Form, Field }] = createModularForm<v.InferInput<Schema>>({
    validate: valiForm(schema),
    initialValues,
  });

  return {
    form,
    Form: (props: Omit<FormProps<v.InferInput<Schema>, undefined>, 'of'>) => Form({ ...props, onSubmit: submitHook.trigger }),
    Field,
    onSubmit: submitHook.on,
    submit: submitHook.trigger,
  };
}
