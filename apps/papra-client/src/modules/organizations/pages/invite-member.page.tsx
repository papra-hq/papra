import type { Component } from 'solid-js';
import { setValue } from '@modular-forms/solid';
import { useNavigate, useParams } from '@solidjs/router';
import { useMutation } from '@tanstack/solid-query';
import { onMount, Show } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import {
  TextField,
  TextFieldLabel,
  TextFieldRoot,
} from '@/modules/ui/components/textfield';
import { useCurrentUserRole } from '../organizations.composables';
import { ORGANIZATION_ROLES } from '../organizations.constants';
import { inviteOrganizationMember } from '../organizations.services';

type InvitableRole = 'member' | 'admin';

export const InviteMemberPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const { getIsAtLeastAdmin } = useCurrentUserRole({ organizationId: params.organizationId });
  const navigate = useNavigate();

  onMount(() => {
    if (!getIsAtLeastAdmin()) {
      navigate(`/organizations/${params.organizationId}`);
    }
  });

  const tRole = (role: InvitableRole) => t(`organizations.members.roles.${role}`);

  const inviteMemberMutation = useMutation(() => ({
    mutationFn: ({ email, role }: { email: string; role: InvitableRole }) =>
      inviteOrganizationMember({
        organizationId: params.organizationId,
        email,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', params.organizationId, 'invitations'],
      });
      createToast({
        message: t('organizations.invite-member.success.message'),
        description: t('organizations.invite-member.success.description'),
        type: 'success',
      });
      navigate(`/organizations/${params.organizationId}/members`);
    },
    onError: (error) => {
      createToast({
        message: t('organizations.invite-member.error.message'),
        description: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  const { Form, Field, form } = createForm({
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.email(t('organizations.invite-member.form.email.required')),
        v.toLowerCase(),
      ),
      role: v.picklist([ORGANIZATION_ROLES.MEMBER, ORGANIZATION_ROLES.ADMIN]),
    }),
    initialValues: {
      role: ORGANIZATION_ROLES.MEMBER,
    },
    onSubmit: async ({ email, role }) => {
      inviteMemberMutation.mutate({ email, role });
    },
  });

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold">
          {t('organizations.invite-member.title')}
        </h1>
        <p class="text-sm text-muted-foreground">
          {t('organizations.invite-member.description')}
        </p>
      </div>

      <div class="mt-10 max-w-xs mx-auto">
        <Form>
          <Field name="email">
            {(field, inputProps) => (
              <TextFieldRoot class="flex flex-col mb-6">
                <TextFieldLabel for="email">
                  {t('organizations.invite-member.form.email.label')}
                </TextFieldLabel>
                <TextField
                  type="email"
                  id="email"
                  placeholder={t(
                    'organizations.invite-member.form.email.placeholder',
                  )}
                  {...inputProps}
                />
                {field.error && (
                  <div class="text-red-500 text-sm">{field.error}</div>
                )}
              </TextFieldRoot>
            )}
          </Field>

          <Field name="role">
            {field => (
              <div>
                <label for="role" class="text-sm font-medium mb-1 block">
                  {t('organizations.invite-member.form.role.label')}
                </label>
                <Select
                  id="role"
                  options={[
                    ORGANIZATION_ROLES.MEMBER,
                    ORGANIZATION_ROLES.ADMIN,
                  ]}
                  itemComponent={props => (
                    <SelectItem item={props.item}>
                      {tRole(props.item.rawValue)}
                    </SelectItem>
                  )}
                  value={field.value}
                  onChange={value =>
                    setValue(form, 'role', value as InvitableRole)}
                >
                  <SelectTrigger>
                    <SelectValue<string>>
                      {state =>
                        tRole(state.selectedOption() as InvitableRole)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            )}
          </Field>

          <Button type="submit" class="w-full mt-6" isLoading={inviteMemberMutation.isPending}>
            {t('organizations.invite-member.form.submit')}
            <div class="i-tabler-send size-4 ml-1" />
          </Button>

          <Show when={inviteMemberMutation.isError}>
            <div class="text-red-500 text-sm">
              {getErrorMessage({ error: inviteMemberMutation.error })}
            </div>
          </Show>
        </Form>
      </div>
    </div>
  );
};
