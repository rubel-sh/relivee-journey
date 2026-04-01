import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface Activity {
  id: string;
  type: "run" | "cycle" | "hike" | "walk";
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  elevationGain: number;
  coordinates: Coordinate[];
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Activity) => Promise<void>;
  clearActivities: () => Promise<void>;
}

const STORAGE_KEY = "@journey_activities_v2";

const now = Date.now();

const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: "sample-1",
    type: "run",
    startTime: now - 86400000,
    endTime: now - 86400000 + 1694000,
    duration: 1694,
    distance: 5240,
    maxSpeed: 14.8,
    avgSpeed: 11.1,
    elevationGain: 64,
    coordinates: [
      { latitude: 48.2048, longitude: 16.3688 },
      { latitude: 48.2069, longitude: 16.373 },
      { latitude: 48.2092, longitude: 16.3765 },
      { latitude: 48.212, longitude: 16.3823 },
      { latitude: 48.2098, longitude: 16.3854 },
    ],
  },
  {
    id: "sample-2",
    type: "cycle",
    startTime: now - 2 * 86400000,
    endTime: now - 2 * 86400000 + 3150000,
    duration: 3150,
    distance: 18600,
    maxSpeed: 34.2,
    avgSpeed: 21.3,
    elevationGain: 120,
    coordinates: [
      { latitude: 48.198, longitude: 16.345 },
      { latitude: 48.208, longitude: 16.365 },
      { latitude: 48.22, longitude: 16.39 },
      { latitude: 48.235, longitude: 16.41 },
    ],
  },
  {
    id: "sample-3",
    type: "hike",
    startTime: now - 4 * 86400000,
    endTime: now - 4 * 86400000 + 8280000,
    duration: 8280,
    distance: 12100,
    maxSpeed: 8.4,
    avgSpeed: 5.3,
    elevationGain: 480,
    coordinates: [
      { latitude: 48.15, longitude: 16.28 },
      { latitude: 48.168, longitude: 16.3 },
      { latitude: 48.185, longitude: 16.32 },
      { latitude: 48.21, longitude: 16.36 },
    ],
  },
  {
    id: "sample-4",
    type: "run",
    startTime: now - 5 * 86400000,
    endTime: now - 5 * 86400000 + 1560000,
    duration: 1560,
    distance: 4800,
    maxSpeed: 12.5,
    avgSpeed: 10.8,
    elevationGain: 35,
    coordinates: [
      { latitude: 48.21, longitude: 16.37 },
      { latitude: 48.205, longitude: 16.36 },
      { latitude: 48.2, longitude: 16.35 },
    ],
  },
];

const ActivityContext = createContext<ActivityContextType>({
  activities: [],
  addActivity: async () => {},
  clearActivities: async () => {},
});

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Activity[];
          if (parsed.length > 0) {
            setActivities(parsed);
            return;
          }
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ACTIVITIES));
        setActivities(SAMPLE_ACTIVITIES);
      } catch (e) {
        console.warn("Failed to load activities:", e);
      }
    })();
  }, []);

  const addActivity = useCallback(
    async (activity: Activity) => {
      const updated = [activity, ...activities];
      setActivities(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save activity:", e);
      }
    },
    [activities]
  );

  const clearActivities = useCallback(async () => {
    setActivities([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear activities:", e);
    }
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  return useContext(ActivityContext);
}
