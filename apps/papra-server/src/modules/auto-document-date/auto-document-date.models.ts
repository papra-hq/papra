const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_DOCUMENT_YEAR = 1900;

export function buildAutoDocumentDateInstructions() {
  return ['The date the document was issued, as YYYY-MM-DD, or null if it has none.'];
}

export type AutoDocumentDateResponse = {
  documentDate?: string | null;
};

export function getDocumentDateAction({
  autoDocumentDateResponse,
  now,
}: {
  autoDocumentDateResponse: AutoDocumentDateResponse;
  now: Date;
}): { documentDate: Date | undefined } {
  // The LLM response is not runtime-validated, so defend against non-string dates
  const rawDate =
    typeof autoDocumentDateResponse.documentDate === 'string'
      ? autoDocumentDateResponse.documentDate.trim()
      : '';

  const match = ISO_DATE_REGEX.exec(rawDate);

  if (!match) {
    return { documentDate: undefined };
  }

  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];

  // Noon UTC keeps the same calendar day when displayed in any timezone between UTC-11 and UTC+11
  const documentDate = new Date(Date.UTC(year, month - 1, day, 12));

  const isRealCalendarDate =
    documentDate.getUTCFullYear() === year &&
    documentDate.getUTCMonth() === month - 1 &&
    documentDate.getUTCDate() === day;

  // A document date more than a year in the future is most likely a misread due or expiry date
  const isPlausible =
    year >= MIN_DOCUMENT_YEAR && documentDate.getUTCFullYear() <= now.getUTCFullYear() + 1;

  if (!isRealCalendarDate || !isPlausible) {
    return { documentDate: undefined };
  }

  return { documentDate };
}
