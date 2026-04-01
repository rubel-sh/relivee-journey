# Journey GPS Tracker

A React Native Expo mobile app for GPS activity tracking — a competitor to Relive.cc. Records GPS coordinates, movement speed, elevation, and generates 3D journey videos.

## Architecture

### Artifacts
- **gps-tracker** (`artifacts/gps-tracker/`) — Expo React Native app (mobile + web preview)
- **api-server** (`artifacts/api-server/`) — Express API server (scaffold, not used by tracker)

### App Structure (gps-tracker)
```
app/
  _layout.tsx              # Root layout: providers (ActivityProvider, QueryClient, SafeArea, etc.)
  recording.tsx            # Full-screen recording screen (full-screen modal)
  activity/[id].tsx        # Activity detail screen with route SVG + stats
  video-replay/[id].tsx    # Video replay screen — WebView + Leaflet.js + OpenStreetMap
  generate-video/[id].tsx  # 3D video generation screen — Three.js + OSM tiles + MediaRecorder (accepts resolution/fps/speed/orientation query params)
  (tabs)/
    _layout.tsx            # Tab layout using CustomTabBar
    index.tsx              # Dashboard — weekly stats + recent activities
    history.tsx            # Activity history with filter pills + video generated indicators
    videos.tsx             # Journey Videos — generated 3D videos + replay cards with generate buttons
    profile.tsx            # Profile + settings

context/
  ActivityContext.tsx      # Shared state: activities array, AsyncStorage persistence, seeded sample data
  VideoContext.tsx         # Generated video management: metadata, file paths, AsyncStorage persistence

components/
  Icon.tsx                 # SVG icon wrapper mapping Ionicons names to lucide-react-native components
  CustomTabBar.tsx         # Inline 5-slot tab bar: Dashboard, History, FAB (record), Videos, Profile
  VideoOptionsModal.tsx    # Reusable bottom sheet modal for video settings (resolution, fps, speed, orientation)
  replay-template.ts       # HTML template for Leaflet.js route replay on OpenStreetMap tiles
  video-generator-template.ts # Three.js HTML template for 3D flyover video generation (configurable W/H/FPS/speed)

constants/
  colors.ts                # Design tokens (primary #6D9E51, bg #EAEFEF, text #262626, trace #982598, accent #088395)

modules/
  react-native-maps.web.tsx    # Web stub for react-native-maps
  react-native-webview.web.tsx # Web stub for react-native-webview (renders iframe)

metro.config.js            # Resolves native-only modules to web stubs (maps, webview)
```

### Key Design Decisions
- **Color scheme**: primary `#6D9E51` (forest green), background `#EAEFEF`, trace `#982598` (purple GPS trail), accent `#088395` (teal)
- **react-native-maps**: pinned to exactly `1.18.0` (only version compatible with Expo Go). NOT in plugins array in app.json. Web stub provided via metro `resolveRequest`.
- **expo-location**: no web support — `navigator.geolocation` used on web, `expo-location` on native
- **Activity types**: run, cycle, hike, walk
- **Recording screen**: launches as `fullScreenModal` with full-screen OSM map, floating stats card (bottom-left), vertical dots menu (bottom-right), custom bottom nav with Stop/Lap/Pause/Pin/Lock
- **Video replay**: WebView with inline HTML (Leaflet.js + OpenStreetMap tiles). Animates GPS route progressively with moving marker, camera follow, speed controls (1x/2x/4x/8x), live stats overlay. On web uses iframe with srcDoc.
- **3D video generation**: On-device video generation using Three.js in a WebView. Renders 3D flyover of GPS route over OpenStreetMap tiles with camera animation, route tube geometry, start/end markers, fog, and lighting. MediaRecorder captures WebGL canvas as WebM video. Video data transferred to RN via base64 postMessage chunks, saved with expo-file-system. Only works on native devices (WebView needed for Three.js + MediaRecorder).
- **UUID pattern**: `Date.now().toString() + Math.random().toString(36).slice(2, 7)` (no uuid package)

### Icons
- **`lucide-react-native`** — SVG-based icons (replaced `@expo/vector-icons` Ionicons which had font-name case-sensitivity issues on Android Fabric/New Architecture)
- `components/Icon.tsx` maps Ionicons-style names (e.g. `"play"`, `"map-outline"`) to Lucide SVG components
- `@expo/vector-icons` has been removed from the project

### NativeWind v4 (Styling)
- **NativeWind v4** (`nativewind@4.2.3`) + **tailwindcss v3** (v3 is required — NativeWind v4 does NOT support tailwindcss v4)
- `react-native-css-interop` must be a **direct** dependency (pnpm doesn't hoist transitive deps, Metro can't resolve it otherwise)
- `tailwind.config.js` — custom colors (`primary`, `accent`, `trace`, etc.) + custom font families (`inter-regular/medium/semibold/bold`)
- `global.css` — imported as first line of `app/_layout.tsx`
- `babel.config.js` — `jsxImportSource: "nativewind"` in babel-preset-expo + `"nativewind/babel"` preset
- `metro.config.js` — wrapped with `withNativeWind(config, { input: "./global.css" })`
- `nativewind-env.d.ts` — `/// <reference types="nativewind/types" />` referenced in `tsconfig.json`
- **Hybrid pattern**: static layout/spacing/typography → `className`; dynamic theme colors from `useColors()` + computed sizes → `style` prop; Animated transforms → must stay `style` (native driver)
- SVG elements (`Path`, `Circle`, `Rect`) don't accept `className` — keep as style props
- Font families: `className="font-inter-bold"` → `fontFamily: 'Inter_700Bold'` (configured in tailwind.config.js)

### Dependencies (notable)
- `expo ~54.0.27`
- `react-native 0.81.5`
- `react-native-maps 1.18.0` (pinned)
- `lucide-react-native ^1.7.0` (SVG icons)
- `react-native-svg 15.12.1` (required by lucide)
- `expo-location ~19.0.8`
- `expo-linear-gradient ~15.0.8`
- `@react-native-async-storage/async-storage 2.2.0`
- `expo-haptics ~15.0.8`
- `react-native-webview 14.0.3` (for video replay and 3D generation WebViews)
- `expo-file-system ~19.0.21` (saving generated video files on device)
- `nativewind 4.2.3` (utility-first CSS for React Native)
- `tailwindcss 3.x` (NativeWind v4 requires v3, NOT v4)
- `react-native-css-interop ^0.2.3` (direct dep — needed by NativeWind, not auto-hoisted by pnpm)

## GitHub Mirror
- **Repo**: https://github.com/rubel-sh/relivee-journey
- **Remote name**: `github` (configured in `.git/config`)
- **Push script**: `scripts/push-github.mjs` — requires `GITHUB_TOKEN` env var
- The Replit GitHub integration (`conn_github_01KN3ZBS4VDW044HPJJ0V0WXEK`) is connected and provides the access token
- The agent pushes after each session by fetching a fresh token via the GitHub connection and running `git push github main`

## Workflows
- `artifacts/gps-tracker: expo` — Expo dev server for the mobile app

## Fonts
Inter (400, 500, 600, 700) via `@expo-google-fonts/inter`, loaded in `_layout.tsx` with SplashScreen gating.
