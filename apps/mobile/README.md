# Papra Mobile App

React Native mobile application for Papra document management platform, built with Expo.

## Local development

Run `pnpm android` or `pnpm ios` from this directory to install **Papra Dev** alongside the store app. Development builds use separate application IDs (`app.papra.android.dev` / `app.papra.ios.dev`), app data, and the `papra-dev` URL scheme to avoid authentication callbacks opening the store app. `pnpm start` also selects the development variant, as does the EAS `development` profile. Production and preview builds retain the store app's identity.

If you already have generated native projects, regenerate them once before running the development app:

```sh
APP_VARIANT=development pnpm exec expo prebuild --clean --platform android
pnpm android
```

For iOS, use `--platform ios` and `pnpm ios` instead. `--clean` replaces the generated native project, so preserve any manual native changes first. Regenerate again whenever switching between development and production variants; Expo does not automatically update existing native projects when the application ID changes.

The server must trust `papra-dev://` for development app authentication, including when testing against production. This is included in the server defaults. If `TRUSTED_APP_SCHEMES` is explicitly configured, it overrides those defaults; add the development scheme while preserving any other trusted schemes:

```sh
TRUSTED_APP_SCHEMES=papra://,exp://,papra-dev://
```

Deploy/restart the server after changing its configuration. If you previously built the development app with the `papra` scheme, regenerate and rebuild its native project using the commands above.

## Android release

```
pnpm eas build --platform android --profile production
```
