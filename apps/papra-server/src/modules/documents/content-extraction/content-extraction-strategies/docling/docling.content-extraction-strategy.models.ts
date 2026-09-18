export function buildDoclingRequestBody({
  file,
  options,
}: {
  file: File;
  options: Record<string, unknown>;
}): FormData {
  const body = new FormData();
  body.append('files', file);
  body.append('to_formats', 'md');
  body.append('image_export_mode', 'placeholder');

  for (const [key, value] of Object.entries(options)) {
    if (value === null) {
      continue;
    }

    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      body.append(key, typeof item === 'string' ? item : JSON.stringify(item));
    }
  }

  return body;
}

export function stripDoclingImagePlaceholders(text: string): string {
  return text.replaceAll('<!-- image -->', '').trim();
}
