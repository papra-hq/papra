import type { AppMessages } from '../i18n.types';

export const de = {
  papra: 'Papra',
  common: {
    close: 'Schließen',
    cancel: 'Abbrechen',
    ok: 'OK',
    anErrorOccurred: 'Ein Fehler ist aufgetreten',
    email: 'E-Mail-Adresse',
    name: 'Name',
    error: 'Fehler',
    delete: 'Löschen',
    share: 'Teilen',
    invalidName: 'Ungültiger Name',
    save: 'Speichern',
    retry: 'Erneut versuchen',
    open: 'Öffnen',
    goBack: 'Zurück',
    done: 'Fertig',
    confirm: 'Bestätigen',
    unknownError: 'unbekannter Fehler',
  },
  navigation: {
    notFoundTitle: 'Hoppla!',
    notFoundMessage: 'Diese Seite existiert nicht.',
    goHome: 'Zur Startseite',
    modalMessage: 'Dies ist ein modales Fenster',
    modalTitle: 'Modales Fenster',
  },
  documents: {
    title: 'Dokumente',
    search: {
      title: 'Suche',
      placeholder: 'Dokumente suchen',
      clear: 'Suchtext löschen',
      hint: 'Durchsuchen Sie Ihre Dokumente',
      hintDescription: 'Finden Sie Dokumente anhand ihres Namens oder Inhalts',
      empty: 'Keine Dokumente gefunden',
      noResults: ({ query }: { query: string }) => `Keine Ergebnisse für „${query}“`,
    },
    import: {
      title: 'Importieren',
      noOrganization: 'Keine Organisation ausgewählt',
      uploadSuccessful: 'Erfolgreich hochgeladen',
      selectBeforeImport:
        'Bitte wählen Sie eine Organisation aus, bevor Sie Dokumente importieren.',
      pickFailed: 'Dokument konnte nicht ausgewählt werden',
      drawerTitle: 'Dokument importieren',
      fromFiles: 'Aus Dateien importieren',
      fromFilesDescription: 'Wählen Sie ein Dokument auf Ihrem Gerät aus',
      scan: 'Dokument scannen',
      scanDescription: 'Scannen Sie ein Dokument mit der Kamera',
      uploadFailed: 'Hochladen fehlgeschlagen',
      uploaded: ({ name }: { name: string }) => `Erfolgreich hochgeladen: ${name}`,
    },
    sharingFailed: 'Teilen fehlgeschlagen',
    sharingUnavailable:
      'Die Teilen-Funktion ist auf diesem Gerät nicht verfügbar. Bitte teilen Sie das Dokument manuell.',
    downloadFailed: 'Die Dokumentdatei konnte nicht heruntergeladen werden',
    renameFailed: 'Dokument konnte nicht umbenannt werden',
    deleteTitle: 'Dokument löschen',
    deleteFailed: 'Dokument konnte nicht gelöscht werden',
    view: 'Dokument anzeigen',
    rename: 'Umbenennen',
    nameRequired: 'Bitte geben Sie einen Dokumentnamen ein',
    nameTitle: 'Dokumentname',
    namePlaceholder: 'Dokumentnamen eingeben',
    missingIds: 'Organisations-ID und Dokument-ID sind erforderlich',
    loading: 'Dokument wird geladen…',
    loadFailed: 'Dokument konnte nicht geladen werden',
    fallbackName: 'Dokument',
    downloaded: 'Heruntergeladen',
    tags: 'Tags',
    notes: 'Notizen',
    size: 'Größe',
    type: 'Typ',
    date: 'Datum',
    id: 'ID',
    properties: 'Eigenschaften',
    preview: {
      pdfFailed: 'PDF konnte nicht geladen werden',
      unavailable: 'Keine Vorschau verfügbar',
      unsupported: 'Für diesen Dateityp kann in der App keine Vorschau angezeigt werden',
    },
    userSettings: 'Benutzereinstellungen',
    emptyTitle: 'Noch keine Dokumente',
    emptySubtitle: 'Laden Sie Ihr erstes Dokument hoch, um loszulegen',
    share: {
      selectOrganization:
        'Bitte wählen Sie eine Organisation aus, in der das Dokument gespeichert werden soll.',
      destinationFallback: 'Ihrer Organisation',
      savedTitle: 'In Papra gespeichert',
      saved: ({ name, destination }: { name: string; destination: string }) =>
        `${name} wurde in ${destination} gespeichert.`,
      savedMultiple: ({ count, destination }: { count: number; destination: string }) =>
        count === 1
          ? `${count} Dokument wurde in ${destination} gespeichert.`
          : `${count} Dokumente wurden in ${destination} gespeichert.`,
      save: 'In Papra speichern',
      saveMultiple: ({ count }: { count: number }) =>
        count === 1 ? `${count} Dokument speichern` : `${count} Dokumente speichern`,
      empty: 'Keine geteilte Datei zum Speichern vorhanden.',
      uploading: 'Wird hochgeladen…',
      uploadError: ({ name, error }: { name: string; error: string }) =>
        `${name} konnte nicht hochgeladen werden: ${error}`,
      uploadProgress: ({ current, total }: { current: number; total: number }) =>
        `Datei ${current} von ${total} wird hochgeladen…`,
    },
    nameLabel: 'Dokumentname',
    scan: {
      errorTitle: 'Scanfehler',
      failed: 'Dokument konnte nicht gescannt werden',
      selectBeforeUpload: 'Bitte wählen Sie vor dem Hochladen eine Organisation aus.',
      nameRequiredTitle: 'Name erforderlich',
      nameRequired: 'Bitte geben Sie einen Dokumentnamen ein.',
      uploadFailed: 'Dokumente konnten nicht hochgeladen werden. Bitte versuchen Sie es erneut.',
      uploaded: ({ count }: { count: number }) =>
        count === 1
          ? `${count} Dokument wurde erfolgreich hochgeladen.`
          : `${count} Dokumente wurden erfolgreich hochgeladen.`,
      pageCount: ({ count }: { count: number }) =>
        count === 1 ? `${count} Seite` : `${count} Seiten`,
      opening: 'Scanner wird geöffnet…',
      empty: 'Keine Bilder zum Überprüfen vorhanden',
      title: 'Scan überprüfen',
      uploadTo: 'Hochladen in',
      processing: 'Wird verarbeitet und hochgeladen…',
      outputFormat: 'Ausgabeformat',
      formats: {
        pdf: 'PDF',
        pdfDescription: 'Scan als PDF speichern',
        mergedDescription: 'Alle Scans in einer mehrseitigen PDF-Datei zusammenfassen',
        pdfs: 'PDFs',
        pdfsDescription: 'Jeden Scan als separate PDF-Datei speichern',
        image: 'Bild',
        imageDescription: 'Scan als Bild speichern',
        images: 'Bilder',
        imagesDescription: 'Jeden Scan als separates Bild speichern',
      },
    },
    deleteConfirmation: ({ name }: { name: string }) =>
      `Möchten Sie „${name}“ wirklich löschen? Das Dokument wird in den Papierkorb verschoben.`,
    saved: ({ name }: { name: string }) => `${name} wurde gespeichert`,
  },
  auth: {
    password: 'Passwort',
    emailPlaceholder: 'name@beispiel.de',
    validation: {
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      password: 'Das Passwort muss mindestens 8 Zeichen lang sein',
      name: 'Ein Name ist erforderlich',
    },
    login: {
      failed: 'Anmeldung fehlgeschlagen',
      socialFailed: 'Anmeldung fehlgeschlagen',
      title: 'Willkommen zurück',
      subtitle: 'Melden Sie sich mit Ihrem Konto an',
      passwordPlaceholder: 'Passwort eingeben',
      submit: 'Anmelden',
      or: 'ODER',
      signupLink: 'Noch kein Konto? Jetzt registrieren',
      continueWith: ({ name }: { name: string }) => `Mit ${name} fortfahren`,
    },
    twoFactor: {
      title: 'Zwei-Faktor-Authentifizierung',
      subtitle: 'Bestätigen Sie Ihre Identität, um fortzufahren',
      failed: 'Verifizierung fehlgeschlagen',
      backupCode: 'Backup-Code',
      verificationCode: 'Verifizierungscode',
      backupDescription: 'Geben Sie einen Ihrer Backup-Codes ein',
      verificationDescription:
        'Geben Sie den 6-stelligen Code aus Ihrer Authentifizierungs-App ein',
      backupPlaceholder: 'Backup-Code eingeben',
      verificationPlaceholder: '000000',
      trustDevice: 'Diesem Gerät vertrauen',
      verify: 'Verifizieren',
      useAuthenticator: 'Code aus der Authentifizierungs-App verwenden',
      useBackupCode: 'Backup-Code verwenden',
      backToLogin: 'Zurück zur Anmeldung',
    },
    signup: {
      checkEmail: 'Prüfen Sie Ihr E-Mail-Postfach',
      verificationSent:
        'Wir haben Ihnen einen Bestätigungslink per E-Mail gesendet. Bitte öffnen Sie den Link, um Ihr Konto zu bestätigen.',
      failed: 'Registrierung fehlgeschlagen',
      disabled: 'Die Registrierung ist derzeit deaktiviert',
      backToLogin: 'Zurück zur Anmeldung',
      title: 'Konto erstellen',
      subtitle: 'Registrieren Sie sich, um loszulegen',
      namePlaceholder: 'Ihr Name',
      passwordPlaceholder: 'Mindestens 8 Zeichen',
      submit: 'Registrieren',
      loginLink: 'Bereits ein Konto? Jetzt anmelden',
    },
  },
  organizations: {
    label: 'Organisation',
    selectPlaceholder: 'Organisation auswählen',
    selectTitle: 'Organisation auswählen',
    createNew: '+ Neue Organisation erstellen',
    createFailed: 'Organisation konnte nicht erstellt werden',
    nameRequired: 'Bitte geben Sie einen gültigen Organisationsnamen ein',
    createTitle: 'Organisation erstellen',
    createDescription:
      'Ihre Dokumente werden nach Organisationen gruppiert. Sie können mehrere Organisationen erstellen, um beispielsweise private und berufliche Dokumente getrennt zu verwalten.',
    nameLabel: 'Organisationsname',
    namePlaceholder: 'Meine Organisation',
    create: 'Organisation erstellen',
  },
  appSettings: {
    title: 'App-Einstellungen',
    language: {
      title: 'Sprache',
      description: 'Wählen Sie die Sprache, die die App auf diesem Gerät verwendet.',
      useDeviceLanguage: 'Gerätesprache verwenden',
    },
    errors: {
      saveFailed: {
        title: 'Sprache konnte nicht gespeichert werden',
        message: 'Ihre Sprache wurde nicht geändert. Bitte versuchen Sie es erneut.',
      },
    },
  },
  settings: {
    title: 'Einstellungen',
    account: 'Konto',
    app: 'App',
    name: 'Name',
    email: 'E-Mail-Adresse',
    emailVerified: 'E-Mail-Adresse bestätigt',
    yes: 'Ja',
    no: 'Nein',
    signOut: {
      title: 'Abmelden',
      confirmation: 'Möchten Sie sich wirklich abmelden?',
    },
  },
  serverSelection: {
    selectServer: 'Server auswählen',
    title: 'Organisieren, sichern und\narchivieren Sie Ihre Dokumente.',
    subtitle: 'Wählen Sie zunächst aus, wo Ihre Dokumente gespeichert sind.',
    continue: 'Weiter',
    managedCloud: {
      title: 'Verwaltete Cloud',
      description: 'Nutzen Sie den offiziellen Cloud-Dienst von Papra',
    },
    selfHosted: {
      title: 'Selbst gehostet',
      description: 'Verbinden Sie sich mit Ihrem eigenen Papra-Server',
    },
    serverUrl: {
      label: 'Server-URL',
      placeholder: 'https://ihr-server.de',
    },
    customHeaders: {
      label: ({ count }: { count: number }) =>
        count > 0 ? `Benutzerdefinierte Header (${count})` : 'Benutzerdefinierte Header',
      namePlaceholder: 'Name',
      valuePlaceholder: 'Wert',
      deleteLabel: ({ name }: { name: string }) => `Header ${name} löschen`,
      add: 'Header hinzufügen',
      parsingErrors: {
        'empty-name': () => 'Header-Namen dürfen nicht leer sein.',
        'invalid-name': ({ headerName }) => `Der Header-Name „${headerName}“ ist ungültig.`,
        'forbidden-name': ({ headerName }) =>
          `Der Header „${headerName}“ wird von der App oder vom Protokoll verwaltet und kann nicht manuell festgelegt werden.`,
        'invalid-value': ({ headerName }) =>
          `Der Wert für den Header „${headerName}“ ist ungültig. Er darf keine Zeilenumbrüche enthalten.`,
      },
    },
    errors: {
      invalidUrl: {
        title: 'Ungültige URL',
        message:
          'Bitte geben Sie eine gültige Server-URL einschließlich des Protokolls (http:// oder https://) ein.',
      },
      invalidCustomHeader: {
        title: 'Ungültiger benutzerdefinierter Header',
      },
      connectionFailed: {
        title: 'Verbindung fehlgeschlagen',
        message: 'Der Server konnte nicht erreicht werden.',
      },
      saveFailed: {
        title: 'Ein Fehler ist aufgetreten',
        message:
          'Die Serverkonfiguration konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
      },
    },
  },
} satisfies AppMessages;
