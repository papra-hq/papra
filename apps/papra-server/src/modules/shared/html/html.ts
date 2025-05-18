import sanitizeHtml from 'sanitize-html';

export function sanitize(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}
