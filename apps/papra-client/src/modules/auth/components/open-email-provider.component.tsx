import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { type Component, type ComponentProps, splitProps } from 'solid-js';

const providers = [
  {
    name: 'Gmail',
    url: 'https://mail.google.com/',
    search: 'https://mail.google.com/mail/u/%{email}/#search/from%3A%{sender}+in%3Aanywhere+newer_than%3A1h',
    hosts: ['gmail.com', 'googlemail.com'],
  },

  {
    name: 'Yahoo!',
    url: 'https://mail.yahoo.com/',
    search: 'https://mail.yahoo.com/d/search/keyword=from%253A%{sender}',
    hosts: [
      'yahoo.com',
      'yahoo.es',
      'yahoo.it',
      'yahoo.de',
      'yahoo.fr',
      'yahoo.in',
      'yahoo.ca',
      'yahoo.com.br',
      'yahoo.com.au',
      'yahoo.com.ar',
      'yahoo.com.mx',
      'yahoo.com.sg',
      'yahoo.co.id',
      'yahoo.co.in',
      'yahoo.co.jp',
      'yahoo.co.uk',
    ],
  },

  {
    name: 'Fastmail',
    url: 'https://www.fastmail.com/mail/',
    search: 'https://app.fastmail.com/mail/search:from%3A%{sender}+date%3Atoday/',
    hosts: [
      '123mail.org',
      '150mail.com',
      '150ml.com',
      '16mail.com',
      '2-mail.com',
      '4email.net',
      '50mail.com',
      'airpost.net',
      'allmail.net',
      'bestmail.us',
      'cluemail.com',
      'elitemail.org',
      'emailcorner.net',
      'emailengine.net',
      'emailengine.org',
      'emailgroups.net',
      'emailplus.org',
      'emailuser.net',
      'eml.cc',
      'f-m.fm',
      'fast-email.com',
      'fast-mail.org',
      'fastem.com',
      'fastemail.us',
      'fastemailer.com',
      'fastest.cc',
      'fastimap.com',
      'fastmail.cn',
      'fastmail.co.uk',
      'fastmail.com',
      'fastmail.com.au',
      'fastmail.de',
      'fastmail.es',
      'fastmail.fm',
      'fastmail.fr',
      'fastmail.im',
      'fastmail.in',
      'fastmail.jp',
      'fastmail.mx',
      'fastmail.net',
      'fastmail.nl',
      'fastmail.org',
      'fastmail.se',
      'fastmail.to',
      'fastmail.tw',
      'fastmail.uk',
      'fastmail.us',
      'fastmailbox.net',
      'fastmessaging.com',
      'fea.st',
      'fmail.co.uk',
      'fmailbox.com',
      'fmgirl.com',
      'fmguy.com',
      'ftml.net',
      'h-mail.us',
      'hailmail.net',
      'imap-mail.com',
      'imap.cc',
      'imapmail.org',
      'inoutbox.com',
      'internet-e-mail.com',
      'internet-mail.org',
      'internetemails.net',
      'internetmailing.net',
      'jetemail.net',
      'justemail.net',
      'letterboxes.org',
      'mail-central.com',
      'mail-page.com',
      'mailandftp.com',
      'mailas.com',
      'mailbolt.com',
      'mailc.net',
      'mailcan.com',
      'mailforce.net',
      'mailftp.com',
      'mailhaven.com',
      'mailingaddress.org',
      'mailite.com',
      'mailmight.com',
      'mailnew.com',
      'mailsent.net',
      'mailservice.ms',
      'mailup.net',
      'mailworks.org',
      'ml1.net',
      'mm.st',
      'myfastmail.com',
      'mymacmail.com',
      'nospammail.net',
      'ownmail.net',
      'petml.com',
      'postinbox.com',
      'postpro.net',
      'proinbox.com',
      'promessage.com',
      'realemail.net',
      'reallyfast.biz',
      'reallyfast.info',
      'rushpost.com',
      'sent.as',
      'sent.at',
      'sent.com',
      'speedpost.net',
      'speedymail.org',
      'ssl-mail.com',
      'swift-mail.com',
      'the-fastest.net',
      'the-quickest.com',
      'theinternetemail.com',
      'veryfast.biz',
      'veryspeedy.net',
      'warpmail.net',
      'xsmail.com',
      'yepmail.net',
      'your-mail.com',
    ],
  },
  {
    name: 'ProtonMail',
    url: 'https://mail.proton.me/',
    search: 'https://mail.proton.me/u/0/all-mail#from=%{sender}&begin=%{timestamp}',
    hosts: ['protonmail.com', 'protonmail.ch', 'pm.me', 'proton.me'],
  },
  {
    name: 'Apple iCloud',
    url: 'https://www.icloud.com/mail/',
    search: 'https://www.icloud.com/mail/',
    hosts: ['icloud.com', 'me.com', 'mac.com'],
  },
  {
    name: 'Mail.ru',
    url: 'https://mail.ru/',
    search: 'https://mail.ru/',
    hosts: ['mail.ru', 'bk.ru', 'inbox.ru', 'list.ru'],
  },
  {
    name: 'AOL',
    url: 'https://aol.com/',
    search: 'https://aol.com/',
    hosts: ['aol.com'],
  },
  {
    name: 'Zoho',
    url: 'https://mail.zoho.com/',
    search: 'https://mail.zoho.com/',
    hosts: ['zohomail.com', 'zoho.com'],
  },
  {
    name: 'BOL',
    url: 'https://email.bol.uol.com.br/',
    search: 'https://email.bol.uol.com.br/',
    hosts: ['bol.com.br'],
  },
  {
    name: 'UOL',
    url: 'https://email.uol.com.br/',
    search: 'https://email.uol.com.br/',
    hosts: ['uol.com.br'],
  },
  {
    name: 'Outlook',
    url: 'https://outlook.live.com/mail/',
    search: 'https://outlook.live.com/mail/?login_hint=%{email}',
    hosts: ['outlook.com', 'hotmail.com'],
  },
  {
    name: 'Hey',
    url: 'https://app.hey.com/',
    search: 'https://app.hey.com/',
    hosts: ['hey.com'],
  },
  {
    name: 'Yandex',
    url: 'https://mail.yandex.com/',
    search: 'https://mail.yandex.com/',
    hosts: ['yandex.com'],
  },
  {
    name: 'Tuta',
    url: 'https://app.tuta.com/',
    search: 'https://app.tuta.com/search/mail?query=%{sender}&end=%{timestamp}',
    hosts: ['tutanota.com', 'tutanota.de', 'tutamail.com', 'tuta.io', 'tuta.com', 'keemail.me'],
  },
  {
    name: 'GMX',
    url: 'https://navigator-bs.gmx.com/mail',
    search: 'https://navigator-bs.gmx.com/mail',
    hosts: ['gmx.com', 'gmx.us'],
  },
];

export function getEmailProvider({ email }: { email?: string }) {
  if (!email) {
    return { provider: undefined };
  }

  const [, host] = email.trim().split('@');

  const provider = providers.find(provider => provider.hosts.includes(host));

  return { provider };
}

export const OpenEmailProvider: Component<{ email?: string } & ComponentProps<typeof Button>> = (props) => {
  const [local, rest] = splitProps(props, ['email', 'class']);
  const { t } = useI18n();

  const { provider } = getEmailProvider({ email: local.email });

  if (!provider) {
    return null;
  }

  return (
    <Button as="a" href={provider.url} target="_blank" rel="noopener noreferrer" class={cn('w-full', local.class)} {...rest}>
      <div class="i-tabler-external-link mr-2 size-4" />
      {t('auth.email-provider.open', { provider: provider.name })}
    </Button>
  );
};
