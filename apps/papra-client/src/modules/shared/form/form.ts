import type { z } from 'zod';
import { flatten, isEmpty, isEqual, map, mapValues } from 'lodash-es';
import { createSignal } from 'solid-js';
import { createHook } from '../hooks/hooks';

export type FormRule = {
  isValid: (value: string) => boolean;
  message: string;
};

export type FormField = {
  initialValue?: string;
  schema: z.ZodTypeAny;
};

export function createForm<Keys>({ fields }: { fields: Record<keyof Keys, FormField> }) {
  const [getForm, setForm] = createSignal<Record<keyof Keys, string>>(mapValues(fields, field => field.initialValue ?? ''));
  const [getFieldsErrors, setFieldsErrors] = createSignal<Record<keyof Keys, string[]>>(mapValues(fields, () => []));
  const [getIsSubmitting, setIsSubmitting] = createSignal(false);

  const setField = (key: keyof Keys, value: string) => {
    setForm(form => ({ ...form, [key]: value }));
    setFieldsErrors(fieldErrors => ({ ...fieldErrors, [key]: [] }));
  };

  const getField = (key: keyof Keys) => {
    return getForm()[key];
  };

  const validateField = (key: keyof Keys) => {
    const value = getForm()[key];
    const schema = fields[key].schema;
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.issues.map(issue => issue.message),
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  };

  const triggerFieldValidation = (key: keyof Keys) => {
    const { isValid, errors } = validateField(key);
    if (!isValid) {
      setFieldsErrors(fieldErrors => ({ ...fieldErrors, [key]: errors }));
      return false;
    }

    return true;
  };

  const triggerFieldsValidation = () => {
    return map(fields, (_, key) => triggerFieldValidation(key as keyof Keys));
  };

  const getFieldErrors = (key: keyof Keys) => {
    return getFieldsErrors()[key];
  };

  const getFieldError = (key: keyof Keys) => {
    return getFieldErrors(key)[0];
  };

  const submitHook = createHook<Record<keyof Keys, string>>();

  const submit = async (event?: Event) => {
    event?.preventDefault();
    const form = getForm();

    triggerFieldsValidation();
    const isValid = isEmpty(flatten(Object.values(getFieldsErrors())));

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    await submitHook.trigger(form);
    setIsSubmitting(false);
  };

  const getInputBindings = (key: keyof Keys) => {
    return {
      value: getField(key),
      onInput: (event: InputEvent) => {
        const value = (event.target as HTMLInputElement).value;
        setField(key, value);
      },
      onBlur: () => {
        triggerFieldValidation(key);
      },
    };
  };

  const getFieldStatus = (key: keyof Keys) => {
    const errors = getFieldErrors(key);

    if (isEmpty(errors)) {
      return 'valid';
    }

    return 'invalid';
  };

  const setFieldError = (key: keyof Keys, errors: string) => {
    setFieldsErrors(fieldErrors => ({ ...fieldErrors, [key]: [errors] }));
  };

  const getIsFormDirty = () => {
    return !isEqual(
      getForm(),
      mapValues(fields, field => field.initialValue ?? ''),
    );
  };

  const getFormHasErrors = () => {
    return !isEmpty(flatten(Object.values(getFieldsErrors())));
  };

  return {
    getForm,
    setForm,
    getField,
    setField,
    getFieldsErrors,
    getFieldError,
    validateField,
    triggerFieldValidation,
    triggerFieldsValidation,
    getFieldErrors,
    submit,
    onSubmit: submitHook.on,
    getIsSubmitting,
    getInputBindings,
    getFieldStatus,
    setFieldError,
    getIsFormDirty,
    getFormHasErrors,
  };
}
