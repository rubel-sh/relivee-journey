import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "journey_location_cache";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

let memoryCache: Record<string, string> = {};
let cacheLoaded = false;
const inflight: Record<string, Promise<string>> = {};
let lastRequestTime = 0;
const MIN_DELAY_MS = 1100;

async function loadCache() {
  if (cacheLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) memoryCache = JSON.parse(raw);
  } catch {}
  cacheLoaded = true;
}

async function saveCache() {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {}
}

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

async function throttledFetch(lat: number, lon: number): Promise<string> {
  const now = Date.now();
  const wait = Math.max(0, lastRequestTime + MIN_DELAY_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();

  const res = await fetch(
    `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
    { headers: { "User-Agent": "JourneyGPSTracker/1.0" } }
  );

  if (!res.ok) {
    throw new Error(`Geocode ${res.status}`);
  }

  const data = await res.json();
  const addr = data.address || {};
  return (
    addr.suburb ||
    addr.neighbourhood ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    addr.city ||
    addr.county ||
    data.display_name?.split(",")[0] ||
    "Unknown"
  );
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = cacheKey(lat, lon);
  await loadCache();
  if (memoryCache[key]) return memoryCache[key];

  if (inflight[key]) return inflight[key];

  const promise = throttledFetch(lat, lon)
    .then((name) => {
      memoryCache[key] = name;
      saveCache();
      return name;
    })
    .catch(() => "Unknown")
    .finally(() => {
      delete inflight[key];
    });

  inflight[key] = promise;
  return promise;
}

export function useLocationName(lat?: number, lon?: number): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;
    reverseGeocode(lat, lon).then((n) => {
      if (!cancelled) setName(n);
    });
    return () => { cancelled = true; };
  }, [lat, lon]);

  return name;
}

export function useStartEndLocations(
  startLat?: number,
  startLon?: number,
  endLat?: number,
  endLon?: number
): { startName: string | null; endName: string | null } {
  const startName = useLocationName(startLat, startLon);
  const endName = useLocationName(endLat, endLon);
  return { startName, endName };
}
