export { timeAgo };

function timeAgo({ date: maybeRawDate, now = new Date() }: { date: Date | string; now?: Date }): string {
  const date = typeof maybeRawDate === 'string' ? new Date(maybeRawDate) : maybeRawDate;

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffSeconds < 5) {
    return 'just now';
  }

  if (diffSeconds < 10) {
    return 'a few seconds ago';
  }

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  }

  if (diffMinutes === 1) {
    return 'a minute ago';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  if (diffHours === 1) {
    return 'an hour ago';
  }

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return 'a day ago';
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  if (diffMonths === 1) {
    return 'a month ago';
  }

  if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  }

  if (diffYears === 1) {
    return 'a year ago';
  }

  return `${diffYears} years ago`;
}
