# Contributing to Journey GPS Tracker

Welcome! This guide covers everything you need to start building features, fixing bugs, and contributing to **Journey** — a GPS activity tracking app built with React Native / Expo.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Getting Started](#getting-started)
5. [App Architecture](#app-architecture)
6. [Screens & Navigation](#screens--navigation)
7. [Styling System](#styling-system)
8. [Icon System](#icon-system)
9. [Data Layer](#data-layer)
10. [Recording Flow](#recording-flow)
11. [Maps & Web Compatibility](#maps--web-compatibility)
12. [Adding a New Feature (Step-by-Step)](#adding-a-new-feature-step-by-step)
13. [Adding a New Screen](#adding-a-new-screen)
14. [Adding a New Icon](#adding-a-new-icon)
15. [Common Patterns](#common-patterns)
16. [Critical Gotchas](#critical-gotchas)
17. [Git Workflow](#git-workflow)

---

## Project Overview

Journey is a **Relive.cc competitor** — a mobile-first GPS activity tracker that records running, cycling, hiking, and walking activities. It tracks GPS coordinates, speed, elevation, and generates visual route summaries. No sign-in required.

**Key features:**
- Real-time GPS recording with live map, pace, and elevation
- Activity history with filtering and detailed stats
- SVG route visualizations (no map tiles needed for previews)
- Custom animated bottom bar during recording (Stop / Lap / Pause / Pin / Lock)
- Four main tabs: Dashboard, History, Videos, Profile

---

## Tech Stack

| Layer | Technology | Version |
|:------|:-----------|:--------|
| Framework | Expo SDK | 54 |
| UI | React Native | 0.81 |
| Navigation | expo-router (file-based) | 6.x |
| Styling | NativeWind (Tailwind for RN) | 4.x |
| Icons | lucide-react-native | 1.7.0 |
| Maps | react-native-maps | 1.18.0 (pinned) |
| Fonts | @expo-google-fonts/inter | — |
| Storage | @react-native-async-storage | — |
| SVG | react-native-svg | — |
| Animations | Animated API (RN built-in) | — |
| Haptics | expo-haptics | — |
| Location | expo-location | — |
| Package Manager | pnpm (workspace) | — |

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── gps-tracker/          # <-- THE MAIN MOBILE APP
│   │   ├── app/              # Screens (expo-router file-based routing)
│   │   │   ├── (tabs)/       # Tab navigator screens
│   │   │   │   ├── _layout.tsx    # Tab bar configuration
│   │   │   │   ├── index.tsx      # Dashboard tab
│   │   │   │   ├── history.tsx    # History tab
│   │   │   │   ├── videos.tsx     # Videos tab (placeholder)
│   │   │   │   └── profile.tsx    # Profile tab
│   │   │   ├── activity/
│   │   │   │   └── [id].tsx       # Activity detail (dynamic route)
│   │   │   ├── recording.tsx      # Full-screen recording modal
│   │   │   └── _layout.tsx        # Root stack navigator
│   │   ├── components/       # Reusable UI components
│   │   │   ├── CustomTabBar.tsx   # Bottom tab bar with gradient FAB
│   │   │   └── Icon.tsx           # Icon wrapper (lucide-react-native)
│   │   ├── constants/
│   │   │   └── colors.ts         # Color palette tokens
│   │   ├── context/
│   │   │   └── ActivityContext.tsx # Global state (activities + persistence)
│   │   ├── hooks/
│   │   │   └── useColors.ts      # Theme color hook
│   │   ├── modules/
│   │   │   └── react-native-maps.web.tsx  # Web stub for maps
│   │   ├── app.json              # Expo configuration
│   │   ├── metro.config.js       # Metro bundler config (web stubs, NativeWind)
│   │   ├── babel.config.js       # Babel config (NativeWind plugin)
│   │   ├── tailwind.config.js    # Tailwind/NativeWind theme
│   │   ├── global.css            # Tailwind directives
│   │   └── package.json
│   ├── api-server/           # Express.js backend (not used by mobile yet)
│   └── mockup-sandbox/       # Vite-based component preview sandbox
├── lib/
│   ├── api-spec/             # OpenAPI spec (source of truth for API)
│   ├── api-zod/              # Generated Zod validation schemas
│   ├── api-client-react/     # Generated TanStack Query hooks
│   └── db/                   # Drizzle ORM database layer
├── pnpm-workspace.yaml       # Workspace definition
└── package.json              # Root scripts
```

> **Important:** Almost all mobile app work happens inside `artifacts/gps-tracker/`.

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo Go app on your phone (Android or iOS)
  - **SDK 54 requires Expo Go v2.32.0+** — update from Play Store / App Store

### Install & Run

```bash
# Clone the repo
git clone https://github.com/rubel-sh/relivee-journey.git
cd relivee-journey

# Install all dependencies
pnpm install

# Start the development server
pnpm --filter @workspace/gps-tracker run dev
```

### Testing on Device
1. Open Expo Go on your phone
2. Scan the QR code shown in the terminal
3. The app will load over your local network

### Testing on Web
The app also runs in the browser (with map stubs). Open the URL shown as "Web is waiting on..." in the terminal output.

---

## App Architecture

### Navigation (expo-router)

```
Stack Navigator (_layout.tsx)
├── (tabs)/                    # Bottom tab navigator
│   ├── index        →  Dashboard
│   ├── history      →  History
│   ├── videos       →  Videos
│   └── profile      →  Profile
├── recording        →  Full-screen recording modal
└── activity/[id]    →  Activity detail screen
```

The root `_layout.tsx` wraps everything in `<ActivityProvider>` (global state) and loads fonts before rendering.

### State Management

No Redux or Zustand — the app uses a single React Context (`ActivityContext`) with AsyncStorage persistence. This keeps things simple while supporting offline-first behavior.

---

## Screens & Navigation

| Screen | File | Purpose |
|:-------|:-----|:--------|
| Dashboard | `app/(tabs)/index.tsx` | Weekly stats card + recent activity grid |
| History | `app/(tabs)/history.tsx` | Filterable list of all activities |
| Videos | `app/(tabs)/videos.tsx` | Placeholder for future 3D video feature |
| Profile | `app/(tabs)/profile.tsx` | User stats and settings |
| Recording | `app/recording.tsx` | Full-screen GPS recording with live map |
| Activity Detail | `app/activity/[id].tsx` | Route SVG, stats (pace, calories, elevation) |

### Custom Tab Bar

The `CustomTabBar` component (`components/CustomTabBar.tsx`) replaces the default tab bar. It features a centered **gradient FAB** (play button) that navigates to `/recording`.

---

## Styling System

### NativeWind (Tailwind for React Native)

The app uses **NativeWind v4** — Tailwind CSS classes via the `className` prop.

```tsx
// Static layout uses className
<View className="flex-1 items-center justify-center px-4">
  <Text className="text-lg font-inter-bold text-foreground">Hello</Text>
</View>
```

### When to Use `style` vs `className`

| Use Case | Approach |
|:---------|:---------|
| Static layout, spacing, typography | `className` (Tailwind) |
| Dynamic/computed values | `style` prop |
| Colors from theme hook | `style={{ color: colors.primary }}` |
| Animated transforms | `style` prop (required by Animated API) |
| SVG elements | `style` prop (NativeWind doesn't work on SVG) |

### Color Tokens

All colors are defined in two places that must stay in sync:

**`tailwind.config.js`** (for `className` usage):
```
primary:     #6D9E51    (green — brand color)
background:  #EAEFEF    (light gray page background)
foreground:  #262626    (primary text)
card:        #FFFFFF    (card backgrounds)
muted:       #E2EAEA    (muted backgrounds)
muted-fg:    #8A9A9A    (secondary text)
accent:      #088395    (teal — highlights)
trace:       #982598    (purple — route trace color)
destructive: #FF4444    (red — delete actions)
border:      #D8E2E2    (borders and dividers)
```

**`constants/colors.ts`** (for `style` prop / `useColors()` hook):
```ts
const colors = useColors();
// colors.primary, colors.background, colors.card, etc.
```

### Fonts

The app uses **Inter** in four weights. Use these Tailwind classes:

```
font-inter-regular     (400)
font-inter-medium      (500)
font-inter-semibold    (600)
font-inter-bold        (700)
```

### Border Radius

The project uses `radius: 16` as the standard card radius. Use `rounded-2xl` (16px) for cards and containers.

---

## Icon System

Icons are managed through a centralized wrapper at `components/Icon.tsx`.

### Usage

```tsx
import { Icon } from "@/components/Icon";

<Icon name="play" size={24} color="#FFFFFF" />
<Icon name="flame" size={16} color={colors.primary} />
```

### Available Icon Names

| Name | Visual | Name | Visual |
|:-----|:-------|:-----|:-------|
| `play` | Play | `pause` | Pause |
| `square` | Stop | `flag-outline` | Flag |
| `navigate` | Navigation | `location-outline` | Map Pin |
| `map-outline` | Map | `bicycle` | Bicycle |
| `walk` | Walking | `footsteps` | Footprints |
| `flame` | Flame | `trending-up` | Trend Up |
| `time-outline` | Clock | `timer-outline` | Timer |
| `calendar` | Calendar | `check` | Checkmark |
| `arrow-back` | Back Arrow | `chevron-down` | Chevron Down |
| `trash-outline` | Delete | `share-outline` | Share |
| `lock` | Lock | `unlock` | Unlock |
| `person-outline` | User | `flash` | Lightning |
| `close` / `x` | Close | `bar-chart` | Chart |
| `notifications-outline` | Bell | `moon-outline` | Moon |
| `videocam` | Video | `cloud-upload-outline` | Upload |
| `trail-sign` | Sign | `alert-circle` | Alert |

### Adding a New Icon

1. Check if the icon exists in [`lucide-react-native` v1.7.0](https://lucide.dev/icons/) — search by name
2. Import the **exact** Lucide export name in `components/Icon.tsx`
3. Add a friendly alias to the `ICON_MAP` object
4. Use it anywhere with `<Icon name="your-alias" />`

```tsx
// In Icon.tsx — add import:
import { HeartPulse } from "lucide-react-native";

// Add to ICON_MAP:
"heartbeat": HeartPulse,
"heartbeat-outline": HeartPulse,
```

> **Warning:** Always verify the icon exists in `lucide-react-native@1.7.0`. Not all icons on the Lucide website exist in every version. Importing a non-existent icon will crash the Android bundle silently.

---

## Data Layer

### Activity Interface

```ts
interface Activity {
  id: string;                              // UUID
  type: "run" | "cycle" | "hike" | "walk"; // Activity category
  startTime: number;                       // Unix timestamp (ms)
  endTime: number;                         // Unix timestamp (ms)
  duration: number;                        // Seconds
  distance: number;                        // Meters
  maxSpeed: number;                        // km/h
  avgSpeed: number;                        // km/h
  elevationGain: number;                   // Meters
  coordinates: Coordinate[];               // GPS trace
}

interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}
```

### ActivityContext API

```ts
const { activities, addActivity, deleteActivity, clearActivities } = useActivities();
```

| Method | Description |
|:-------|:------------|
| `activities` | Array of all saved activities |
| `addActivity(activity)` | Save a new activity (persists to AsyncStorage) |
| `deleteActivity(id)` | Remove by ID (persists) |
| `clearActivities()` | Delete all activities (persists) |

Data is persisted under the AsyncStorage key `@journey_activities_v2`. On first launch, sample activities are loaded so the app isn't empty.

---

## Recording Flow

The recording screen (`app/recording.tsx`) handles the full GPS tracking lifecycle:

1. **Setup Phase** — User picks activity type (Run / Cycle / Hike / Walk) from a 2×2 grid
2. **Active Recording** — Live map with GPS tracking:
   - `expo-location` `watchPositionAsync` streams coordinates
   - `haversine()` function calculates cumulative distance
   - `setInterval` tracks elapsed time
   - `MapView` shows live path via `<Polyline>`
3. **Bottom Action Bar** — Five actions during recording:
   - **Stop** — Saves activity and returns to dashboard
   - **Lap** — Records split time with flash toast notification
   - **Pause/Resume** — Central FAB with gradient background
   - **Pin** — Drops a map waypoint at current location
   - **Lock** — Full-screen lock overlay (prevents accidental touches)
4. **Completion** — `addActivity()` saves to context/storage, navigates back

### Activity Type Config

Each type has a gradient color pair and icon:

```ts
const TYPE_CONFIG = {
  run:   { gradient: ["#6D9E51", "#4A7A2E"], icon: "footsteps" },
  cycle: { gradient: ["#088395", "#066A78"], icon: "bicycle" },
  hike:  { gradient: ["#982598", "#6B1A6B"], icon: "trail-sign" },
  walk:  { gradient: ["#E8853D", "#C96B2A"], icon: "walk" },
};
```

---

## Maps & Web Compatibility

### react-native-maps

The app uses `react-native-maps@1.18.0`. **Do not upgrade** — newer versions have compatibility issues.

### Web Stub

Since `react-native-maps` is native-only, a web stub exists at `modules/react-native-maps.web.tsx`. Metro's config (`metro.config.js`) automatically swaps the import on web:

```js
// metro.config.js
if (moduleName === "react-native-maps" && platform === "web") {
  return {
    filePath: path.resolve(__dirname, "modules/react-native-maps.web.tsx"),
    type: "sourceFile",
  };
}
```

The stub renders a green placeholder `<View>` instead of a real map. `Polyline`, `Circle`, and `Marker` render as `null` on web.

> **If you add a new export from `react-native-maps`** (like `Callout`, `Heatmap`, etc.), you **must** also add a stub export in `modules/react-native-maps.web.tsx` or the web build will crash.

---

## Adding a New Feature (Step-by-Step)

Here's a concrete example: **adding a "calories burned" stat to the dashboard**.

### 1. Update the Data Model (if needed)

If your feature needs new data, update `context/ActivityContext.tsx`:

```ts
export interface Activity {
  // ... existing fields
  calories?: number;  // Add new optional field
}
```

### 2. Create or Update Components

Build reusable pieces in `components/`:

```tsx
// components/CaloriesBadge.tsx
import { View, Text } from "react-native";
import { Icon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";

type Props = { calories: number };

export function CaloriesBadge({ calories }: Props) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.muted }}>
      <Icon name="flame" size={14} color={colors.primary} />
      <Text className="text-sm font-inter-semibold" style={{ color: colors.foreground }}>
        {calories} kcal
      </Text>
    </View>
  );
}
```

### 3. Integrate into Screens

Import and use your component in the appropriate screen file under `app/`.

### 4. Test on All Platforms

- **Web**: Check the browser preview (maps will show as green stubs)
- **Android/iOS**: Scan QR code with Expo Go
- Test both light layout and different activity types

---

## Adding a New Screen

### As a New Tab

1. Create the file: `app/(tabs)/yourscreen.tsx`
2. Export a default component
3. Register it in `app/(tabs)/_layout.tsx`:
   ```tsx
   <Tabs.Screen name="yourscreen" options={{ title: "Your Screen" }} />
   ```
4. Add a tab icon in `CustomTabBar.tsx`

### As a Modal/Stack Screen

1. Create the file: `app/yourscreen.tsx`
2. Register it in `app/_layout.tsx`:
   ```tsx
   <Stack.Screen name="yourscreen" options={{ headerShown: false, presentation: "modal" }} />
   ```
3. Navigate to it: `router.push("/yourscreen")`

### As a Dynamic Route

1. Create: `app/yourmodel/[id].tsx`
2. Access params: `const { id } = useLocalSearchParams<{ id: string }>()`
3. Navigate: `router.push(`/yourmodel/${item.id}`)`

---

## Common Patterns

### Haptic Feedback

Every button tap should include haptic feedback:

```tsx
import * as Haptics from "expo-haptics";

// Light tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap (standard buttons)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success notification (completing an action)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### SVG Route Thumbnails

Activities display route previews using `react-native-svg` instead of map tiles. The pattern normalizes GPS coordinates into SVG path coordinates and draws them with quadratic Bezier curves. See `app/(tabs)/index.tsx` for the implementation.

### Animated Values

The project uses React Native's built-in `Animated` API (not Reanimated) for most animations:

```tsx
const scale = useRef(new Animated.Value(1)).current;

Animated.spring(scale, {
  toValue: 1.2,
  useNativeDriver: true,
}).start();
```

> **Rule:** Animated transforms must always use the `style` prop, never `className`.

### Safe Area Insets

All screens account for notches and system bars:

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();
// Use insets.top, insets.bottom for padding
```

---

## Critical Gotchas

### 1. react-native-maps Version Lock
`react-native-maps` must stay at **1.18.0**. Do not upgrade.

### 2. NativeWind + Tailwind CSS Version
NativeWind v4 requires **tailwindcss v3** (NOT v4). The `react-native-css-interop` package must be a direct dependency.

### 3. Icon Import Verification
Always verify an icon exists in `lucide-react-native@1.7.0` before importing. A missing named import will crash the Android bundle with a cryptic `java.io.IOException` error. Check the package directly:
```bash
ls node_modules/lucide-react-native/dist/cjs/icons/ | grep "your-icon-name"
```

### 4. Web Stub Maintenance
When importing new components from `react-native-maps`, add matching stub exports to `modules/react-native-maps.web.tsx`.

### 5. NativeWind Hybrid Styling
- Static layout → `className` (Tailwind classes)
- Dynamic colors, computed sizes → `style` prop
- SVG elements → only `style` prop works
- Animated transforms → must use `style` prop

### 6. State Updater Purity
React state updater functions (inside `setState(prev => ...)`) should be pure. Do not call other setState, haptics, or setTimeout inside them.

### 7. Expo Go Version
SDK 54 requires **Expo Go v2.32.0+**. If the app fails to load on a device with "failed to download remote update," update Expo Go first.

---

## Git Workflow

### Branch Naming
```
feature/short-description
fix/issue-description
```

### Commit Messages
Follow conventional commits:
```
feat: add calories tracking to dashboard
fix: correct icon import for lock screen
refactor: extract route SVG into reusable component
```

### Before Pushing
1. Test on web (browser preview)
2. Test on device (Expo Go)
3. Verify no TypeScript errors: `pnpm --filter @workspace/gps-tracker run typecheck`
4. Verify all new `react-native-maps` imports have web stubs
5. Verify all new icon imports exist in `lucide-react-native@1.7.0`

---

## Need Help?

- **Expo docs**: https://docs.expo.dev/
- **NativeWind docs**: https://www.nativewind.dev/
- **Lucide icons**: https://lucide.dev/icons/
- **expo-router docs**: https://docs.expo.dev/router/introduction/
- **react-native-maps**: https://github.com/react-native-maps/react-native-maps

Happy building!
