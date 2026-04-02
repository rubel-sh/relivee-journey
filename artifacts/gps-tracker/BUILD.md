# Journey - Build Instructions

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- EAS CLI (`npm install -g eas-cli`)
- Expo account (free at https://expo.dev)

## Clone & Install

```bash
git clone https://github.com/rubel-sh/relivee-journey.git
cd relivee-journey
pnpm install
cd artifacts/gps-tracker
```

## Build APK (Android)

### Option 1: Cloud Build (No Android SDK needed)

```bash
eas login
eas build --platform android --profile preview
```

This builds an APK on Expo's cloud servers. Once complete, you'll get a download link. Install the APK on your Android device.

### Option 2: Local Build (Requires Android SDK + Java 17)

```bash
eas build --platform android --profile preview --local
```

The APK will be output to the current directory.

### Option 3: Production AAB (For Google Play Store)

```bash
eas build --platform android --profile production
```

This generates an Android App Bundle (.aab) for Play Store submission.

## Build Profiles

| Profile       | Output | Use Case                        |
|---------------|--------|---------------------------------|
| `preview`     | APK    | Direct install on device        |
| `production`  | AAB    | Google Play Store upload        |
| `development` | APK    | Dev build with dev client       |

## Run in Development

```bash
pnpm dev
```

Scan the QR code with Expo Go on your phone to test without building.

## iOS Build

```bash
eas build --platform ios --profile production
```

Requires an Apple Developer account ($99/year).
