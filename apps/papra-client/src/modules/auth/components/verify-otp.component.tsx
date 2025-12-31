import type { Component } from 'solid-js';
import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSlot,
  REGEXP_ONLY_DIGITS,
} from '@/modules/ui/components/otp-field';

export const TotpField: Component<{
  onComplete?: (args: { totpCode: string }) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}> = (props) => {
  return (
    <OTPField
      maxLength={6}
      onComplete={totpCode => props.onComplete?.({ totpCode })}
      value={props.value}
      onValueChange={props.onValueChange}
    >
      <OTPFieldInput pattern={REGEXP_ONLY_DIGITS} aria-label="Enter the 6-digit verification code" />
      <OTPFieldGroup>
        <OTPFieldSlot index={0} />
        <OTPFieldSlot index={1} />
        <OTPFieldSlot index={2} />
        <OTPFieldSlot index={3} />
        <OTPFieldSlot index={4} />
        <OTPFieldSlot index={5} />
      </OTPFieldGroup>
    </OTPField>
  );
};
