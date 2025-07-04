import { buildUrl } from '@corentinth/chisels';
import { triggerWebhook } from '@owlrelay/webhook';
import { INTAKE_EMAILS_INGEST_ROUTE } from '../modules/intake-emails/intake-emails.constants';
import { runScript } from './commons/run-script';

await runScript(
  { scriptName: 'simulate-intake-email' },
  async ({ config }) => {
    const { baseUrl } = config.server;
    const { webhookSecret } = config.intakeEmails;

    const webhookUrl = buildUrl({ baseUrl, path: INTAKE_EMAILS_INGEST_ROUTE });

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
