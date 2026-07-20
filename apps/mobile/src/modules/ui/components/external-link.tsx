import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        event.preventDefault();
        await openBrowserAsync(href, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
      }}
    />
  );
}
