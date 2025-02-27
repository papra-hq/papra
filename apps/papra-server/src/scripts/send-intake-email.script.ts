import { buildUrl } from '@corentinth/chisels';
import { triggerWebhook } from '@owlrelay/webhook';
import { runScript } from './commons/run-script';

runScript(
  { scriptName: 'simulate-intake-email' },
  async ({ config }) => {
    const { baseUrl } = config.server;
    const { webhookSecret } = config.intakeEmails;

    const webhookUrl = buildUrl({ baseUrl, path: '/api/intake-emails/ingest' });

    await triggerWebhook({
      webhookUrl,
      webhookSecret,
      email: {
        from: { address: 'test@example.com', name: 'Test' },
        to: [{ address: 'plucky-hyena-524@callback.email', name: 'Test' }],
        subject: 'Test',
        text: 'Hello, world!',
        html: '<p>Hello, world!</p>',
        attachments: [
          {
            filename: 'test.txt',
            content: new TextEncoder().encode('Hello, world!').buffer as ArrayBuffer,
            mimeType: 'text/plain',
          },
        ],
      },
    });
  },
);
