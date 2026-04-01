# Journey — GPS Activity Tracker

A React Native (Expo) mobile app for recording outdoor activities with GPS. Think of it as a Relive.cc alternative: it tracks runs, rides, hikes, and walks, then lets you replay your route as a 3D journey video.

---

## What it does

- Records GPS coordinates, speed, elevation, and pace in real time
- Shows a live map trace while you're moving
- Saves each activity with stats (distance, duration, avg speed, elevation gain)
- Dashboard with weekly progress toward a distance goal
- Activity history with filters by type
- Journey video generation per activity

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Navigation | Expo Router (file-based) |
| Maps | `react-native-maps` 1.18.0 (pinned) |
| Location | `expo-location` (native) / `navigator.geolocation` (web) |
| Icons | `lucide-react-native` (SVG, no font dependencies) |
| Storage | `@react-native-async-storage/async-storage` |
| Gradients | `expo-linear-gradient` |
| Fonts | Inter via `@expo-google-fonts/inter` |
| Package manager | pnpm (workspace monorepo) |

---

## Project structure

```
artifacts/gps-tracker/        ← the mobile app lives here
  app/
    _layout.tsx               root layout (providers, fonts, splash gate)
    recording.tsx             full-screen recording screen (modal)
    (tabs)/
      index.tsx               Dashboard — weekly stats + recent activities
      history.tsx             Activity history with filter pills
      videos.tsx              Journey videos list
      profile.tsx             Profile & settings

  context/
    ActivityContext.tsx       global state: activity list, AsyncStorage persistence

  components/
    Icon.tsx                  maps icon name strings → lucide-react-native SVGs
    CustomTabBar.tsx          5-slot tab bar with centered gradient record FAB

  constants/
    colors.ts                 design tokens

  modules/
    react-native-maps.web.tsx web stub for react-native-maps (native-only package)

  metro.config.js             routes the web stub on platform=web
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [Expo Go](https://expo.dev/client) app on your phone (iOS or Android)

### 1. Clone the repo

```bash
git clone https://github.com/rubel-sh/relivee-journey.git
cd relivee-journey
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development server

```bash
pnpm --filter @workspace/gps-tracker run dev
```

This starts Metro Bundler and prints a QR code in the terminal.

### 4. Open on your phone

Scan the QR code with:
- **iOS** — the built-in Camera app
- **Android** — the Expo Go app

The app will load over your local network. Hot reload is enabled, so edits to any source file update the app instantly.

### 5. Open in a web browser (optional)

After the server starts, press `w` in the terminal to open the web preview. Note that GPS recording falls back to the browser's Geolocation API on web, and the map is stubbed out (react-native-maps is native only).

---

## Key development notes

### react-native-maps is pinned to 1.18.0

Do **not** upgrade this package. Version 1.18.0 is the last one compatible with Expo Go without a custom dev build. If you need a newer version you will need to build a custom Expo development client.

### Icons

Icons go through `components/Icon.tsx` which maps Ionicons-style name strings to Lucide SVG components. If you need a new icon:

1. Find the Lucide equivalent at [lucide.dev](https://lucide.dev)
2. Import it from `lucide-react-native` in `Icon.tsx`
3. Add the mapping entry

Do not use `@expo/vector-icons` — it was removed because of font-loading issues on Android with the New Architecture.

### SVG in cards

When drawing inside `react-native-svg`, only use `Path`, `Circle`, and `Rect`. Do **not** use `Defs`, `LinearGradient` (from SVG), or `Stop` — they conflict with `expo-linear-gradient`'s import and crash on web.

### Activity data

On first launch (or whenever storage is empty) the app seeds four sample activities so you have something to look at before recording your first real one. Sample data lives in `context/ActivityContext.tsx` under `SAMPLE_ACTIVITIES`.

---

## Color palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#6D9E51` | Buttons, active tabs, FAB |
| Background | `#EAEFEF` | App background |
| Text | `#262626` | Body text |
| GPS trace | `#982598` | Route line on map |
| Accent | `#088395` | Secondary highlights |
| Card | `#FFFFFF` | Card backgrounds |

---

## Running on a physical device without Wi-Fi

Use a tunnel:

```bash
pnpm --filter @workspace/gps-tracker exec expo start --tunnel
```

This requires `@expo/ngrok` to be installed globally: `npm install -g @expo/ngrok`.

---

## Building for production

This project uses Expo Go for development. For a production build you will need an [Expo account](https://expo.dev) and EAS CLI:

```bash
npm install -g eas-cli
eas build --platform android   # or ios
```

See the [Expo EAS Build docs](https://docs.expo.dev/build/introduction/) for full setup including app signing.
