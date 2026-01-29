export type ServerConfig = {
  auth: {
    isEmailVerificationRequired: boolean;
    isPasswordResetEnabled: boolean;
    isRegistrationEnabled: boolean;
    showLegalLinksOnAuthPage: boolean;
    providers: {
      email: {
        isEnabled: boolean;
      };
      github: {
        isEnabled: boolean;
      };
      google: {
        isEnabled: boolean;
      };
      customs: {
        providerId: string;
        providerName: string;
      }[];
    };
  };
};
