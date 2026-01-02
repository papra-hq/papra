import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';
import { renderSVG } from 'uqr';

export const QrCode: Component<{ value: string } & ComponentProps<'div'>> = (props) => {
  const [local, rest] = splitProps(props, ['value']);

  return (
    // eslint-disable-next-line solid/no-innerhtml
    <div innerHTML={renderSVG(local.value)} {...rest} />
  );
};
