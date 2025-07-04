import { isNil } from '../shared/utils';

export function coerceStripeTimestampToDate(timestamp: number) {
  return new Date(timestamp * 1000);
}

export function isSignatureHeaderFormatValid(signature: string | undefined): signature is string {
  if (isNil(signature)) {
    return false;
  }

  return typeof signature === 'string' && signature.length > 0;
}
