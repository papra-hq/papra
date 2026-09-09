import type { AppMessages, PartialMessages } from '../i18n.types';

export const fr = {
  common: {
    close: 'Fermer',
    cancel: 'Annuler',
    ok: 'OK',
  },
  appSettings: {
    title: 'Paramètres de l’application',
    language: {
      title: 'Langue',
      description: 'Choisissez la langue utilisée par l’application sur cet appareil.',
      useDeviceLanguage: 'Utiliser la langue de l’appareil',
    },
    errors: {
      saveFailed: {
        title: 'Impossible d’enregistrer la langue',
        message: 'Votre langue n’a pas été modifiée. Veuillez réessayer.',
      },
    },
  },
  settings: {
    title: 'Paramètres',
    account: 'Compte',
    app: 'Application',
    name: 'Nom',
    email: 'Adresse e-mail',
    emailVerified: 'Adresse e-mail vérifiée',
    yes: 'Oui',
    no: 'Non',
    signOut: {
      title: 'Se déconnecter',
      confirmation: 'Voulez-vous vraiment vous déconnecter ?',
    },
  },
  serverSelection: {
    selectServer: 'Choisir un serveur',
    title: 'Organisez, sécurisez &\narchivez vos documents.',
    subtitle: 'Tout d’abord, choisissez où vos documents se trouvent.',
  },
} satisfies PartialMessages<AppMessages>;
