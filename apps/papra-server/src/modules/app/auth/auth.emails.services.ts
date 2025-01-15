import type { User } from 'better-auth';

export async function sendVerificationEmail({ user, url, token }: { user: User; url: string; token: string }) {
  // eslint-disable-next-line no-console
  console.log('sendVerificationEmail', { user, url, token });
}

export async function sendPasswordResetEmail({ user, url, token }: { user: User; url: string; token: string }) {
  // eslint-disable-next-line no-console
  console.log('sendPasswordResetEmail', { user, url, token });
}
