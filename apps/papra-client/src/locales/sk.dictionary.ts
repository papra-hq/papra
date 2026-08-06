export const translations = {
  // Authentication

  'auth.request-password-reset.title': 'Obnovte si heslo',
  'auth.request-password-reset.description': 'Zadajte svoj e-mail na obnovenie hesla.',
  'auth.request-password-reset.requested':
    'Ak pre tento e-mail existuje účet, poslali sme vám e-mail na obnovenie hesla.',
  'auth.request-password-reset.back-to-login': 'Späť na prihlásenie',
  'auth.request-password-reset.form.email.label': 'E-mail',
  'auth.request-password-reset.form.email.placeholder': 'Príklad: ada@papra.app',
  'auth.request-password-reset.form.email.required': 'Zadajte svoju e-mailovú adresu',
  'auth.request-password-reset.form.email.invalid': 'Táto e-mailová adresa je neplatná',
  'auth.request-password-reset.form.submit': 'Požiadať o obnovenie hesla',

  'auth.reset-password.title': 'Obnovte si heslo',
  'auth.reset-password.description': 'Zadajte nové heslo na obnovenie hesla.',
  'auth.reset-password.reset': 'Vaše heslo bolo obnovené.',
  'auth.reset-password.back-to-login': 'Späť na prihlásenie',
  'auth.reset-password.form.new-password.label': 'Nové heslo',
  'auth.reset-password.form.new-password.placeholder': 'Príklad: **********',
  'auth.reset-password.form.new-password.required': 'Zadajte svoje nové heslo',
  'auth.reset-password.form.new-password.min-length':
    'Heslo musí mať aspoň {{ minLength }} znakov',
  'auth.reset-password.form.new-password.max-length':
    'Heslo musí mať menej ako {{ maxLength }} znakov',
  'auth.reset-password.form.submit': 'Obnoviť heslo',

  'auth.email-provider.open': 'Otvoriť {{ provider }}',

  'auth.login.title': 'Prihlásenie do Papra',
  'auth.login.description':
    'Zadajte svoj e-mail alebo použite sociálne prihlásenie na prístup k svojmu účtu Papra.',
  'auth.login.login-with-provider': 'Prihlásiť sa cez {{ provider }}',
  'auth.login.no-account': 'Nemáte účet?',
  'auth.login.register': 'Zaregistrovať sa',
  'auth.login.form.email.label': 'E-mail',
  'auth.login.form.email.placeholder': 'Príklad: ada@papra.app',
  'auth.login.form.email.required': 'Zadajte svoju e-mailovú adresu',
  'auth.login.form.email.invalid': 'Táto e-mailová adresa je neplatná',
  'auth.login.form.password.label': 'Heslo',
  'auth.login.form.password.placeholder': 'Zadajte heslo',
  'auth.login.form.password.required': 'Zadajte svoje heslo',
  'auth.login.form.remember-me.label': 'Zapamätať si ma',
  'auth.login.form.forgot-password.label': 'Zabudli ste heslo?',
  'auth.login.form.submit': 'Prihlásiť sa',

  'auth.login.two-factor.title': 'Dvojfaktorové overenie',
  'auth.login.two-factor.description.totp':
    'Zadajte 6-miestny overovací kód z vašej autentifikačnej aplikácie.',
  'auth.login.two-factor.description.backup-code':
    'Zadajte jeden zo svojich záložných kódov na prístup k účtu.',
  'auth.login.two-factor.code.label.totp': 'Kód z autentifikačnej aplikácie',
  'auth.login.two-factor.code.label.backup-code': 'Záložný kód',
  'auth.login.two-factor.code.placeholder.backup-code': 'Zadajte záložný kód',
  'auth.login.two-factor.code.required': 'Zadajte overovací kód',
  'auth.login.two-factor.trust-device.label': 'Dôverovať tomuto zariadeniu 30 dní',
  'auth.login.two-factor.back': 'Späť na prihlásenie',
  'auth.login.two-factor.submit': 'Overiť',
  'auth.login.two-factor.verification-failed':
    'Overenie zlyhalo. Skontrolujte kód a skúste to znova.',
  'auth.login.two-factor.use-backup-code': 'Použiť záložný kód',
  'auth.login.two-factor.use-totp': 'Použiť autentifikačnú aplikáciu',

  'auth.register.title': 'Registrácia do Papra',
  'auth.register.description': 'Vytvorte si účet a začnite používať Papra.',
  'auth.register.register-with-email': 'Zaregistrovať sa e-mailom',
  'auth.register.register-with-provider': 'Zaregistrovať sa cez {{ provider }}',
  'auth.register.providers.google': 'Google',
  'auth.register.providers.github': 'GitHub',
  'auth.register.have-account': 'Už máte účet?',
  'auth.register.login': 'Prihlásiť sa',
  'auth.register.registration-disabled.title': 'Registrácia je vypnutá',
  'auth.register.registration-disabled.description':
    'Vytváranie nových účtov je na tejto inštancii Papra momentálne vypnuté. Prihlásiť sa môžu iba používatelia s existujúcimi účtami. Ak si myslíte, že ide o chybu, kontaktujte administrátora tejto inštancie.',
  'auth.register.form.email.label': 'E-mail',
  'auth.register.form.email.placeholder': 'Príklad: ada@papra.app',
  'auth.register.form.email.required': 'Zadajte svoju e-mailovú adresu',
  'auth.register.form.email.invalid': 'Táto e-mailová adresa je neplatná',
  'auth.register.form.password.label': 'Heslo',
  'auth.register.form.password.placeholder': 'Zadajte heslo',
  'auth.register.form.password.required': 'Zadajte svoje heslo',
  'auth.register.form.password.min-length': 'Heslo musí mať aspoň {{ minLength }} znakov',
  'auth.register.form.password.max-length': 'Heslo musí mať menej ako {{ maxLength }} znakov',
  'auth.register.form.name.label': 'Meno',
  'auth.register.form.name.placeholder': 'Príklad: Ada Lovelace',
  'auth.register.form.name.required': 'Zadajte svoje meno',
  'auth.register.form.name.max-length': 'Meno musí mať menej ako {{ maxLength }} znakov',
  'auth.register.form.submit': 'Zaregistrovať sa',

  'auth.email-validation-required.title': 'Overte svoj e-mail',
  'auth.email-validation-required.description':
    'Na vašu e-mailovú adresu bol odoslaný overovací e-mail. Overte svoju e-mailovú adresu kliknutím na odkaz v e-maile.',

  'auth.email-verification.success.title': 'E-mail overený',
  'auth.email-verification.success.description':
    'Váš e-mail bol úspešne overený. Teraz sa môžete prihlásiť do svojho účtu.',
  'auth.email-verification.success.login': 'Prejsť na prihlásenie',
  'auth.email-verification.error.title': 'Overenie zlyhalo',
  'auth.email-verification.error.description':
    'Platnosť overovacieho odkazu vypršala alebo je neplatný. Požiadajte o nový overovací e-mail prihlásením sa.',
  'auth.email-verification.error.back': 'Späť na prihlásenie',

  'auth.legal-links.description':
    'Pokračovaním potvrdzujete, že rozumiete a súhlasíte s {{ terms }} a {{ privacy }}.',
  'auth.legal-links.terms': 'Podmienkami používania',
  'auth.legal-links.privacy': 'Zásadami ochrany osobných údajov',

  'auth.no-auth-provider.title': 'Žiadny poskytovateľ prihlásenia',
  'auth.no-auth-provider.description':
    'Na tejto inštancii Papra nie sú povolení žiadni poskytovatelia prihlásenia. Kontaktujte administrátora tejto inštancie, aby ich povolil.',

  // User settings

  'user.settings.title': 'Nastavenia používateľa',
  'user.settings.description': 'Tu môžete spravovať nastavenia svojho účtu.',

  'user.settings.email.title': 'E-mailová adresa',
  'user.settings.email.description': 'Vašu e-mailovú adresu nie je možné zmeniť.',
  'user.settings.email.label': 'E-mailová adresa',

  'user.settings.name.title': 'Celé meno',
  'user.settings.name.description':
    'Vaše celé meno sa zobrazuje ostatným členom organizácie.',
  'user.settings.name.label': 'Celé meno',
  'user.settings.name.placeholder': 'Napr. Ján Novák',
  'user.settings.name.update': 'Aktualizovať meno',
  'user.settings.name.updated': 'Vaše celé meno bolo aktualizované',

  'user.settings.logout.title': 'Odhlásenie',
  'user.settings.logout.description':
    'Odhláste sa zo svojho účtu. Neskôr sa môžete znova prihlásiť.',
  'user.settings.logout.button': 'Odhlásiť sa',

  'user.settings.two-factor.title': 'Dvojfaktorové overenie',
  'user.settings.two-factor.description':
    'Pridajte svojmu účtu ďalšiu úroveň zabezpečenia.',
  'user.settings.two-factor.status.enabled': 'Zapnuté',
  'user.settings.two-factor.status.disabled': 'Vypnuté',
  'user.settings.two-factor.enable-button': 'Zapnúť 2FA',
  'user.settings.two-factor.disable-button': 'Vypnúť 2FA',
  'user.settings.two-factor.regenerate-codes-button': 'Znova vygenerovať záložné kódy',

  'user.settings.two-factor.enable-dialog.title': 'Zapnúť dvojfaktorové overenie',
  'user.settings.two-factor.enable-dialog.description': 'Zadajte svoje heslo na zapnutie 2FA.',
  'user.settings.two-factor.enable-dialog.password.label': 'Heslo',
  'user.settings.two-factor.enable-dialog.password.placeholder': 'Zadajte svoje heslo',
  'user.settings.two-factor.enable-dialog.password.required': 'Zadajte svoje heslo',
  'user.settings.two-factor.enable-dialog.cancel': 'Zrušiť',
  'user.settings.two-factor.enable-dialog.submit': 'Pokračovať',

  'user.settings.two-factor.setup-dialog.title': 'Nastavenie dvojfaktorového overenia',
  'user.settings.two-factor.setup-dialog.step1.title': 'Krok 1: Naskenujte QR kód',
  'user.settings.two-factor.setup-dialog.step1.description':
    'Naskenujte QR kód nižšie alebo ručne zadajte inštalačný kľúč do svojej autentifikačnej aplikácie.',
  'user.settings.two-factor.setup-dialog.copy-setup-key': 'Kopírovať inštalačný kľúč',
  'user.settings.two-factor.setup-dialog.step2.title': 'Krok 2: Overte kód',
  'user.settings.two-factor.setup-dialog.step2.description':
    'Zadajte 6-miestny kód vygenerovaný vašou autentifikačnou aplikáciou na overenie a zapnutie dvojfaktorového overenia.',
  'user.settings.two-factor.setup-dialog.cancel': 'Zrušiť',
  'user.settings.two-factor.setup-dialog.verify': 'Overiť a zapnúť 2FA',

  'user.settings.two-factor.backup-codes-dialog.title': 'Záložné kódy',
  'user.settings.two-factor.backup-codes-dialog.description':
    'Uložte si tieto záložné kódy na bezpečné miesto. Môžete ich použiť na prístup k účtu, ak stratíte prístup k svojej autentifikačnej aplikácii.',
  'user.settings.two-factor.backup-codes-dialog.copy': 'Kopírovať záložné kódy',
  'user.settings.two-factor.backup-codes-dialog.download': 'Stiahnuť záložné kódy',
  'user.settings.two-factor.backup-codes-dialog.download-filename': 'papra-2fa-zalozne-kody.txt',
  'user.settings.two-factor.backup-codes-dialog.close': 'Kódy mám uložené',

  'user.settings.two-factor.disable-dialog.title': 'Vypnúť dvojfaktorové overenie',
  'user.settings.two-factor.disable-dialog.description':
    'Zadajte svoje heslo na vypnutie 2FA. Váš účet tým bude menej zabezpečený.',
  'user.settings.two-factor.disable-dialog.password.label': 'Heslo',
  'user.settings.two-factor.disable-dialog.password.placeholder': 'Zadajte svoje heslo',
  'user.settings.two-factor.disable-dialog.password.required': 'Zadajte svoje heslo',
  'user.settings.two-factor.disable-dialog.cancel': 'Zrušiť',
  'user.settings.two-factor.disable-dialog.submit': 'Vypnúť 2FA',

  'user.settings.two-factor.regenerate-dialog.title': 'Znova vygenerovať záložné kódy',
  'user.settings.two-factor.regenerate-dialog.description':
    'Táto akcia zneplatní všetky existujúce záložné kódy a vygeneruje nové. Pokračujte zadaním svojho hesla.',
  'user.settings.two-factor.regenerate-dialog.password.label': 'Heslo',
  'user.settings.two-factor.regenerate-dialog.password.placeholder': 'Zadajte svoje heslo',
  'user.settings.two-factor.regenerate-dialog.password.required': 'Zadajte svoje heslo',
  'user.settings.two-factor.regenerate-dialog.cancel': 'Zrušiť',
  'user.settings.two-factor.regenerate-dialog.submit': 'Znova vygenerovať kódy',

  'user.settings.two-factor.enabled': 'Dvojfaktorové overenie bolo zapnuté',
  'user.settings.two-factor.disabled': 'Dvojfaktorové overenie bolo vypnuté',
  'user.settings.two-factor.codes-regenerated': 'Záložné kódy boli znova vygenerované',

  // Organizations

  'organizations.list.title': 'Vaše organizácie',
  'organizations.list.description':
    'Organizácie sú spôsob, ako zoskupiť vaše dokumenty a spravovať prístup k nim. Môžete vytvoriť viacero organizácií a pozvať členov svojho tímu na spoluprácu.',
  'organizations.list.create-new': 'Vytvoriť novú organizáciu',
  'organizations.list.back': 'Späť na organizácie',
  'organizations.list.deleted.title': 'Odstránené organizácie',
  'organizations.list.deleted.description':
    'Odstránené organizácie sa uchovávajú {{ days }} dní pred trvalým odstránením. Počas tohto obdobia ich môžete obnoviť.',
  'organizations.list.deleted.empty': 'Žiadne odstránené organizácie',
  'organizations.list.deleted.empty-description':
    'Keď odstránite organizáciu, zobrazí sa tu na {{ days }} dní pred trvalým odstránením.',
  'organizations.list.deleted.restore': 'Obnoviť',
  'organizations.list.deleted.restore-success': 'Organizácia bola úspešne obnovená',
  'organizations.list.deleted.restore-confirm.title': 'Obnoviť organizáciu',
  'organizations.list.deleted.restore-confirm.message':
    'Naozaj chcete obnoviť túto organizáciu? Vráti sa späť do zoznamu vašich aktívnych organizácií.',
  'organizations.list.deleted.restore-confirm.confirm-button': 'Obnoviť organizáciu',
  'organizations.list.deleted.deleted-at': 'Odstránená {{ date }}',
  'organizations.list.deleted.purge-at': 'Bude trvalo odstránená {{ date }}',
  'organizations.list.deleted.days-remaining':
    '({{ daysUntilPurge, =1:zostáva {daysUntilPurge} deň, [2-4]:zostávajú {daysUntilPurge} dni, zostáva {daysUntilPurge} dní }})',

  'organizations.details.no-documents.title': 'Žiadne dokumenty',
  'organizations.details.no-documents.description':
    'V tejto organizácii zatiaľ nie sú žiadne dokumenty. Začnite nahraním niekoľkých dokumentov.',
  'organizations.details.upload-documents': 'Nahrať dokumenty',
  'organizations.details.documents-count': 'dokumentov celkom',
  'organizations.details.total-size': 'celková veľkosť',
  'organizations.details.latest-documents': 'Naposledy importované dokumenty',

  'organizations.create.title': 'Vytvoriť novú organizáciu',
  'organizations.create.description':
    'Vaše dokumenty budú zoskupené podľa organizácií. Môžete vytvoriť viacero organizácií na oddelenie dokumentov, napríklad osobných a pracovných.',
  'organizations.create.back': 'Späť',
  'organizations.create.error.max-count-reached':
    'Dosiahli ste maximálny počet organizácií, ktoré môžete vytvoriť. Ak potrebujete vytvoriť ďalšie, kontaktujte podporu.',
  'organizations.create.form.name.label': 'Názov organizácie',
  'organizations.create.form.name.placeholder': 'Napr. Acme s.r.o.',
  'organizations.create.form.name.required': 'Zadajte názov organizácie',
  'organizations.create.form.submit': 'Vytvoriť organizáciu',
  'organizations.create.success': 'Organizácia bola úspešne vytvorená',
  'organizations.switcher.create': 'Vytvoriť novú organizáciu',

  'organizations.create-first.title': 'Vytvorte si organizáciu',
  'organizations.create-first.description':
    'Vaše dokumenty budú zoskupené podľa organizácií. Môžete vytvoriť viacero organizácií na oddelenie dokumentov, napríklad osobných a pracovných.',
  'organizations.create-first.default-name': 'Moja organizácia',
  'organizations.create-first.user-name': 'Organizácia používateľa {{ name }}',

  'organization.settings.title': 'Nastavenia organizácie',
  'organization.settings.page.title': 'Nastavenia organizácie',
  'organization.settings.page.description': 'Tu môžete spravovať nastavenia svojej organizácie.',
  'organization.settings.name.title': 'Názov organizácie',
  'organization.settings.name.update': 'Aktualizovať názov',
  'organization.settings.name.placeholder': 'Napr. Acme s.r.o.',
  'organization.settings.name.updated': 'Názov organizácie bol aktualizovaný',
  'organization.settings.subscription.title': 'Predplatné',
  'organization.settings.subscription.description':
    'Spravujte svoju fakturáciu, faktúry a platobné metódy.',
  'organization.settings.subscription.manage': 'Spravovať predplatné',
  'organization.settings.subscription.error': 'Nepodarilo sa získať URL zákazníckeho portálu',
  'organization.settings.delete.title': 'Odstrániť organizáciu',
  'organization.settings.delete.description':
    'Odstránením tejto organizácie sa natrvalo odstránia všetky údaje, ktoré sú s ňou spojené.',
  'organization.settings.delete.confirm.title': 'Odstrániť organizáciu',
  'organization.settings.delete.confirm.message':
    'Naozaj chcete odstrániť túto organizáciu? Organizácia bude označená na odstránenie a po {{ days }} dňoch trvalo odstránená. Počas tohto obdobia ju môžete obnoviť zo zoznamu svojich organizácií. Všetky dokumenty a údaje budú po uplynutí tejto lehoty trvalo odstránené.',
  'organization.settings.delete.confirm.confirm-button': 'Odstrániť organizáciu',
  'organization.settings.delete.confirm.cancel-button': 'Zrušiť',
  'organization.settings.delete.success': 'Organizácia bola odstránená',
  'organization.settings.delete.only-owner':
    'Túto organizáciu môže odstrániť iba jej vlastník.',
  'organization.settings.delete.has-active-subscription':
    'Organizáciu s aktívnym predplatným nie je možné odstrániť. Najprv zrušte svoje predplatné vyššie.',

  'organization.settings.auto-tagging.page.title': 'Nastavenia automatického štítkovania',
  'organization.settings.auto-tagging.page.description':
    'Nastavenia automatického štítkovania pre vašu organizáciu. Táto funkcia umožňuje automaticky priraďovať štítky obsahu na základe predikcií AI.',
  'organization.settings.auto-tagging.unavailable':
    'Automatické štítkovanie momentálne nie je pre vašu organizáciu dostupné. Pre viac informácií kontaktujte podporu.',
  'organization.settings.auto-tagging.enabled.label': 'Zapnúť automatické štítkovanie',
  'organization.settings.auto-tagging.enabled.description':
    'Keď je táto možnosť zapnutá, dokumenty pridané do tejto organizácie automaticky oštítkuje AI.',
  'organization.settings.auto-tagging.create-tags.label': 'Povoliť vytváranie nových štítkov',
  'organization.settings.auto-tagging.create-tags.description':
    'Keď je táto možnosť zapnutá, AI môže vytvárať nové štítky. V opačnom prípade môže používať iba existujúce.',
  'organization.settings.auto-tagging.max-tags.label': 'Maximálny počet štítkov na dokument',
  'organization.settings.auto-tagging.max-tags.description':
    'Najvyšší počet štítkov, ktoré môže AI priradiť jednému dokumentu (od {{ min }} do {{ max }}).',

  'organization.usage.page.title': 'Využitie',
  'organization.usage.page.description': 'Zobrazte aktuálne využitie a limity svojej organizácie.',
  'organization.usage.storage.title': 'Úložisko dokumentov',
  'organization.usage.storage.description': 'Celkové úložisko využité vašimi dokumentmi',
  'organization.usage.intake-emails.title': 'Prijímacie e-maily',
  'organization.usage.intake-emails.description': 'Počet prijímacích e-mailových adries',
  'organization.usage.members.title': 'Členovia',
  'organization.usage.members.description': 'Počet členov organizácie',
  'organization.usage.ai-credits.title': 'AI kredity',
  'organization.usage.ai-credits.description': 'AI kredity spotrebované tento mesiac',
  'organization.usage.unlimited': 'Neobmedzené',

  'organizations.members.title': 'Členovia',
  'organizations.members.description': 'Spravujte členov svojej organizácie',
  'organizations.members.invite-member': 'Pozvať člena',
  'organizations.members.invite-member-disabled-tooltip':
    'Pozývať členov do organizácie môžu iba administrátori alebo vlastníci',
  'organizations.members.remove-from-organization': 'Odobrať z organizácie',
  'organizations.members.role': 'Rola',
  'organizations.members.roles.owner': 'Vlastník',
  'organizations.members.roles.admin': 'Administrátor',
  'organizations.members.roles.member': 'Člen',
  'organizations.members.delete.confirm.title': 'Odobrať člena',
  'organizations.members.delete.confirm.message':
    'Naozaj chcete odobrať tohto člena z organizácie?',
  'organizations.members.delete.confirm.confirm-button': 'Odobrať',
  'organizations.members.delete.confirm.cancel-button': 'Zrušiť',
  'organizations.members.delete.success': 'Člen bol odobraný z organizácie',
  'organizations.members.update-role.success': 'Rola člena bola aktualizovaná',
  'organizations.members.table.headers.name': 'Meno',
  'organizations.members.table.headers.email': 'E-mail',
  'organizations.members.table.headers.role': 'Rola',
  'organizations.members.table.headers.created': 'Vytvorené',
  'organizations.members.table.headers.actions': 'Akcie',

  'organizations.invite-member.title': 'Pozvať člena',
  'organizations.invite-member.description': 'Pozvite člena do svojej organizácie',
  'organizations.invite-member.form.email.label': 'E-mail',
  'organizations.invite-member.form.email.placeholder': 'Príklad: ada@papra.app',
  'organizations.invite-member.form.email.required': 'Zadajte platnú e-mailovú adresu',
  'organizations.invite-member.form.role.label': 'Rola',
  'organizations.invite-member.form.submit': 'Pozvať do organizácie',
  'organizations.invite-member.success.message': 'Člen bol pozvaný',
  'organizations.invite-member.success.description':
    'Na zadaný e-mail bola odoslaná pozvánka do organizácie.',
  'organizations.invite-member.error.message': 'Nepodarilo sa pozvať člena',

  'organizations.invitations.title': 'Pozvánky',
  'organizations.invitations.description': 'Spravujte pozvánky do svojej organizácie',
  'organizations.invitations.list.cta': 'Pozvať člena',
  'organizations.invitations.list.empty.title': 'Žiadne čakajúce pozvánky',
  'organizations.invitations.list.empty.description':
    'Zatiaľ ste neboli pozvaní do žiadnej organizácie.',
  'organizations.invitations.status.pending': 'Čakajúca',
  'organizations.invitations.status.accepted': 'Prijatá',
  'organizations.invitations.status.rejected': 'Odmietnutá',
  'organizations.invitations.status.expired': 'Vypršaná',
  'organizations.invitations.status.cancelled': 'Zrušená',
  'organizations.invitations.resend': 'Znova odoslať pozvánku',
  'organizations.invitations.cancel.title': 'Zrušiť pozvánku',
  'organizations.invitations.cancel.description':
    'Naozaj chcete zrušiť túto pozvánku?',
  'organizations.invitations.cancel.confirm': 'Zrušiť pozvánku',
  'organizations.invitations.cancel.cancel': 'Zrušiť',
  'organizations.invitations.resend.title': 'Znova odoslať pozvánku',
  'organizations.invitations.resend.description':
    'Naozaj chcete znova odoslať túto pozvánku? Príjemcovi sa odošle nový e-mail.',
  'organizations.invitations.resend.confirm': 'Znova odoslať pozvánku',
  'organizations.invitations.resend.cancel': 'Zrušiť',

  'invitations.list.title': 'Pozvánky',
  'invitations.list.description': 'Spravujte svoje pozvánky do organizácií',
  'invitations.list.empty.title': 'Žiadne čakajúce pozvánky',
  'invitations.list.empty.description': 'Zatiaľ ste neboli pozvaní do žiadnej organizácie.',
  'invitations.list.headers.organization': 'Organizácia',
  'invitations.list.headers.status': 'Stav',
  'invitations.list.headers.created': 'Vytvorené',
  'invitations.list.headers.actions': 'Akcie',
  'invitations.list.actions.accept': 'Prijať',
  'invitations.list.actions.reject': 'Odmietnuť',
  'invitations.list.actions.accept.success.message': 'Pozvánka prijatá',
  'invitations.list.actions.accept.success.description': 'Pozvánka bola prijatá.',
  'invitations.list.actions.reject.success.message': 'Pozvánka odmietnutá',
  'invitations.list.actions.reject.success.description': 'Pozvánka bola odmietnutá.',

  // Documents

  'documents.list.title': 'Dokumenty',
  'documents.list.no-documents.title': 'Žiadne dokumenty',
  'documents.list.no-documents.description':
    'V tejto organizácii zatiaľ nie sú žiadne dokumenty. Začnite nahraním niekoľkých dokumentov.',
  'documents.list.no-results': 'Nenašli sa žiadne dokumenty',
  'documents.list.table.headers.file-name': 'Názov súboru',
  'documents.list.table.headers.document-date': 'Dátum',
  'documents.list.table.headers.created': 'Vytvorené',
  'documents.list.table.headers.deleted': 'Odstránené',
  'documents.list.table.headers.actions': 'Akcie',
  'documents.list.table.headers.tags': 'Štítky',
  'documents.list.search.placeholder': 'Hľadať dokumenty...',
  'documents.list.search.total-count-with-query':
    '{{ count }} {{ count, =1:dokument zodpovedá, [2-4]:dokumenty zodpovedajú, dokumentov zodpovedá }} tomuto vyhľadávaniu',
  'documents.list.search.total-count-no-query':
    '{{ count }} {{ count, =1:dokument, [2-4]:dokumenty, dokumentov }} celkom',

  'documents.list.batch.selected-count':
    '{{ count, =1:Vybratý {count} dokument, [2-4]:Vybraté {count} dokumenty, Vybratých {count} dokumentov }}',
  'documents.list.batch.clear': 'Zrušiť výber',
  'documents.list.batch.tag-action': 'Štítky',
  'documents.list.batch.trash-action': 'Kôš',
  'documents.list.batch.error': 'Hromadná operácia zlyhala. Skúste to znova.',
  'documents.list.batch.select-all-matching':
    'Vybrať všetky ({{ count }}) zodpovedajúce tomuto vyhľadávaniu',
  'documents.list.batch.select-all':
    'Vybrať {{ count, =1:{count} dokument, [2-4]:všetky {count} dokumenty, všetkých {count} dokumentov }}',
  'documents.list.batch.all-matching-selected':
    'Vybraté všetky dokumenty ({{ count }}) zodpovedajúce tomuto vyhľadávaniu',
  'documents.list.batch.all-selected':
    'Vybraté všetky dokumenty ({{ count }})',
  'documents.list.batch.trash.confirm.title': 'Presunúť do koša',
  'documents.list.batch.trash.confirm.description':
    'Presunúť {{ count }} {{ count, =1:dokument, [2-4]:dokumenty, dokumentov }} do koša? Neskôr ich môžete z koša obnoviť.',
  'documents.list.batch.trash.confirm.label': 'Presunúť do koša',
  'documents.list.batch.trash.confirm.cancel': 'Zrušiť',
  'documents.list.batch.trash.success':
    '{{ count, =1:{count} dokument bol presunutý, [2-4]:{count} dokumenty boli presunuté, {count} dokumentov bolo presunutých }} do koša',
  'documents.list.batch.tags.dialog.title': 'Upraviť štítky',
  'documents.list.batch.tags.dialog.description':
    'Pridajte alebo odstráňte štítky na {{ count }} {{ count, =1:vybratom dokumente, vybratých dokumentoch }}.',
  'documents.list.batch.tags.dialog.add-label': 'Štítky na pridanie',
  'documents.list.batch.tags.dialog.remove-label': 'Štítky na odstránenie',
  'documents.list.batch.tags.dialog.overlap-error':
    'Štítok nemôže byť v rámci jednej operácie pridaný aj odstránený.',
  'documents.list.batch.tags.dialog.submit': 'Použiť',
  'documents.list.batch.tags.dialog.cancel': 'Zrušiť',
  'documents.list.batch.tags.success':
    'Štítky boli upravené na {{ count }} {{ count, =1:dokumente, dokumentoch }}',

  'documents.tabs.info': 'Informácie',
  'documents.tabs.content': 'Obsah',
  'documents.tabs.activity': 'Aktivita',
  'documents.deleted.message':
    'Tento dokument bol odstránený a o {{ days }} dní bude trvalo vymazaný.',
  'documents.actions.download.title': 'Stiahnuť',
  'documents.actions.download.error': 'Nepodarilo sa stiahnuť dokument',
  'documents.actions.restore': 'Obnoviť',
  'documents.actions.delete': 'Odstrániť',
  'documents.actions.edit': 'Upraviť',
  'documents.actions.cancel': 'Zrušiť',
  'documents.actions.save': 'Uložiť',
  'documents.actions.saving': 'Ukladá sa...',
  'documents.content.alert':
    'Obsah dokumentu sa automaticky extrahuje pri nahraní. Používa sa iba na vyhľadávanie a indexovanie.',
  'documents.content.empty-placeholder':
    'Tento dokument nemá extrahovaný obsah, môžete ho tu nastaviť ručne.',
  'documents.info.id': 'ID',
  'documents.info.name': 'Názov',
  'documents.info.type': 'Typ',
  'documents.info.size': 'Veľkosť',
  'documents.info.created-at': 'Vytvorené',
  'documents.info.updated-at': 'Aktualizované',
  'documents.info.never': 'Nikdy',
  'documents.info.document-date': 'Dátum',
  'documents.info.no-date': 'Bez dátumu',
  'documents.info.today': 'Dnes',
  'documents.notes.label': 'Poznámky',
  'documents.notes.placeholder': 'Pridajte poznámky k tomuto dokumentu',
  'documents.notes.saving': 'Ukladá sa',
  'documents.notes.saved': 'Uložené',
  'documents.notes.save-error': 'Nepodarilo sa uložiť poznámky',

  'documents.management.details': 'Podrobnosti dokumentu',
  'documents.management.rename': 'Premenovať dokument',
  'documents.management.delete': 'Odstrániť dokument',

  'documents.import.drop-area.title': 'Presuňte súbory sem',
  'documents.import.drop-area.description': 'Importujte súbory ich presunutím sem',

  'documents.list.select.all': 'Vybrať všetky riadky na tejto stránke',
  'documents.list.select.row': 'Vybrať riadok',

  'custom-properties.types.text': 'Text',
  'custom-properties.types.number': 'Číslo',
  'custom-properties.types.date': 'Dátum',
  'custom-properties.types.boolean': 'Áno/nie',
  'custom-properties.types.select': 'Výber',
  'custom-properties.types.multi_select': 'Viacnásobný výber',
  'custom-properties.types.user_relation': 'Používateľ',
  'custom-properties.types.document_relation': 'Dokument',

  'custom-properties.list.title': 'Vlastné polia',
  'custom-properties.list.description':
    'Definujte vlastné polia metadát pre svoje dokumenty. Polia môžu byť text, čísla, dátumy, áno/nie alebo zoznamy na výber.',
  'custom-properties.list.create-button': 'Vytvoriť pole',
  'custom-properties.list.empty.title': 'Vlastné polia',
  'custom-properties.list.empty.description':
    'Vlastné polia vám umožňujú pridať k dokumentom štruktúrované metadáta, ako sú dátumy platnosti, názvy spoločností alebo sumy.',
  'custom-properties.list.table.name': 'Názov',
  'custom-properties.list.table.type': 'Typ',
  'custom-properties.list.table.description': 'Popis',
  'custom-properties.list.table.created': 'Vytvorené',
  'custom-properties.list.table.actions': 'Akcie',
  'custom-properties.list.table.no-description': 'Bez popisu',
  'custom-properties.list.delete.confirm-title': 'Odstrániť vlastné pole',
  'custom-properties.list.delete.confirm-message':
    'Naozaj chcete odstrániť vlastné pole „{{ name }}“? Túto akciu nie je možné vrátiť späť.',
  'custom-properties.list.delete.confirm-button': 'Odstrániť',
  'custom-properties.list.delete.success': 'Vlastné pole bolo úspešne odstránené',
  'custom-properties.list.delete.error': 'Nepodarilo sa odstrániť vlastné pole',

  'custom-properties.create.title': 'Vytvoriť vlastné pole',
  'custom-properties.create.submit': 'Vytvoriť pole',
  'custom-properties.create.success': 'Vlastné pole bolo úspešne vytvorené',
  'custom-properties.create.error': 'Nepodarilo sa vytvoriť vlastné pole',

  'custom-properties.update.title': 'Upraviť vlastné pole',
  'custom-properties.update.submit': 'Uložiť zmeny',
  'custom-properties.update.success': 'Vlastné pole bolo úspešne aktualizované',
  'custom-properties.update.error': 'Nepodarilo sa aktualizovať vlastné pole',

  'custom-properties.form.name.label': 'Názov',
  'custom-properties.form.name.placeholder': 'napr. Suma faktúry',
  'custom-properties.form.name.required': 'Názov je povinný',
  'custom-properties.form.name.max-length': 'Názov môže mať najviac 255 znakov',
  'custom-properties.form.description.label': 'Popis',
  'custom-properties.form.description.optional': '(nepovinné)',
  'custom-properties.form.description.placeholder': 'Popíšte, na čo sa toto pole používa',
  'custom-properties.form.description.max-length': 'Popis môže mať najviac 1000 znakov',
  'custom-properties.form.type.label': 'Typ',
  'custom-properties.form.type.immutable': 'Typ poľa nie je možné po vytvorení zmeniť.',
  'custom-properties.form.options.title': 'Možnosti',
  'custom-properties.form.options.description': 'Definujte možnosti dostupné pre toto pole.',
  'custom-properties.form.options.name.placeholder': 'Názov možnosti',
  'custom-properties.form.options.name.required': 'Názov možnosti je povinný',
  'custom-properties.form.options.name.max-length': 'Názov možnosti môže mať najviac 255 znakov',
  'custom-properties.form.options.validation.required': 'Pridajte aspoň jednu možnosť',
  'custom-properties.form.options.add': 'Pridať možnosť',
  'custom-properties.form.cancel': 'Zrušiť',
  'custom-properties.form.save-error':
    'Pri ukladaní definície poľa sa vyskytla chyba. Skúste to znova.',

  'documents.custom-properties.section-title': 'Polia',
  'documents.custom-properties.no-value': 'Nenastavené',
  'documents.custom-properties.text-placeholder': 'Zadajte hodnotu...',
  'documents.custom-properties.save': 'Uložiť',
  'documents.custom-properties.clear': 'Vymazať',
  'documents.custom-properties.document-relation-search-placeholder': 'Hľadať dokumenty...',
  'documents.custom-properties.user-relation-manage': 'Spravovať používateľov',
  'documents.custom-properties.document-relation-manage': 'Spravovať dokumenty',
  'documents.custom-properties.no-results': 'Žiadne výsledky',

  'documents.rename.title': 'Premenovať dokument',
  'documents.rename.form.name.label': 'Názov',
  'documents.rename.form.name.placeholder': 'Príklad: Faktúra 2024',
  'documents.rename.form.name.required': 'Zadajte názov dokumentu',
  'documents.rename.form.name.max-length': 'Názov musí mať menej ako 255 znakov',
  'documents.rename.form.submit': 'Premenovať dokument',
  'documents.rename.success': 'Dokument bol úspešne premenovaný',
  'documents.rename.cancel': 'Zrušiť',

  'import-documents.title.error':
    '{{ count, =1:{count} dokument sa nepodarilo importovať, [2-4]:{count} dokumenty sa nepodarilo importovať, {count} dokumentov sa nepodarilo importovať }}',
  'import-documents.title.success':
    '{{ count, =1:{count} dokument importovaný, [2-4]:{count} dokumenty importované, {count} dokumentov importovaných }}',
  'import-documents.title.pending': '{{ count }} / {{ total }} dokumentov importovaných',
  'import-documents.title.none': 'Importovať dokumenty',
  'import-documents.no-import-in-progress': 'Neprebieha žiadny import dokumentov',

  'documents.deleted.title': 'Odstránené dokumenty',
  'documents.deleted.empty.title': 'Žiadne odstránené dokumenty',
  'documents.deleted.empty.description':
    'Nemáte žiadne odstránené dokumenty. Odstránené dokumenty sa presunú do koša na {{ days }} dní.',
  'documents.deleted.retention-notice':
    'Všetky odstránené dokumenty sa uchovávajú v koši {{ days }} dní. Po uplynutí tejto lehoty budú dokumenty trvalo vymazané a nebude ich možné obnoviť.',
  'documents.deleted.deleted-at': 'Odstránené',
  'documents.deleted.restoring': 'Obnovuje sa...',
  'documents.deleted.deleting': 'Odstraňuje sa...',

  'documents.preview.unknown-file-type': 'Pre tento typ súboru nie je k dispozícii náhľad',
  'documents.preview.binary-file':
    'Zdá sa, že ide o binárny súbor, ktorý nie je možné zobraziť ako text',

  'documents.open-with.label': 'Otvoriť v',
  'documents.open-with.pdf-viewer': 'Prehliadač PDF',

  'documents.pdf-viewer.loading': 'Načítava sa PDF',
  'documents.pdf-viewer.not-a-pdf':
    'Tento dokument nie je PDF a nie je možné ho otvoriť v prehliadači PDF.',

  'documents.pdf-viewer.toolbar.hide-sidebar': 'Skryť bočný panel',
  'documents.pdf-viewer.toolbar.show-sidebar': 'Zobraziť bočný panel',
  'documents.pdf-viewer.toolbar.previous-page': 'Predchádzajúca strana',
  'documents.pdf-viewer.toolbar.next-page': 'Nasledujúca strana',
  'documents.pdf-viewer.toolbar.fit-width': 'Prispôsobiť šírke',
  'documents.pdf-viewer.toolbar.fit-page': 'Prispôsobiť strane',
  'documents.pdf-viewer.toolbar.rotate-clockwise': 'Otočiť doprava',
  'documents.pdf-viewer.toolbar.download': 'Stiahnuť',
  'documents.pdf-viewer.toolbar.print': 'Tlačiť',

  'documents.pdf-viewer.zoom.zoom-out': 'Oddialiť',
  'documents.pdf-viewer.zoom.zoom-in': 'Priblížiť',
  'documents.pdf-viewer.zoom.auto': 'Automaticky',
  'documents.pdf-viewer.zoom.actual-size': 'Skutočná veľkosť',
  'documents.pdf-viewer.zoom.page-fit': 'Celá strana',
  'documents.pdf-viewer.zoom.page-width': 'Šírka strany',

  'documents.pdf-viewer.more-actions.label': 'Ďalšie akcie',
  'documents.pdf-viewer.more-actions.presentation-mode': 'Prezentačný režim',
  'documents.pdf-viewer.more-actions.download': 'Stiahnuť',
  'documents.pdf-viewer.more-actions.print': 'Tlačiť',
  'documents.pdf-viewer.more-actions.go-to-first-page': 'Prejsť na prvú stranu',
  'documents.pdf-viewer.more-actions.go-to-last-page': 'Prejsť na poslednú stranu',
  'documents.pdf-viewer.more-actions.rotate-clockwise': 'Otočiť doprava',
  'documents.pdf-viewer.more-actions.rotate-counterclockwise': 'Otočiť doľava',
  'documents.pdf-viewer.more-actions.page-scrolling': 'Posúvanie po stranách',
  'documents.pdf-viewer.more-actions.vertical-scrolling': 'Zvislé posúvanie',
  'documents.pdf-viewer.more-actions.horizontal-scrolling': 'Vodorovné posúvanie',
  'documents.pdf-viewer.more-actions.wrapped-scrolling': 'Posúvanie so zalamovaním',
  'documents.pdf-viewer.more-actions.no-spreads': 'Bez dvojstrán',
  'documents.pdf-viewer.more-actions.odd-spreads': 'Nepárne dvojstrany',
  'documents.pdf-viewer.more-actions.even-spreads': 'Párne dvojstrany',
  'documents.pdf-viewer.more-actions.document-properties': 'Vlastnosti dokumentu',

  'documents.pdf-viewer.properties.title': 'Vlastnosti dokumentu',
  'documents.pdf-viewer.properties.na': '–',
  'documents.pdf-viewer.properties.file-name': 'Názov súboru',
  'documents.pdf-viewer.properties.file-size': 'Veľkosť súboru',
  'documents.pdf-viewer.properties.doc-title': 'Názov',
  'documents.pdf-viewer.properties.author': 'Autor',
  'documents.pdf-viewer.properties.subject': 'Predmet',
  'documents.pdf-viewer.properties.keywords': 'Kľúčové slová',
  'documents.pdf-viewer.properties.creation-date': 'Dátum vytvorenia',
  'documents.pdf-viewer.properties.modification-date': 'Dátum úpravy',
  'documents.pdf-viewer.properties.creator': 'Vytvoril',
  'documents.pdf-viewer.properties.pdf-producer': 'Producent PDF',
  'documents.pdf-viewer.properties.pdf-version': 'Verzia PDF',
  'documents.pdf-viewer.properties.page-count': 'Počet strán',
  'documents.pdf-viewer.properties.page-size': 'Veľkosť strany',
  'documents.pdf-viewer.properties.fast-web-view': 'Rýchle webové zobrazenie',
  'documents.pdf-viewer.properties.yes': 'Áno',
  'documents.pdf-viewer.properties.no': 'Nie',

  'documents.pdf-viewer.sidebar.page-thumbnails': 'Miniatúry strán',
  'documents.pdf-viewer.sidebar.document-outline': 'Osnova dokumentu',
  'documents.pdf-viewer.sidebar.attachments': 'Prílohy',

  'documents.pdf-viewer.thumbnails.page-alt': 'Strana {{ page }}',

  // Document share links
  'document-share-links.share-action': 'Zdieľať',
  'document-share-links.copy': 'Kopírovať odkaz',
  'document-share-links.copied': 'Odkaz bol skopírovaný do schránky',
  'document-share-links.copy-error': 'Nepodarilo sa skopírovať odkaz',
  'document-share-links.enabled': 'Odkaz na zdieľanie zapnutý',
  'document-share-links.disabled': 'Odkaz na zdieľanie vypnutý',
  'document-share-links.deleted': 'Odkaz na zdieľanie odstránený',
  'document-share-links.password-protected': 'Chránený heslom',
  'document-share-links.no-password': 'Bez hesla',
  'document-share-links.never-expires': 'Nikdy nevyprší',
  'document-share-links.expires-on': 'Vyprší {{ date }}',
  'document-share-links.list.title': 'Odkazy na zdieľanie',
  'document-share-links.list.description': 'Spravujte odkazy na zdieľanie pre „{{ name }}“.',
  'document-share-links.list.create-new': 'Vytvoriť nový odkaz',
  'document-share-links.create.title': 'Vytvoriť odkaz na zdieľanie',
  'document-share-links.create.description':
    'Vytvorte nový odkaz na zdieľanie tohto dokumentu.',
  'document-share-links.create.password.toggle': 'Vyžadovať heslo',
  'document-share-links.create.password.hint':
    'Nepovinné, príjemcovia ho budú musieť zadať pred získaním prístupu.',
  'document-share-links.create.password.placeholder': 'Zadajte alebo vygenerujte heslo',
  'document-share-links.create.password.generate': 'Vygenerovať',
  'document-share-links.create.expiration.toggle': 'Nastaviť dátum vypršania',
  'document-share-links.create.expiration.hint':
    'Nepovinné, odkaz po tomto dátume automaticky vyprší.',
  'document-share-links.create.expiration.24h': '24 hodín',
  'document-share-links.create.expiration.7d': '7 dní',
  'document-share-links.create.expiration.30d': '30 dní',
  'document-share-links.create.expiration.custom': 'Vlastný',
  'document-share-links.create.expiration.pick-date': 'Vyberte dátum',
  'document-share-links.create.cancel': 'Zrušiť',
  'document-share-links.create.submit': 'Vytvoriť odkaz',
  'document-share-links.create.error': 'Nepodarilo sa vytvoriť odkaz na zdieľanie',
  'document-share-links.created.title': 'Odkaz na zdieľanie vytvorený',
  'document-share-links.created.description':
    'Váš odkaz na zdieľanie je pripravený — skopírujte ho a zdieľajte.',
  'document-share-links.created.done': 'Hotovo',
  'document-share-links.actions.menu': 'Akcie',
  'document-share-links.actions.open-document': 'Otvoriť dokument',
  'document-share-links.actions.enable': 'Zapnúť odkaz',
  'document-share-links.actions.disable': 'Vypnúť odkaz',
  'document-share-links.actions.stop-sharing': 'Ukončiť zdieľanie',
  'document-share-links.delete.confirm.title': 'Odstrániť odkaz na zdieľanie',
  'document-share-links.delete.confirm.message':
    'Ktokoľvek s týmto odkazom okamžite stratí prístup. Túto akciu nie je možné vrátiť späť.',
  'document-share-links.delete.confirm.confirm-button': 'Odstrániť odkaz',
  'document-share-links.delete.confirm.cancel-button': 'Zrušiť',
  'document-share-links.management.title': 'Odkazy na zdieľanie',
  'document-share-links.management.description':
    'Spravujte všetky odkazy na zdieľanie vytvorené v tejto organizácii.',
  'document-share-links.management.empty.title': 'Žiadne odkazy na zdieľanie',
  'document-share-links.management.empty.description':
    'Tu sa zobrazia odkazy na zdieľanie vytvorené pre dokumenty v tejto organizácii.',
  'document-share-links.management.table.document': 'Dokument',
  'document-share-links.management.table.link': 'Odkaz',
  'document-share-links.management.table.status': 'Stav',
  'document-share-links.management.table.security': 'Zabezpečenie',
  'document-share-links.management.table.expiry': 'Vypršanie',
  'document-share-links.management.table.last-accessed': 'Naposledy otvorený',
  'document-share-links.management.table.actions': 'Akcie',
  'document-share-links.management.status.expired': 'Vypršaný',
  'document-share-links.management.status.enabled': 'Zapnutý',
  'document-share-links.management.status.disabled': 'Vypnutý',
  'document-share-links.management.status.trashed': 'Dokument v koši',
  'document-share-links.management.status.trashed-hint':
    'Zdieľaný dokument je v koši, takže tento odkaz je neaktívny, kým dokument neobnovíte.',
  'document-share-links.management.security.password': 'Heslo',
  'document-share-links.management.security.public': 'Verejný',
  'document-share-links.management.never': 'Nikdy',
  'document-share-links.public.download': 'Stiahnuť',
  'document-share-links.public.download-error': 'Nepodarilo sa stiahnuť súbor',
  'document-share-links.public.password.title': 'Vyžaduje sa heslo',
  'document-share-links.public.password.description':
    'Tento dokument je chránený. Na získanie prístupu zadajte heslo.',
  'document-share-links.public.password.label': 'Heslo',
  'document-share-links.public.password.placeholder': 'Zadajte heslo',
  'document-share-links.public.password.submit': 'Odomknúť',
  'document-share-links.public.password.invalid': 'Nesprávne heslo',
  'document-share-links.public.password.too-many-attempts':
    'Príliš veľa pokusov. Skúste to znova neskôr.',
  'document-share-links.public.gone.title': 'Odkaz nie je dostupný',
  'document-share-links.public.gone.description':
    'Tento odkaz na zdieľanie vypršal alebo bol vypnutý.',
  'document-share-links.public.not-found.title': 'Odkaz sa nenašiel',
  'document-share-links.public.not-found.description': 'Tento odkaz na zdieľanie neexistuje.',

  'trash.delete-all.button': 'Odstrániť všetko',
  'trash.delete-all.confirm.title': 'Trvalo odstrániť všetky dokumenty?',
  'trash.delete-all.confirm.description':
    'Naozaj chcete trvalo odstrániť všetky dokumenty z koša? Túto akciu nie je možné vrátiť späť.',
  'trash.delete-all.confirm.label': 'Odstrániť',
  'trash.delete-all.confirm.cancel': 'Zrušiť',
  'trash.delete.button': 'Odstrániť',
  'trash.delete.confirm.title': 'Trvalo odstrániť dokument?',
  'trash.delete.confirm.description':
    'Naozaj chcete trvalo odstrániť tento dokument z koša? Túto akciu nie je možné vrátiť späť.',
  'trash.delete.confirm.label': 'Odstrániť',
  'trash.delete.confirm.cancel': 'Zrušiť',
  'trash.deleted.success.title': 'Dokument odstránený',
  'trash.deleted.success.description': 'Dokument bol trvalo odstránený.',

  'activity.document.created': 'Dokument bol vytvorený',
  'activity.document.updated.single': 'Pole {{ field }} bolo aktualizované',
  'activity.document.updated.multiple': 'Polia {{ fields }} boli aktualizované',
  'activity.document.updated': 'Dokument bol aktualizovaný',
  'activity.document.deleted': 'Dokument bol odstránený',
  'activity.document.restored': 'Dokument bol obnovený',
  'activity.document.tagged': 'Štítok {{ tag }} bol pridaný',
  'activity.document.untagged': 'Štítok {{ tag }} bol odstránený',

  'activity.document.user.name': 'používateľom {{ name }}',

  'activity.load-more': 'Načítať viac',
  'activity.no-more-activities': 'Žiadne ďalšie aktivity pre tento dokument',

  // Tags

  'tags.no-tags.title': 'Zatiaľ žiadne štítky',
  'tags.no-tags.description':
    'Táto organizácia zatiaľ nemá žiadne štítky. Štítky slúžia na kategorizáciu dokumentov. Môžete ich pridať k svojim dokumentom, aby sa ľahšie hľadali a organizovali.',
  'tags.no-tags.create-tag': 'Vytvoriť štítok',

  'tags.title': 'Štítky dokumentov',
  'tags.description':
    'Štítky slúžia na kategorizáciu dokumentov. Môžete ich pridať k svojim dokumentom, aby sa ľahšie hľadali a organizovali.',
  'tags.create': 'Vytvoriť štítok',
  'tags.update': 'Upraviť štítok',
  'tags.delete': 'Odstrániť štítok',
  'tags.delete.confirm.title': 'Odstrániť štítok',
  'tags.delete.confirm.message':
    'Naozaj chcete odstrániť tento štítok? Odstránením štítka sa odstráni zo všetkých dokumentov.',
  'tags.delete.confirm.confirm-button': 'Odstrániť',
  'tags.delete.confirm.cancel-button': 'Zrušiť',
  'tags.delete.success': 'Štítok bol úspešne odstránený',
  'tags.create.success': 'Štítok „{{ name }}“ bol úspešne vytvorený.',
  'tags.update.success': 'Štítok „{{ name }}“ bol úspešne aktualizovaný.',
  'tags.form.name.label': 'Názov',
  'tags.form.name.placeholder': 'Napr. Zmluvy',
  'tags.form.name.required': 'Zadajte názov štítka',
  'tags.form.name.max-length': 'Názov štítka musí mať menej ako 64 znakov',
  'tags.form.color.label': 'Farba',
  'tags.form.color.required': 'Zadajte farbu',
  'tags.form.color.invalid': 'Hex farba má nesprávny formát.',
  'tags.form.description.label': 'Popis',
  'tags.form.description.optional': '(nepovinné)',
  'tags.form.description.placeholder': 'Napr. Všetky zmluvy podpísané spoločnosťou',
  'tags.form.description.max-length': 'Popis musí mať menej ako 256 znakov',
  'tags.form.no-description': 'Bez popisu',
  'tags.table.headers.tag': 'Štítok',
  'tags.table.headers.description': 'Popis',
  'tags.table.headers.documents': 'Dokumenty',
  'tags.table.headers.created': 'Vytvorené',
  'tags.table.headers.actions': 'Akcie',
  'tags.picker.search-placeholder': 'Hľadať štítky...',
  'tags.picker.filter-placeholder': 'Filtrovať štítky...',
  'tags.picker.create-new-with-name': 'Vytvoriť nový štítok „{{ name }}“',
  'tags.picker.create-new': 'Vytvoriť nový štítok',

  // Document views

  'document-views.create': 'Vytvoriť zobrazenie',
  'document-views.save-as-view': 'Uložiť dopyt ako zobrazenie',
  'document-views.update': 'Upraviť zobrazenie',
  'document-views.delete': 'Odstrániť zobrazenie',
  'document-views.delete.confirm.title': 'Odstrániť zobrazenie',
  'document-views.delete.confirm.message': 'Naozaj chcete odstrániť toto zobrazenie?',
  'document-views.delete.confirm.confirm-button': 'Odstrániť',
  'document-views.delete.confirm.cancel-button': 'Zrušiť',
  'document-views.delete.success': 'Zobrazenie bolo úspešne odstránené',
  'document-views.create.success': 'Zobrazenie „{{ name }}“ bolo úspešne vytvorené.',
  'document-views.update.success': 'Zobrazenie „{{ name }}“ bolo úspešne aktualizované.',
  'document-views.form.name.label': 'Názov',
  'document-views.form.name.placeholder': 'Napr. Doručené',
  'document-views.form.name.required': 'Zadajte názov zobrazenia',
  'document-views.form.name.max-length': 'Názov zobrazenia musí mať menej ako 100 znakov',
  'document-views.form.query.label': 'Dopyt',
  'document-views.form.query.placeholder': 'Napr. tag:inbox AND -tag:archived',
  'document-views.form.query.required': 'Zadajte dopyt',
  'document-views.form.query.max-length': 'Dopyt musí mať menej ako 500 znakov',
  'document-views.form.query.hint':
    'Použite rovnakú syntax ako vo vyhľadávaní dokumentov. Napr. tag:inbox, has:tags, before:2024-01-01',
  'document-views.form.description.label': 'Popis',
  'document-views.form.description.optional': '(nepovinné)',
  'document-views.form.description.placeholder': 'Napr. Dokumenty čakajúce na spracovanie',
  'document-views.form.description.max-length': 'Popis musí mať menej ako 256 znakov',
  'document-views.actions.menu': 'Akcie zobrazenia',
  'document-views.view.no-documents': 'Dopytu tohto zobrazenia nezodpovedajú žiadne dokumenty.',
  'document-views.view.not-found': 'Zobrazenie sa nenašlo.',
  'api-errors.document_views.already_exists':
    'Zobrazenie s týmto názvom už v tejto organizácii existuje',
  'api-errors.document_views.not_found': 'Zobrazenie sa nenašlo',

  // Tagging rules

  'tagging-rules.field.name': 'názov dokumentu',
  'tagging-rules.field.content': 'obsah dokumentu',
  'tagging-rules.operator.equals': 'sa rovná',
  'tagging-rules.operator.not-equals': 'sa nerovná',
  'tagging-rules.operator.contains': 'obsahuje',
  'tagging-rules.operator.not-contains': 'neobsahuje',
  'tagging-rules.operator.starts-with': 'začína na',
  'tagging-rules.operator.ends-with': 'končí na',
  'tagging-rules.list.title': 'Pravidlá štítkovania',
  'tagging-rules.list.description':
    'Spravujte pravidlá štítkovania svojej organizácie na automatické priraďovanie štítkov dokumentom podľa podmienok, ktoré definujete.',
  'tagging-rules.list.demo-warning':
    'Poznámka: Keďže ide o demo prostredie (bez servera), pravidlá štítkovania sa na novo pridané dokumenty nepoužijú.',
  'tagging-rules.list.no-tagging-rules.title': 'Žiadne pravidlá štítkovania',
  'tagging-rules.list.no-tagging-rules.description':
    'Vytvorte pravidlo štítkovania na automatické priraďovanie štítkov pridaným dokumentom podľa podmienok, ktoré definujete.',
  'tagging-rules.list.no-tagging-rules.create-tagging-rule': 'Vytvoriť pravidlo štítkovania',
  'tagging-rules.list.card.no-conditions': 'Bez podmienok',
  'tagging-rules.list.card.one-condition': '1 podmienka',
  'tagging-rules.list.card.conditions':
    '{{ count, =1:{count} podmienka, [2-4]:{count} podmienky, {count} podmienok }}',
  'tagging-rules.list.card.delete': 'Odstrániť pravidlo',
  'tagging-rules.list.card.edit': 'Upraviť pravidlo',
  'tagging-rules.create.title': 'Vytvoriť pravidlo štítkovania',
  'tagging-rules.create.success': 'Pravidlo štítkovania bolo úspešne vytvorené',
  'tagging-rules.create.error': 'Nepodarilo sa vytvoriť pravidlo štítkovania',
  'tagging-rules.create.submit': 'Vytvoriť pravidlo',
  'tagging-rules.form.name.label': 'Názov',
  'tagging-rules.form.name.placeholder': 'Príklad: Oštítkovať faktúry',
  'tagging-rules.form.name.min-length': 'Zadajte názov pravidla',
  'tagging-rules.form.name.max-length': 'Názov musí mať menej ako 64 znakov',
  'tagging-rules.form.description.label': 'Popis',
  'tagging-rules.form.description.placeholder':
    'Príklad: Oštítkovať dokumenty so slovom „faktúra“ v názve',
  'tagging-rules.form.description.max-length': 'Popis musí mať menej ako 256 znakov',
  'tagging-rules.form.conditions.label': 'Podmienky',
  'tagging-rules.form.conditions.description':
    'Definujte podmienky, ktoré musia byť splnené, aby sa pravidlo použilo. Bez podmienok sa pravidlo použije na všetky dokumenty',
  'tagging-rules.form.conditions.add-condition': 'Pridať podmienku',
  'tagging-rules.form.conditions.connector.when': 'Keď',
  'tagging-rules.form.conditions.connector.and': 'a',
  'tagging-rules.form.conditions.connector.or': 'alebo',
  'tagging-rules.condition-match-mode.all': 'Musia byť splnené všetky podmienky',
  'tagging-rules.condition-match-mode.any': 'Musí byť splnená aspoň jedna podmienka',
  'tagging-rules.form.conditions.no-conditions.title': 'Žiadne podmienky',
  'tagging-rules.form.conditions.no-conditions.description':
    'K tomuto pravidlu ste nepridali žiadne podmienky. Pravidlo priradí svoje štítky všetkým dokumentom.',
  'tagging-rules.form.conditions.no-conditions.confirm': 'Použiť pravidlo bez podmienok',
  'tagging-rules.form.conditions.no-conditions.cancel': 'Zrušiť',
  'tagging-rules.form.conditions.value.placeholder': 'Príklad: faktúra',
  'tagging-rules.form.conditions.value.min-length': 'Zadajte hodnotu podmienky',
  'tagging-rules.form.tags.label': 'Štítky',
  'tagging-rules.form.tags.description':
    'Vyberte štítky, ktoré sa priradia pridaným dokumentom spĺňajúcim podmienky',
  'tagging-rules.form.tags.min-length': 'Vyžaduje sa aspoň jeden štítok na priradenie',
  'tagging-rules.form.tags.add-tag': 'Vytvoriť štítok',
  'tagging-rules.update.title': 'Upraviť pravidlo štítkovania',
  'tagging-rules.update.error': 'Nepodarilo sa aktualizovať pravidlo štítkovania',
  'tagging-rules.update.submit': 'Aktualizovať pravidlo',
  'tagging-rules.update.cancel': 'Zrušiť',
  'tagging-rules.apply.button': 'Použiť na existujúce dokumenty',
  'tagging-rules.apply.confirm.title': 'Použiť pravidlo na existujúce dokumenty?',
  'tagging-rules.apply.confirm.description':
    'Skontrolujú sa všetky existujúce dokumenty vo vašej organizácii a tam, kde sú splnené podmienky, sa priradia štítky. Spracovanie prebehne na pozadí.',
  'tagging-rules.apply.confirm.button': 'Použiť pravidlo',
  'tagging-rules.apply.success': 'Aplikovanie pravidla sa spustilo na pozadí',
  'tagging-rules.apply.error': 'Nepodarilo sa spustiť aplikovanie pravidla',
  'tagging-rules.apply.processing': 'Spúšťa sa...',

  // Intake emails

  'intake-emails.title': 'Prijímacie e-maily',
  'intake-emails.description':
    'Prijímacie e-mailové adresy slúžia na automatické prijímanie e-mailov do Papra. Stačí preposlať e-maily na prijímaciu e-mailovú adresu a ich prílohy sa pridajú medzi dokumenty vašej organizácie.',
  'intake-emails.disabled.title': 'Prijímacie e-maily sú vypnuté',
  'intake-emails.disabled.description':
    'Prijímacie e-maily sú na tejto inštancii vypnuté. Požiadajte svojho administrátora o ich zapnutie. Viac informácií nájdete v {{ documentation }}.',
  'intake-emails.disabled.documentation': 'dokumentácii',
  'intake-emails.info':
    'Spracujú sa iba zapnuté prijímacie e-maily z povolených adries odosielateľov. Prijímací e-mail môžete kedykoľvek zapnúť alebo vypnúť.',
  'intake-emails.empty.title': 'Žiadne prijímacie e-maily',
  'intake-emails.empty.description':
    'Vygenerujte prijímaciu adresu na jednoduché prijímanie e-mailových príloh.',
  'intake-emails.empty.generate': 'Vygenerovať prijímací e-mail',
  'intake-emails.count':
    '{{ count, =1:{count} prijímací e-mail, [2-4]:{count} prijímacie e-maily, {count} prijímacích e-mailov }} pre túto organizáciu',
  'intake-emails.new': 'Nový prijímací e-mail',
  'intake-emails.disabled-label': '(Vypnutý)',
  'intake-emails.no-origins': 'Žiadne povolené adresy odosielateľov',
  'intake-emails.allowed-origins':
    'Povolené z {{ count, =1:{count} adresy, {count} adries }}',
  'intake-emails.actions.enable': 'Zapnúť',
  'intake-emails.actions.disable': 'Vypnúť',
  'intake-emails.actions.manage-origins': 'Spravovať adresy odosielateľov',
  'intake-emails.actions.delete': 'Odstrániť',
  'intake-emails.delete.confirm.title': 'Odstrániť prijímací e-mail?',
  'intake-emails.delete.confirm.message':
    'Naozaj chcete odstrániť tento prijímací e-mail? Túto akciu nie je možné vrátiť späť.',
  'intake-emails.delete.confirm.confirm-button': 'Odstrániť prijímací e-mail',
  'intake-emails.delete.confirm.cancel-button': 'Zrušiť',
  'intake-emails.delete.success': 'Prijímací e-mail bol odstránený',
  'intake-emails.create.success': 'Prijímací e-mail bol vytvorený',
  'intake-emails.update.success.enabled': 'Prijímací e-mail bol zapnutý',
  'intake-emails.update.success.disabled': 'Prijímací e-mail bol vypnutý',
  'intake-emails.allowed-origins.title': 'Povolení odosielatelia',
  'intake-emails.allowed-origins.description':
    'Spracujú sa iba e-maily odoslané na {{ email }} z týchto adries. Ak nie sú uvedené žiadne adresy, všetky e-maily sa zahodia.',
  'intake-emails.allowed-origins.add.label': 'Pridať povolenú adresu odosielateľa',
  'intake-emails.allowed-origins.add.placeholder': 'Napr. ada@papra.app',
  'intake-emails.allowed-origins.add.button': 'Pridať',
  'intake-emails.allowed-origins.delete.label': 'Odstrániť povoleného odosielateľa',
  'intake-emails.actions.more': 'Ďalšie akcie',
  'intake-emails.allowed-origins.add.error.exists':
    'Tento e-mail už je medzi povolenými odosielateľmi tohto prijímacieho e-mailu',

  // API keys

  'api-keys.permissions.select-all': 'Vybrať všetko',
  'api-keys.permissions.deselect-all': 'Zrušiť výber',
  'api-keys.permissions.organizations.title': 'Organizácie',
  'api-keys.permissions.organizations.organizations:create': 'Vytvárať organizácie',
  'api-keys.permissions.organizations.organizations:read': 'Čítať organizácie',
  'api-keys.permissions.organizations.organizations:update': 'Upravovať organizácie',
  'api-keys.permissions.organizations.organizations:delete': 'Odstraňovať organizácie',
  'api-keys.permissions.documents.title': 'Dokumenty',
  'api-keys.permissions.documents.documents:create': 'Vytvárať dokumenty',
  'api-keys.permissions.documents.documents:read': 'Čítať dokumenty',
  'api-keys.permissions.documents.documents:update': 'Upravovať dokumenty',
  'api-keys.permissions.documents.documents:delete': 'Odstraňovať dokumenty',
  'api-keys.permissions.tags.title': 'Štítky',
  'api-keys.permissions.tags.tags:create': 'Vytvárať štítky',
  'api-keys.permissions.tags.tags:read': 'Čítať štítky',
  'api-keys.permissions.tags.tags:update': 'Upravovať štítky',
  'api-keys.permissions.tags.tags:delete': 'Odstraňovať štítky',
  'api-keys.permissions.custom-properties.title': 'Vlastné polia',
  'api-keys.permissions.custom-properties.custom-properties:create': 'Vytvárať vlastné polia',
  'api-keys.permissions.custom-properties.custom-properties:read': 'Čítať vlastné polia',
  'api-keys.permissions.custom-properties.custom-properties:update': 'Upravovať vlastné polia',
  'api-keys.permissions.custom-properties.custom-properties:delete': 'Odstraňovať vlastné polia',
  'api-keys.create.title': 'Vytvoriť API kľúč',
  'api-keys.create.description': 'Vytvorte nový API kľúč na prístup k Papra API.',
  'api-keys.create.success': 'API kľúč bol úspešne vytvorený.',
  'api-keys.create.back': 'Späť na API kľúče',
  'api-keys.create.form.name.label': 'Názov',
  'api-keys.create.form.name.placeholder': 'Príklad: Môj API kľúč',
  'api-keys.create.form.name.required': 'Zadajte názov API kľúča',
  'api-keys.create.form.permissions.label': 'Oprávnenia',
  'api-keys.create.form.permissions.required': 'Vyberte aspoň jedno oprávnenie',
  'api-keys.create.form.submit': 'Vytvoriť API kľúč',
  'api-keys.create.created.title': 'API kľúč vytvorený',
  'api-keys.create.created.description':
    'API kľúč bol úspešne vytvorený. Uložte si ho na bezpečné miesto, pretože sa už znova nezobrazí.',
  'api-keys.list.title': 'API kľúče',
  'api-keys.list.description': 'Tu môžete spravovať svoje API kľúče.',
  'api-keys.list.create': 'Vytvoriť API kľúč',
  'api-keys.list.empty.title': 'Žiadne API kľúče',
  'api-keys.list.empty.description': 'Vytvorte API kľúč na prístup k Papra API.',
  'api-keys.list.card.created': 'Vytvorený',
  'api-keys.delete.success': 'API kľúč bol úspešne odstránený',
  'api-keys.delete.confirm.title': 'Odstrániť API kľúč',
  'api-keys.delete.confirm.message':
    'Naozaj chcete odstrániť tento API kľúč? Túto akciu nie je možné vrátiť späť.',
  'api-keys.delete.confirm.confirm-button': 'Odstrániť',
  'api-keys.delete.confirm.cancel-button': 'Zrušiť',

  // Webhooks

  'webhooks.list.title': 'Webhooky',
  'webhooks.list.description': 'Spravujte webhooky svojej organizácie',
  'webhooks.list.empty.title': 'Žiadne webhooky',
  'webhooks.list.empty.description':
    'Vytvorte svoj prvý webhook a začnite prijímať udalosti',
  'webhooks.list.create': 'Vytvoriť webhook',
  'webhooks.list.card.last-triggered': 'Naposledy spustený',
  'webhooks.list.card.never': 'Nikdy',
  'webhooks.list.card.created': 'Vytvorený',
  'webhooks.create.title': 'Vytvoriť webhook',
  'webhooks.create.description': 'Vytvorte nový webhook na prijímanie udalostí',
  'webhooks.create.success': 'Webhook bol úspešne vytvorený',
  'webhooks.create.back': 'Späť',
  'webhooks.create.form.submit': 'Vytvoriť webhook',
  'webhooks.create.form.name.label': 'Názov webhooku',
  'webhooks.create.form.name.placeholder': 'Zadajte názov webhooku',
  'webhooks.create.form.name.required': 'Názov je povinný',
  'webhooks.create.form.name.max-length': 'Názov môže mať najviac 128 znakov',
  'webhooks.create.form.url.label': 'URL webhooku',
  'webhooks.create.form.url.placeholder': 'Zadajte URL webhooku',
  'webhooks.create.form.url.required': 'URL je povinná',
  'webhooks.create.form.url.invalid': 'URL je neplatná',
  'webhooks.create.form.secret.label': 'Tajný kľúč',
  'webhooks.create.form.secret.placeholder': 'Zadajte tajný kľúč webhooku',
  'webhooks.create.form.events.label': 'Udalosti',
  'webhooks.create.form.events.required': 'Vyžaduje sa aspoň jedna udalosť',
  'webhooks.update.title': 'Upraviť webhook',
  'webhooks.update.description': 'Upravte podrobnosti svojho webhooku',
  'webhooks.update.success': 'Webhook bol úspešne aktualizovaný',
  'webhooks.update.submit': 'Aktualizovať webhook',
  'webhooks.update.cancel': 'Zrušiť',
  'webhooks.update.form.secret.placeholder': 'Zadajte nový tajný kľúč',
  'webhooks.update.form.secret.placeholder-redacted': '[Skrytý tajný kľúč]',
  'webhooks.update.form.rotate-secret.button': 'Obnoviť tajný kľúč',
  'webhooks.delete.success': 'Webhook bol úspešne odstránený',
  'webhooks.delete.confirm.title': 'Odstrániť webhook',
  'webhooks.delete.confirm.message': 'Naozaj chcete odstrániť tento webhook?',
  'webhooks.delete.confirm.confirm-button': 'Odstrániť',
  'webhooks.delete.confirm.cancel-button': 'Zrušiť',

  'webhooks.events.documents.title': 'Udalosti dokumentov',
  'webhooks.events.documents.document:created.description': 'Dokument vytvorený',
  'webhooks.events.documents.document:deleted.description': 'Dokument odstránený',
  'webhooks.events.documents.document:updated.description': 'Dokument aktualizovaný',
  'webhooks.events.documents.document:tag:added.description':
    'K dokumentu bol pridaný štítok',
  'webhooks.events.documents.document:tag:removed.description':
    'Z dokumentu bol odstránený štítok',

  // Navigation

  'layout.menu.home': 'Domov',
  'layout.menu.documents': 'Dokumenty',
  'layout.menu.tags': 'Štítky',
  'layout.menu.custom-properties': 'Vlastné polia',
  'layout.menu.tagging-rules': 'Pravidlá štítkovania',
  'layout.menu.share-links': 'Odkazy na zdieľanie',
  'layout.menu.deleted-documents': 'Odstránené dokumenty',
  'layout.menu.organization-settings': 'Nastavenia',
  'layout.menu.api-keys': 'API kľúče',
  'layout.menu.settings': 'Nastavenia',
  'layout.menu.account': 'Účet',
  'layout.menu.general-settings': 'Všeobecné nastavenia',
  'layout.menu.auto-tagging': 'Automatické štítkovanie',
  'layout.menu.usage': 'Využitie',
  'layout.menu.intake-emails': 'Prijímacie e-maily',
  'layout.menu.webhooks': 'Webhooky',
  'layout.menu.members': 'Členovia',
  'layout.menu.document-views': 'Zobrazenia',
  'layout.menu.invitations': 'Pozvánky',
  'layout.menu.admin': 'Administrácia',

  'layout.upgrade-cta.title': 'Potrebujete viac miesta?',
  'layout.upgrade-cta.description': 'Získajte 10× viac úložiska + tímovú spoluprácu',
  'layout.upgrade-cta.button': 'Prejsť na vyšší plán',

  'layout.theme.light': 'Svetlý režim',
  'layout.theme.dark': 'Tmavý režim',
  'layout.theme.system': 'Podľa systému',

  'layout.theme-switcher.label': 'Prepínač témy',
  'layout.language-switcher.label': 'Prepínač jazyka',

  'layout.search.placeholder': 'Rýchle vyhľadávanie',
  'layout.menu.import-document': 'Importovať dokument',

  'user-menu.trigger.label': 'Používateľské menu',
  'user-menu.account-settings': 'Nastavenia účtu',
  'user-menu.api-keys': 'API kľúče',
  'user-menu.invitations': 'Pozvánky',
  'user-menu.language': 'Jazyk',
  'user-menu.theme': 'Téma',
  'user-menu.about': 'O Papra',
  'user-menu.logout': 'Odhlásiť sa',

  // Command palette

  'command-palette.search.placeholder': 'Hľadajte príkazy alebo dokumenty',
  'command-palette.no-results': 'Nenašli sa žiadne výsledky',
  'command-palette.sections.documents': 'Dokumenty',
  'command-palette.sections.theme': 'Téma',
  'command-palette.show-more-results':
    'Zobraziť {{ count, =1:{count} ďalší výsledok, [2-4]:{count} ďalšie výsledky, {count} ďalších výsledkov }} pre „{{ query }}“',

  // API errors

  'api-errors.api.timeout':
    'Požiadavka trvala príliš dlho a vypršala. Skúste to znova.',
  'api-errors.document.already_exists': 'Dokument už existuje',
  'api-errors.document.size_too_large': 'Súbor je príliš veľký',
  'api-errors.intake-emails.already_exists':
    'Prijímací e-mail s touto adresou už existuje.',
  'api-errors.intake_email.limit_reached':
    'Bol dosiahnutý maximálny počet prijímacích e-mailov pre túto organizáciu. Na vytvorenie ďalších prejdite na vyšší plán.',
  'api-errors.user.max_organization_count_reached':
    'Dosiahli ste maximálny počet organizácií, ktoré môžete vytvoriť. Ak potrebujete vytvoriť ďalšie, kontaktujte podporu.',
  'api-errors.default': 'Pri spracovaní vašej požiadavky sa vyskytla chyba.',
  'api-errors.organization.invitation_already_exists':
    'Pozvánka pre tento e-mail už v tejto organizácii existuje.',
  'api-errors.user.already_in_organization': 'Tento používateľ už je v tejto organizácii.',
  'api-errors.user.organization_invitation_limit_reached':
    'Bol dosiahnutý maximálny počet pozvánok na dnešný deň. Skúste to znova zajtra.',
  'api-errors.demo.not_available': 'Táto funkcia nie je v deme dostupná',
  'api-errors.tags.already_exists':
    'Štítok s týmto názvom už v tejto organizácii existuje',
  'api-errors.tags.organization_limit_reached':
    'Bol dosiahnutý maximálny počet štítkov pre túto organizáciu.',
  'api-errors.internal.error':
    'Pri spracovaní vašej požiadavky sa vyskytla chyba. Skúste to znova neskôr.',
  'api-errors.auth.invalid_origin':
    'Neplatný pôvod aplikácie. Ak si Papra hostujete sami, uistite sa, že premenná prostredia APP_BASE_URL zodpovedá vašej aktuálnej URL. Viac informácií nájdete na https://docs.papra.app/resources/troubleshooting/#invalid-application-origin',
  'api-errors.organization.max_members_count_reached':
    'Bol dosiahnutý maximálny počet členov a čakajúcich pozvánok pre túto organizáciu. Na pridanie ďalších členov prejdite na vyšší plán.',
  'api-errors.organization.has_active_subscription':
    'Organizáciu s aktívnym predplatným nie je možné odstrániť. Najprv zrušte svoje predplatné pomocou tlačidla Spravovať predplatné vyššie.',
  'api-errors.webhooks.ssrf_unsafe_url':
    'Zadaná URL nie je povolená. URL webhookov nesmú smerovať na súkromné alebo rezervované IP adresy.',
  'api-errors.users.still_owns_organizations':
    'Tento používateľ stále vlastní jednu alebo viac organizácií. Pred odstránením používateľa tieto organizácie odstráňte.',
  'api-errors.plan_entitlements.already_exists':
    'Tento používateľ už má nárok tohto typu.',
  'api-errors.plan_entitlements.not_found': 'Nárok na plán sa nenašiel.',
  'api-errors.plan_entitlements.not_eligible':
    'Tento používateľ nemá na tento nárok právo.',
  'api-errors.users.cannot_delete_self':
    'Z administrátorského panela nemôžete odstrániť svoj vlastný účet.',
  // Better auth api errors
  'api-errors.USER_NOT_FOUND': 'Používateľ sa nenašiel',
  'api-errors.FAILED_TO_CREATE_USER': 'Nepodarilo sa vytvoriť používateľa',
  'api-errors.FAILED_TO_CREATE_SESSION': 'Nepodarilo sa vytvoriť reláciu',
  'api-errors.FAILED_TO_UPDATE_USER': 'Nepodarilo sa aktualizovať používateľa',
  'api-errors.FAILED_TO_GET_SESSION': 'Nepodarilo sa získať reláciu',
  'api-errors.INVALID_PASSWORD': 'Neplatné heslo',
  'api-errors.INVALID_EMAIL': 'Neplatný e-mail',
  'api-errors.INVALID_EMAIL_OR_PASSWORD':
    'E-mail alebo heslo je nesprávne, alebo účet neexistuje.',
  'api-errors.SOCIAL_ACCOUNT_ALREADY_LINKED': 'Sociálny účet je už prepojený',
  'api-errors.PROVIDER_NOT_FOUND': 'Poskytovateľ sa nenašiel',
  'api-errors.INVALID_TOKEN': 'Neplatný token',
  'api-errors.ID_TOKEN_NOT_SUPPORTED': 'ID token nie je podporovaný',
  'api-errors.FAILED_TO_GET_USER_INFO': 'Nepodarilo sa získať informácie o používateľovi',
  'api-errors.USER_EMAIL_NOT_FOUND': 'E-mail používateľa sa nenašiel',
  'api-errors.EMAIL_NOT_VERIFIED': 'E-mail nie je overený',
  'api-errors.PASSWORD_TOO_SHORT': 'Heslo je príliš krátke',
  'api-errors.PASSWORD_TOO_LONG': 'Heslo je príliš dlhé',
  'api-errors.USER_ALREADY_EXISTS': 'Používateľ s týmto e-mailom už existuje',
  'api-errors.EMAIL_CAN_NOT_BE_UPDATED': 'E-mail nie je možné zmeniť',
  'api-errors.CREDENTIAL_ACCOUNT_NOT_FOUND': 'Účet s prihlasovacími údajmi sa nenašiel',
  'api-errors.SESSION_EXPIRED': 'Relácia vypršala',
  'api-errors.FAILED_TO_UNLINK_LAST_ACCOUNT': 'Nepodarilo sa odpojiť posledný účet',
  'api-errors.ACCOUNT_NOT_FOUND': 'Účet sa nenašiel',
  'api-errors.USER_ALREADY_HAS_PASSWORD': 'Používateľ už má heslo',
  'api-errors.INVALID_CODE': 'Zadaný kód je neplatný alebo vypršal',
  'api-errors.OTP_NOT_ENABLED': 'Dvojfaktorové overenie nie je pre tento účet zapnuté',
  'api-errors.OTP_HAS_EXPIRED': 'Kód dvojfaktorového overenia vypršal',
  'api-errors.TOTP_NOT_ENABLED': 'TOTP nie je pre tento účet zapnuté',
  'api-errors.TWO_FACTOR_NOT_ENABLED':
    'Dvojfaktorové overenie nie je pre tento účet zapnuté',
  'api-errors.BACKUP_CODES_NOT_ENABLED': 'Záložné kódy nie sú pre tento účet zapnuté',
  'api-errors.INVALID_BACKUP_CODE':
    'Zadaný záložný kód je neplatný alebo už bol použitý',
  'api-errors.TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE':
    'Príliš veľa pokusov. Požiadajte o nový kód.',
  'api-errors.INVALID_TWO_FACTOR_COOKIE': 'Neplatný súbor cookie dvojfaktorového overenia',

  // Not found

  'not-found.title': '404 – Stránka sa nenašla',
  'not-found.description':
    'Ľutujeme, stránka, ktorú hľadáte, zrejme neexistuje. Skontrolujte URL a skúste to znova.',

  // Demo

  'demo.popup.description':
    'Toto je demo prostredie, všetky údaje sa ukladajú do lokálneho úložiska vášho prehliadača.',
  'demo.popup.discord':
    'Pridajte sa na {{ discordLink }}, kde získate podporu, môžete navrhovať funkcie alebo si len tak pokecať.',
  'demo.popup.discord-link-label': 'Discord server',
  'demo.popup.reset': 'Obnoviť demo údaje',
  'demo.popup.hide': 'Skryť',

  // Color picker

  'color-picker.hue': 'Odtieň',
  'color-picker.saturation': 'Sýtosť',
  'color-picker.lightness': 'Svetlosť',
  'color-picker.select-color': 'Vybrať farbu',
  'color-picker.select-a-color': 'Vyberte farbu',
  'color-picker.random-color': 'Náhodná farba',

  // Subscriptions

  'subscriptions.checkout-success.title': 'Platba prebehla úspešne!',
  'subscriptions.checkout-success.description':
    'Vaše predplatné bolo úspešne aktivované.',
  'subscriptions.checkout-success.thank-you':
    'Ďakujeme, že ste prešli na Papra Plus. Teraz máte prístup ku všetkým prémiovým funkciám.',
  'subscriptions.checkout-success.go-to-organizations': 'Prejsť na organizácie',
  'subscriptions.checkout-success.redirecting':
    'Presmerovanie o {{ count, =1:{count} sekundu, [2-4]:{count} sekundy, {count} sekúnd }}...',

  'subscriptions.checkout-cancel.title': 'Platba bola zrušená',
  'subscriptions.checkout-cancel.description': 'Prechod na vyššie predplatné bol zrušený.',
  'subscriptions.checkout-cancel.no-charges':
    'Z vášho účtu neboli strhnuté žiadne poplatky. Môžete to skúsiť znova, kedykoľvek budete pripravení.',
  'subscriptions.checkout-cancel.back-to-organizations': 'Späť na organizácie',
  'subscriptions.checkout-cancel.need-help': 'Potrebujete pomoc?',
  'subscriptions.checkout-cancel.contact-support': 'Kontaktovať podporu',

  'subscriptions.upgrade-dialog.title': 'Vylepšite túto organizáciu',
  'subscriptions.upgrade-dialog.description':
    'Odomknite výkonné funkcie pre svoju organizáciu',
  'subscriptions.upgrade-dialog.contact-us': 'Kontaktujte nás',
  'subscriptions.upgrade-dialog.enterprise-plans':
    'ak potrebujete vlastné firemné plány.',
  'subscriptions.upgrade-dialog.per-month': '/mesiac',
  'subscriptions.upgrade-dialog.billed-annually': '${{ price }} účtovaných ročne',
  'subscriptions.upgrade-dialog.upgrade-now': 'Prejsť na vyšší plán',
  'subscriptions.upgrade-dialog.promo-banner.title': 'Časovo obmedzená ponuka',
  'subscriptions.upgrade-dialog.promo-banner.description':
    'Ako skorý používateľ získajte navždy zľavu {{ percent }} % na všetky plány pre každú organizáciu! Ponuka vyprší o {{ days, =1:1 deň, [2-4]:{days} dni, >4:{days} dní, menej ako 1 deň }}.',

  'subscriptions.plan.free.name': 'Bezplatný plán',
  'subscriptions.plan.plus.name': 'Plus',
  'subscriptions.plan.pro.name': 'Pro',

  'subscriptions.features.storage-size': 'Veľkosť úložiska dokumentov',
  'subscriptions.features.members': 'Členovia organizácie',
  'subscriptions.features.members-count':
    '{{ count, =1:{count} člen, [2-4]:{count} členovia, {count} členov }}',
  'subscriptions.features.email-intakes': 'Prijímacie e-maily',
  'subscriptions.features.email-intakes-count-singular': '{{ count }} adresa',
  'subscriptions.features.email-intakes-count-plural':
    '{{ count, [2-4]:{count} adresy, {count} adries }}',
  'subscriptions.features.max-upload-size': 'Maximálna veľkosť nahrávaného súboru',
  'subscriptions.features.support': 'Podpora',
  'subscriptions.features.support-community': 'Komunitná podpora',
  'subscriptions.features.support-email': 'E-mailová podpora',
  'subscriptions.features.support-priority': 'Prioritná podpora',

  'subscriptions.billing-interval.monthly': 'Mesačne',
  'subscriptions.billing-interval.annual': 'Ročne',

  'subscriptions.usage-warning.message':
    'Využili ste {{ percent }} % svojho úložiska dokumentov. Zvážte prechod na vyšší plán, aby ste získali viac miesta.',
  'subscriptions.usage-warning.upgrade-button': 'Prejsť na vyšší plán',

  // Plan entitlements

  'plan-entitlements.claim.selfhst.title': 'Uplatnite si výhodu selfh.st Insider',
  'plan-entitlements.claim.selfhst.description':
    'Ako selfh.st Insider máte nárok na väčší bezplatný plán Papra: dvojnásobok úložiska dokumentov, prijímacích e-mailov a členov vo všetkých bezplatných organizáciách, ktoré vlastníte.',
  'plan-entitlements.claim.selfhst.email-notice':
    'Overíme, či má e-mail vášho účtu Papra {{ email }} aktívne členstvo selfh.st Insider.',
  'plan-entitlements.claim.selfhst.claim-button': 'Uplatniť výhodu',
  'plan-entitlements.claim.selfhst.success.title': 'Výhoda uplatnená!',
  'plan-entitlements.claim.selfhst.success.description':
    'Váš rozšírený bezplatný plán je teraz aktívny vo všetkých bezplatných organizáciách, ktoré vlastníte. Ďakujeme, že podporujete self-hosting ekosystém!',
  'plan-entitlements.claim.selfhst.already-claimed.title': 'Výhoda už bola uplatnená',
  'plan-entitlements.claim.selfhst.already-claimed.description':
    'Vaša výhoda selfh.st je na tomto účte už aktívna.',
  'plan-entitlements.claim.selfhst.errors.not-eligible':
    'Nenašli sme aktívne členstvo selfh.st Insider pre {{ email }}. Uistite sa, že váš účet Papra používa rovnaký e-mail ako váš účet selfh.st.',
  'plan-entitlements.claim.selfhst.errors.claims-disabled':
    'Uplatnenie tejto výhody je momentálne vypnuté. Skúste to znova neskôr.',
  'plan-entitlements.claim.selfhst.errors.rate-limited':
    'Príliš veľa pokusov. Skúste to znova neskôr.',
  'plan-entitlements.claim.selfhst.errors.generic':
    'Pri uplatňovaní výhody sa niečo pokazilo. Skúste to znova neskôr.',
  'plan-entitlements.claim.selfhst.go-to-app': 'Prejsť na vaše dokumenty',

  // Admin

  'admin.layout.header': 'Papra administrácia',
  'admin.layout.back-to-app': 'Späť do aplikácie',
  'admin.layout.menu.analytics': 'Analytika',
  'admin.layout.menu.users': 'Používatelia',
  'admin.layout.menu.organizations': 'Organizácie',

  'admin.analytics.title': 'Prehľad',
  'admin.analytics.description': 'Prehľady a analytika používania Papra.',
  'admin.analytics.user-count': 'Počet používateľov',
  'admin.analytics.organization-count': 'Počet organizácií',
  'admin.analytics.document-count': 'Počet dokumentov',
  'admin.analytics.documents-storage': 'Úložisko dokumentov',
  'admin.analytics.deleted-documents': 'Odstránené dokumenty',
  'admin.analytics.deleted-storage': 'Odstránené úložisko',

  'admin.organizations.title': 'Správa organizácií',
  'admin.organizations.description':
    'Spravujte a prezerajte všetky organizácie v systéme',
  'admin.organizations.search-placeholder': 'Hľadať podľa názvu alebo ID...',
  'admin.organizations.loading': 'Načítavajú sa organizácie...',
  'admin.organizations.no-results':
    'Nenašli sa žiadne organizácie zodpovedajúce vášmu vyhľadávaniu.',
  'admin.organizations.empty': 'Nenašli sa žiadne organizácie.',
  'admin.organizations.table.id': 'ID',
  'admin.organizations.table.name': 'Názov',
  'admin.organizations.table.members': 'Členovia',
  'admin.organizations.table.created': 'Vytvorené',
  'admin.organizations.table.updated': 'Aktualizované',
  'admin.organizations.pagination.info':
    'Zobrazuje sa {{ start }} až {{ end }} z {{ total }} {{ total, =1:organizácie, organizácií }}',
  'admin.organizations.pagination.page-info': 'Strana {{ current }} z {{ total }}',

  'admin.organization-detail.title': 'Podrobnosti organizácie',
  'admin.organization-detail.back': 'Späť na organizácie',
  'admin.organization-detail.loading.info': 'Načítavajú sa informácie o organizácii...',
  'admin.organization-detail.loading.stats': 'Načítavajú sa štatistiky...',
  'admin.organization-detail.loading.intake-emails': 'Načítavajú sa prijímacie e-maily...',
  'admin.organization-detail.loading.webhooks': 'Načítavajú sa webhooky...',
  'admin.organization-detail.loading.members': 'Načítavajú sa členovia...',
  'admin.organization-detail.basic-info.title': 'Informácie o organizácii',
  'admin.organization-detail.basic-info.description': 'Základné údaje organizácie',
  'admin.organization-detail.basic-info.id': 'ID',
  'admin.organization-detail.basic-info.name': 'Názov',
  'admin.organization-detail.basic-info.created': 'Vytvorené',
  'admin.organization-detail.basic-info.updated': 'Aktualizované',
  'admin.organization-detail.members.title': 'Členovia ({{ count }})',
  'admin.organization-detail.members.description':
    'Používatelia, ktorí patria do tejto organizácie',
  'admin.organization-detail.members.empty': 'Nenašli sa žiadni členovia',
  'admin.organization-detail.members.table.user': 'Používateľ',
  'admin.organization-detail.members.table.id': 'ID',
  'admin.organization-detail.members.table.role': 'Rola',
  'admin.organization-detail.members.table.joined': 'Pridal sa',
  'admin.organization-detail.intake-emails.title': 'Prijímacie e-maily ({{ count }})',
  'admin.organization-detail.intake-emails.description':
    'E-mailové adresy na prijímanie dokumentov',
  'admin.organization-detail.intake-emails.empty':
    'Nie sú nakonfigurované žiadne prijímacie e-maily',
  'admin.organization-detail.intake-emails.status.enabled': 'Zapnutý',
  'admin.organization-detail.intake-emails.status.disabled': 'Vypnutý',
  'admin.organization-detail.intake-emails.badge.active': 'Aktívny',
  'admin.organization-detail.intake-emails.badge.inactive': 'Neaktívny',
  'admin.organization-detail.webhooks.title': 'Webhooky ({{ count }})',
  'admin.organization-detail.webhooks.description': 'Nakonfigurované webhooky',
  'admin.organization-detail.webhooks.empty': 'Nie sú nakonfigurované žiadne webhooky',
  'admin.organization-detail.webhooks.badge.active': 'Aktívny',
  'admin.organization-detail.webhooks.badge.inactive': 'Neaktívny',
  'admin.organization-detail.stats.title': 'Štatistiky využitia',
  'admin.organization-detail.stats.description': 'Štatistiky dokumentov a úložiska',
  'admin.organization-detail.stats.active-documents': 'Aktívne dokumenty',
  'admin.organization-detail.stats.active-storage': 'Aktívne úložisko',
  'admin.organization-detail.stats.deleted-documents': 'Odstránené dokumenty',
  'admin.organization-detail.stats.deleted-storage': 'Odstránené úložisko',
  'admin.organization-detail.stats.total-documents': 'Dokumenty celkom',
  'admin.organization-detail.stats.total-storage': 'Úložisko celkom',

  'admin.users.title': 'Správa používateľov',
  'admin.users.description': 'Spravujte a prezerajte všetkých používateľov v systéme',
  'admin.users.search-placeholder': 'Hľadať podľa mena, e-mailu alebo ID...',
  'admin.users.loading': 'Načítavajú sa používatelia...',
  'admin.users.no-results':
    'Nenašli sa žiadni používatelia zodpovedajúci vášmu vyhľadávaniu.',
  'admin.users.empty': 'Nenašli sa žiadni používatelia.',
  'admin.users.table.user': 'Používateľ',
  'admin.users.table.id': 'ID',
  'admin.users.table.status': 'Stav',
  'admin.users.table.status.verified': 'Overený',
  'admin.users.table.status.unverified': 'Neoverený',
  'admin.users.table.orgs': 'Organizácie',
  'admin.users.table.created': 'Vytvorený',
  'admin.users.pagination.info':
    'Zobrazuje sa {{ start }} až {{ end }} z {{ total }} {{ total, =1:používateľa, používateľov }}',
  'admin.users.pagination.page-info': 'Strana {{ current }} z {{ total }}',

  'admin.user-detail.back': 'Späť na používateľov',
  'admin.user-detail.loading': 'Načítavajú sa podrobnosti používateľa...',
  'admin.user-detail.unnamed': 'Používateľ bez mena',
  'admin.user-detail.basic-info.title': 'Informácie o používateľovi',
  'admin.user-detail.basic-info.description':
    'Základné údaje o používateľovi a jeho účte',
  'admin.user-detail.basic-info.user-id': 'ID používateľa',
  'admin.user-detail.basic-info.email': 'E-mail',
  'admin.user-detail.basic-info.name': 'Meno',
  'admin.user-detail.basic-info.name-empty': '-',
  'admin.user-detail.basic-info.email-verified': 'E-mail overený',
  'admin.user-detail.basic-info.email-verified.yes': 'Áno',
  'admin.user-detail.basic-info.email-verified.no': 'Nie',
  'admin.user-detail.basic-info.max-organizations': 'Max. počet organizácií',
  'admin.user-detail.basic-info.max-organizations.unlimited': 'Neobmedzené',
  'admin.user-detail.basic-info.created': 'Vytvorený',
  'admin.user-detail.basic-info.updated': 'Naposledy aktualizovaný',
  'admin.user-detail.roles.title': 'Roly a oprávnenia',
  'admin.user-detail.roles.description': 'Roly a úrovne prístupu používateľa',
  'admin.user-detail.roles.empty': 'Žiadne priradené roly',
  'admin.user-detail.organizations.title': 'Organizácie ({{ count }})',
  'admin.user-detail.organizations.description':
    'Organizácie, do ktorých tento používateľ patrí',
  'admin.user-detail.organizations.empty': 'Nie je členom žiadnej organizácie',
  'admin.user-detail.organizations.table.id': 'ID',
  'admin.user-detail.organizations.table.name': 'Názov',
  'admin.user-detail.organizations.table.created': 'Vytvorené',
  'admin.user-detail.plan-entitlements.title': 'Nároky na plán',
  'admin.user-detail.plan-entitlements.description':
    'Nároky, ktoré vylepšujú plán organizácií, ktoré tento používateľ vlastní',
  'admin.user-detail.plan-entitlements.empty': 'Žiadne nároky na plán',
  'admin.user-detail.plan-entitlements.table.type': 'Typ',
  'admin.user-detail.plan-entitlements.table.source': 'Zdroj',
  'admin.user-detail.plan-entitlements.table.granted': 'Udelený',
  'admin.user-detail.plan-entitlements.table.expires': 'Vyprší',
  'admin.user-detail.plan-entitlements.never-expires': 'Nikdy',
  'admin.user-detail.plan-entitlements.expired': 'Vypršaný',
  'admin.user-detail.plan-entitlements.grant.button': 'Udeliť nárok',
  'admin.user-detail.plan-entitlements.grant.title': 'Udeliť nárok na plán',
  'admin.user-detail.plan-entitlements.grant.description':
    'Udeľte tomuto používateľovi nárok na plán, voliteľne s dátumom vypršania.',
  'admin.user-detail.plan-entitlements.grant.type-label': 'Typ nároku',
  'admin.user-detail.plan-entitlements.grant.expiration.toggle': 'Nastaviť dátum vypršania',
  'admin.user-detail.plan-entitlements.grant.expiration.pick-date': 'Vyberte dátum',
  'admin.user-detail.plan-entitlements.grant.submit': 'Udeliť nárok',
  'admin.user-detail.plan-entitlements.grant.cancel': 'Zrušiť',
  'admin.user-detail.plan-entitlements.grant.success': 'Nárok bol úspešne udelený.',
  'admin.user-detail.plan-entitlements.revoke.button': 'Odobrať',
  'admin.user-detail.plan-entitlements.revoke.confirm.title': 'Odobrať nárok?',
  'admin.user-detail.plan-entitlements.revoke.confirm.message':
    'Používateľ stratí výhody plánu udelené týmto nárokom.',
  'admin.user-detail.plan-entitlements.revoke.confirm.confirm-button': 'Odobrať nárok',
  'admin.user-detail.plan-entitlements.revoke.confirm.cancel-button': 'Zrušiť',
  'admin.user-detail.plan-entitlements.revoke.success': 'Nárok bol úspešne odobraný.',
  'admin.user-detail.delete.title': 'Odstrániť používateľa',
  'admin.user-detail.delete.description':
    'Trvalo odstráni účet tohto používateľa. Odstránia sa aj jeho členstvá v organizáciách, relácie, nastavenia dvojfaktorového overenia a ďalšie autentifikačné údaje. Organizácie, ktoré stále vlastní, musia byť najprv odstránené alebo prevedené.',
  'admin.user-detail.delete.button': 'Odstrániť používateľa',
  'admin.user-detail.delete.self-warning':
    'Z administrátorského panela nemôžete odstrániť svoj vlastný účet.',
  'admin.user-detail.delete.confirm.title': 'Odstrániť používateľa?',
  'admin.user-detail.delete.confirm.message':
    'Túto akciu nie je možné vrátiť späť. Na potvrdenie napíšte nižšie e-mail používateľa.',
  'admin.user-detail.delete.confirm.confirm-button': 'Odstrániť používateľa',
  'admin.user-detail.delete.confirm.cancel-button': 'Zrušiť',
  'admin.user-detail.delete.success': 'Používateľ bol úspešne odstránený.',

  // Common / Shared

  'common.confirm-modal.type-to-confirm': 'Na potvrdenie napíšte „{{ text }}“',
  'common.tables.rows-per-page': 'Riadkov na stránku',
  'common.tables.pagination-info': 'Strana {{ currentPage }} z {{ totalPages }}',
  'common.tables.first-page': 'Prejsť na prvú stránku',
  'common.tables.previous-page': 'Prejsť na predchádzajúcu stránku',
  'common.tables.next-page': 'Prejsť na nasledujúcu stránku',
  'common.tables.last-page': 'Prejsť na poslednú stránku',
  'common.back-to-home': 'Späť na domovskú stránku',

  // About page

  'about.title': 'O Papra',
  'about.version': 'Verzia',
  'about.git-commit': 'Git commit',
  'about.commit-date': 'Dátum commitu',
  'about.description':
    'Papra je open-source systém na správu dokumentov, ktorý vám pomáha jednoducho archivovať, organizovať, štítkovať a spravovať vaše dokumenty.',
  'about.links.title': 'Odkazy',
  'about.links.documentation': 'Dokumentácia',
  'about.links.documentation-description': 'Používateľské príručky a referencia API',
  'about.links.github': 'GitHub',
  'about.links.github-description': 'Zdrojový kód a hlásenie chýb',
  'about.links.discord': 'Discord komunita',
  'about.links.discord-description': 'Pridajte sa do našej komunity',
  'about.links.sponsor': 'Sponzorstvo',
  'about.links.sponsor-description': 'Podporte vývoj Papra',

  'config.server-unreachable.title': 'Server je nedostupný',
  'config.server-unreachable.description':
    'Server sa zdá byť nedostupný. Ak si Papra hostujete sami, uistite sa, že server beží a je správne nakonfigurovaný. Viac informácií môžete nájsť v konzole.',
  'config.server-unreachable.retry': 'Skúsiť znova',
  'config.server-unreachable.retry-error.title': 'Server je stále nedostupný',
  'config.server-unreachable.retry-error.description':
    'Server zostáva nedostupný, skúste to znova neskôr.',

  'coming-soon.title': 'Už čoskoro',
  'coming-soon.description': 'Táto funkcia bude čoskoro dostupná, skúste to neskôr.',

  'socials.bluesky': 'Bluesky',
  'socials.mastodon': 'Mastodon',
  'socials.x': 'X',
  'socials.reddit': 'Reddit',
  'socials.linkedin': 'LinkedIn',
};
