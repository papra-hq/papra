import type { IntakeEmail } from './intake-emails.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchIntakeEmails({ organizationId }: { organizationId: string }) {
  const { intakeEmails } = await apiClient<{ intakeEmails: IntakeEmail[] }>({
    path: `/api/organizations/${organizationId}/intake-emails`,
    method: 'GET',
  });

  return {
    intakeEmails: intakeEmails.map(coerceDates),
  };
}

export async function createIntakeEmail({ organizationId }: { organizationId: string }) {
  const { intakeEmail } = await apiClient<{ intakeEmail: IntakeEmail }>({
    path: `/api/organizations/${organizationId}/intake-emails`,
    method: 'POST',
  });

  return {
    intakeEmail: coerceDates(intakeEmail),
  };
}

export async function deleteIntakeEmail({ organizationId, intakeEmailId }: { organizationId: string; intakeEmailId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/intake-emails/${intakeEmailId}`,
    method: 'DELETE',
  });
}

export async function updateIntakeEmail({
  organizationId,
  intakeEmailId,
  isEnabled,
  allowedOrigins,
}: {
  organizationId: string;
  intakeEmailId: string;
  isEnabled?: boolean;
  allowedOrigins?: string[];
}) {
  const { intakeEmail } = await apiClient<{ intakeEmail: IntakeEmail }>({
    path: `/api/organizations/${organizationId}/intake-emails/${intakeEmailId}`,
    method: 'PUT',
    body: {
      isEnabled,
      allowedOrigins,
    },
  });

  return {
    intakeEmail: coerceDates(intakeEmail),
  };
}
