import type { CustomHeaderIssueCode } from '@/modules/config/config.models';

export const en = {
  papra: 'Papra',
  common: {
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
  },
  appSettings: {
    title: 'App settings',
    language: {
      title: 'Language',
      description: 'Choose the language used by the app on this device.',
      useDeviceLanguage: 'Use device language',
    },
    errors: {
      saveFailed: {
        title: 'Could not save language',
        message: 'Your language has not been changed. Please try again.',
      },
    },
  },
  settings: {
    title: 'Settings',
    account: 'Account',
    app: 'App',
    name: 'Name',
    email: 'Email',
    emailVerified: 'Email verified',
    yes: 'Yes',
    no: 'No',
    signOut: {
      title: 'Sign out',
      confirmation: 'Are you sure you want to sign out?',
    },
  },
  serverSelection: {
    selectServer: 'Select server',
    title: 'Organize, secure &\narchive your documents.',
    subtitle: 'First, choose where your documents live.',
    continue: 'Continue',
    managedCloud: {
      title: 'Managed Cloud',
      description: 'Use the official Papra cloud service',
    },
    selfHosted: {
      title: 'Self-Hosted',
      description: 'Connect to your own Papra server',
    },
    serverUrl: {
      label: 'Server URL',
      placeholder: 'https://your-server.com',
    },
    customHeaders: {
      label: ({ count }: { count: number }) =>
        count > 0 ? `Custom headers (${count})` : 'Custom headers',
      namePlaceholder: 'Name',
      valuePlaceholder: 'Value',
      deleteLabel: ({ name }: { name: string }) => `Delete header ${name}`,
      add: 'Add header',
      parsingErrors: {
        'empty-name': () => `Header names cannot be empty.`,
        'invalid-name': ({ headerName }) => `The header name "${headerName}" is invalid.`,
        'forbidden-name': ({ headerName }) =>
          `The header name "${headerName}" is managed by the app or by the protocol and cannot be set manually.`,
        'invalid-value': ({ headerName }) =>
          `The value for the header "${headerName}" is invalid. It cannot contain line breaks.`,
      } satisfies Record<CustomHeaderIssueCode, (arg: { headerName: string }) => string>,
    },
    errors: {
      invalidUrl: {
        title: 'Invalid URL',
        message:
          'Please enter a valid server URL. Make sure to include the protocol (http:// or https://).',
      },
      invalidCustomHeader: {
        title: 'Invalid Custom Header',
      },
      connectionFailed: {
        title: 'Connection Failed',
        message: 'Could not reach the server.',
      },
      saveFailed: {
        title: 'Something Went Wrong',
        message: 'Could not save the server configuration. Please try again.',
      },
    },
  },
};
