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
