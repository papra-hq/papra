# Papra Mobile App

React Native mobile application for Papra document management platform, built with Expo.

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
