import type { Logger } from '@crowlog/logger';
import { ofetch } from 'ofetch';
import * as v from 'valibot';
import { createLogger } from '../../shared/logger/logger';
import { IN_MS } from '../../shared/units';

const verificationResponseSchema = v.object({
  valid: v.boolean(),
});

export async function verifyEligibilityForSelfhstPlanEntitlements({
  email,
  endpointUrl,
  token,
  logger = createLogger({ namespace: 'selfhst.plan-entitlements' }),
}: {
  email: string;
  endpointUrl?: string;
  token?: string;
  logger?: Logger;
}): Promise<{ isValid: boolean }> {
  if (!endpointUrl || !token) {
    logger.warn('Selfhst entitlement verification endpoint or token is not configured.');
    return { isValid: false };
  }

  const response = await ofetch.raw<unknown>(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
    ignoreResponseError: true,
    timeout: 5 * IN_MS.SECOND,
  });

  if (!response.ok) {
    logger.error(
      {
        status: response.status,
        statusText: response.statusText,
      },
      'Failed to verify eligibility for selfhst plan entitlements.',
    );
    return { isValid: false };
  }

  // The response body is already consumed and parsed by ofetch
  const responseData = response._data;

  const parsedResponse = v.safeParse(verificationResponseSchema, responseData);

  if (!parsedResponse.success) {
    logger.error(
      {
        responseData,
        errors: parsedResponse.issues,
      },
      'Failed to parse verification response for selfhst plan entitlements.',
    );
    return { isValid: false };
  }

  const { valid } = parsedResponse.output;

  return { isValid: valid };
}
