export function buildEmailAddress({
  username,
  domain,
  plusPart,
}: {
  username: string;
  domain: string;
  plusPart?: string;
}) {
  return `${username}${plusPart ? `+${plusPart}` : ''}@${domain}`;
}

export function parseEmailAddress({ email }: { email: string }) {
  const [fullUsername, domain] = email.split('@');
  const [username, ...plusParts] = fullUsername.split('+');
  const plusPart = plusParts.length > 0 ? plusParts.join('+') : undefined;

  return { username, domain, plusPart };
}

export function getIsIntakeEmailWebhookSecretValid({
  secret,
  authorizationHeader,
}: {
  secret: string;
  authorizationHeader: string | undefined;
}) {
  return authorizationHeader === `Bearer ${secret}`;
}

export function getEmailUsername({ email }: { email: string | undefined }) {
  if (!email) {
    return { username: undefined };
  }

  return {
    username: email.split('@')[0],
  };
}

export function getIsFromAllowedOrigin({
  origin,
  allowedOrigins,
}: {
  origin: string;
  allowedOrigins: string[];
}) {
  return allowedOrigins
    .map(allowedOrigin => allowedOrigin.toLowerCase())
    .includes(origin.toLowerCase());
}
