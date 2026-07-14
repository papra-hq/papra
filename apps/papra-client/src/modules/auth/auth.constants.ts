export const ssoProviders = [
  {
    key: 'google',
    name: 'Google',
    icon: 'i-tabler-brand-google-filled',
  },
  {
    key: 'github',
    name: 'GitHub',
    icon: 'i-tabler-brand-github',
  },
] as const;

export const authPagesPaths = {
  emailVerification: '/email-verification',
  login: '/login',
  register: '/register',
  resetPassword: '/reset-password',
  requestPasswordReset: '/request-password-reset',
  emailValidationRequired: '/email-validation-required',
};
