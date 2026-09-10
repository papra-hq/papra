import type { DocumentType } from './document-generation.models';
import { createSignal, For, Show } from 'solid-js';
import { useDocumentUpload } from '@/modules/documents/components/document-import-status.component';
import { Button } from '@/modules/ui/components/button';
import {
  TextField,
  TextFieldDescription,
  TextFieldLabel,
  TextFieldRoot,
} from '@/modules/ui/components/textfield';
import { useDevtools } from '../../devtools.context';
import {
  documentTypes,
  generateDocuments,
  isValidDocumentAmount,
  MAX_GENERATED_DOCUMENTS,
} from './document-generation.models';

export function DocumentGenerationDevtool(props: { organizationId: string }) {
  // Capture the scoped upload API here: tab content is rendered in the global devtools panel.
  const { uploadDocuments } = useDocumentUpload();
  const { registerTool, closeDevtools } = useDevtools();

  registerTool({
    id: 'document-generation',
    title: 'Documents',
    icon: 'i-tabler-file-plus',
    component: () => (
      <DocumentGenerationTool
        organizationId={props.organizationId}
        uploadDocuments={uploadDocuments}
        closeDevtools={closeDevtools}
      />
    ),
  });

  return null;
}

function DocumentGenerationTool(props: {
  organizationId: string;
  uploadDocuments: (args: { files: File[] }) => Promise<void>;
  closeDevtools: () => void;
}) {
  const [getType, setType] = createSignal<DocumentType>('txt');
  const [getAmount, setAmount] = createSignal('1');
  const [getIsUploading, setIsUploading] = createSignal(false);
  const [getError, setError] = createSignal<string>();
  const [getStatus, setStatus] = createSignal<string>();
  const getIsValid = () => isValidDocumentAmount(Number(getAmount()));

  const generateAndUpload = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!getIsValid() || getIsUploading()) {
      return;
    }

    setIsUploading(true);
    setError(undefined);
    setStatus(undefined);

    try {
      const files = generateDocuments({ type: getType(), amount: Number(getAmount()) });
      const upload = props.uploadDocuments({ files });
      // Reveal the existing import panel, which reports individual successes and failures.
      props.closeDevtools();
      await upload;
      setStatus('Batch finished. Check the import panel for upload results.');
    } catch {
      setError('Could not finish this batch. Check the import panel for details before retrying.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={generateAndUpload} class="space-y-4">
      <div>
        <h3 class="text-base font-semibold">Generate documents</h3>
        <p class="mt-1 text-muted-foreground">
          Create random, searchable sample documents and upload them.
        </p>
        <p class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="i-tabler-building size-3.5 shrink-0" aria-hidden="true" />
          <span class="break-all">
            Organization: <span class="font-mono">{props.organizationId}</span>
          </span>
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-1">
          <span class="text-sm font-medium">Document type</span>
          <select
            class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:(outline-none ring-1.5 ring-ring) disabled:opacity-50"
            value={getType()}
            onChange={(event) => setType(event.currentTarget.value as DocumentType)}
            disabled={getIsUploading()}
          >
            <For each={documentTypes}>
              {(type) => <option value={type.value}>{type.label}</option>}
            </For>
          </select>
        </label>

        <TextFieldRoot value={getAmount()} onChange={setAmount} disabled={getIsUploading()}>
          <TextFieldLabel>Amount</TextFieldLabel>
          <TextField type="number" min={1} max={MAX_GENERATED_DOCUMENTS} step={1} required />
          <TextFieldDescription class="text-xs">
            1–{MAX_GENERATED_DOCUMENTS} documents per batch
          </TextFieldDescription>
        </TextFieldRoot>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={getIsUploading()} disabled={!getIsValid()} class="gap-2">
          <span class="i-tabler-upload size-4" aria-hidden="true" />
          {getIsUploading() ? 'Uploading…' : 'Generate & upload'}
        </Button>
      </div>
      <Show when={getError()}>
        <p role="alert" class="text-xs text-destructive">
          {getError()}
        </p>
      </Show>
      <Show when={getStatus()}>
        <p role="status" class="text-xs text-muted-foreground">
          {getStatus()}
        </p>
      </Show>
    </form>
  );
}
