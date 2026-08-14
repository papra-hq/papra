// @vitest-environment happy-dom

import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DocumentBlobPreview } from './document-preview.component';

vi.mock('@/modules/i18n/i18n.provider', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('./pdf-viewer/simple-pdf-viewer.component', () => ({
  SimplePdfViewer: (props: { url: string }) => props.url,
}));

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.restoreAllMocks();
});

describe('DocumentBlobPreview', () => {
  test('refreshes text content when navigation supplies a new document blob', async () => {
    const container = document.createElement('div');
    const [blob, setBlob] = createSignal(new Blob(['first document'], { type: 'text/plain' }));

    dispose = render(() => <DocumentBlobPreview blob={blob()} mimeType="text/plain" />, container);

    await vi.waitFor(() => expect(container.textContent).to.contain('first document'));

    setBlob(new Blob(['linked document'], { type: 'text/plain' }));

    await vi.waitFor(() => expect(container.textContent).to.contain('linked document'));
    expect(container.textContent).not.to.contain('first document');
  });

  test('recreates the PDF viewer when navigation supplies a new document blob', async () => {
    const container = document.createElement('div');
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:first-document')
      .mockReturnValueOnce('blob:linked-document');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const [blob, setBlob] = createSignal(new Blob(['first'], { type: 'application/pdf' }));

    dispose = render(
      () => <DocumentBlobPreview blob={blob()} mimeType="application/pdf" />,
      container,
    );

    await vi.waitFor(() => expect(container.textContent).to.contain('blob:first-document'));

    setBlob(new Blob(['linked'], { type: 'application/pdf' }));

    await vi.waitFor(() => expect(container.textContent).to.contain('blob:linked-document'));
    expect(container.textContent).not.to.contain('blob:first-document');
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
  });
});
