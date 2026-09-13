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

Mobile releases are built by GitHub Actions when Changesets publishes a new `@papra/mobile` version. The workflow attaches two signed artifacts and their SHA-256 checksums to the package's GitHub release:

- An APK for direct installation on Android devices.
- An AAB for manual upload to Google Play Console.

The release workflow requires the `EXPO_TOKEN` repository secret and Android signing credentials configured in EAS. Builds use the exact `@papra/mobile@<version>` tag rather than the latest commit on `main`.

To perform the same builds manually, run the profiles in this order so both artifacts reuse the same remotely managed Android `versionCode`:

```sh
pnpm eas build --platform android --profile production
pnpm eas build --platform android --profile release-apk
```
