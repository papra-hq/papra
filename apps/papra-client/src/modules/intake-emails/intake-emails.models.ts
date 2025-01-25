export function formatIntakeEmail({ domain, username }: { domain: string; username: string }) {
  return `${username}@${domain}`;
}
