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
  (tabs)/
    _layout.tsx            # Tab layout using CustomTabBar
    index.tsx              # Dashboard — weekly stats + recent activities
    history.tsx            # Activity history with filter pills
    videos.tsx             # Journey videos list
    profile.tsx            # Profile + settings

context/
  ActivityContext.tsx      # Shared state: activities array, AsyncStorage persistence, seeded sample data

components/
  Icon.tsx                 # SVG icon wrapper mapping Ionicons names to lucide-react-native components
  CustomTabBar.tsx         # Inline 5-slot tab bar: Dashboard, History, FAB (record), Videos, Profile

constants/
  colors.ts                # Design tokens (primary #6D9E51, bg #EAEFEF, text #262626, trace #982598, accent #088395)

modules/
  react-native-maps.web.tsx  # Web stub for react-native-maps (native-only, needs polyfill on web)

metro.config.js            # Resolves react-native-maps to web stub on platform=web
```

### Key Design Decisions
- **Color scheme**: primary `#6D9E51` (forest green), background `#EAEFEF`, trace `#982598` (purple GPS trail), accent `#088395` (teal)
- **react-native-maps**: pinned to exactly `1.18.0` (only version compatible with Expo Go). NOT in plugins array in app.json. Web stub provided via metro `resolveRequest`.
- **expo-location**: no web support — `navigator.geolocation` used on web, `expo-location` on native
- **Activity types**: run, cycle, hike, walk
- **Recording screen**: launches as `fullScreenModal` with full-screen OSM map, floating stats card (bottom-left), vertical dots menu (bottom-right), custom bottom nav with Stop/Pause/History/Videos/Profile
- **UUID pattern**: `Date.now().toString() + Math.random().toString(36).slice(2, 7)` (no uuid package)

### Icons
- **`lucide-react-native`** — SVG-based icons (replaced `@expo/vector-icons` Ionicons which had font-name case-sensitivity issues on Android Fabric/New Architecture)
- `components/Icon.tsx` maps Ionicons-style names (e.g. `"play"`, `"map-outline"`) to Lucide SVG components
- `@expo/vector-icons` has been removed from the project

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

## Workflows
- `artifacts/gps-tracker: expo` — Expo dev server for the mobile app

## Fonts
Inter (400, 500, 600, 700) via `@expo-google-fonts/inter`, loaded in `_layout.tsx` with SplashScreen gating.
