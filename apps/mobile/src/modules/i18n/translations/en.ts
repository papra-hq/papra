export const en = {
  papra: 'Papra',
  serverSelection: {
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
