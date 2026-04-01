import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView, { Polyline, Circle, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import VideoOptionsModal, { VideoOptions } from "@/components/VideoOptionsModal";
import { Activity, Coordinate, useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const INITIAL_REGION = {
  latitude: 48.2082,
  longitude: 16.3738,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const NUM_ITEMS = 4;
const STAGGER_MS = 55;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 180;

type ActivityType = Activity["type"];
type RecordingPhase = "setup" | "active";

const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: string; gradient: [string, string]; color: string }
> = {
  run:   { label: "Run",   icon: "walk",       gradient: ["#A8C97F", "#6D9E51"], color: "#6D9E51" },
  cycle: { label: "Cycle", icon: "bicycle",    gradient: ["#5BB8C8", "#088395"], color: "#088395" },
  hike:  { label: "Hike",  icon: "trail-sign", gradient: ["#C8A86B", "#8B6914"], color: "#8B6914" },
  walk:  { label: "Walk",  icon: "footsteps",  gradient: ["#9BB5B5", "#5B7070"], color: "#5B7070" },
};

export default function RecordingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useActivities();

  const [phase, setPhase] = useState<RecordingPhase>("setup");
  const [activityType, setActivityType] = useState<ActivityType>("run");

  const [coords, setCoords] = useState<Coordinate[]>([]);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [elevGain, setElevGain] = useState(0);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [followMap, setFollowMap] = useState(true);
  const [laps, setLaps] = useState<Array<{ duration: number; distance: number }>>([]);
  const [pins, setPins] = useState<Coordinate[]>([]);
  const [screenLocked, setScreenLocked] = useState(false);
  const [lapFlash, setLapFlash] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const [savedActivityId, setSavedActivityId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locSubRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchRef = useRef<number | null>(null);
  const lastAltRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const pausedRef = useRef(false);
  const lapFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRotate = useRef(new Animated.Value(0)).current;
  const triggerScale = useRef(new Animated.Value(1)).current;
  const itemAnims = useRef(
    Array.from({ length: NUM_ITEMS }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(40),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  const animateMenu = (open: boolean) => {
    const dur = open ? OPEN_DURATION : CLOSE_DURATION;

    Animated.timing(triggerRotate, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(triggerScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(triggerScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    if (open) {
      Animated.stagger(
        STAGGER_MS,
        itemAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(anim.translateX, { toValue: 0, duration: dur, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
            Animated.timing(anim.scale, { toValue: 1, duration: dur, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
          ])
        )
      ).start();
    } else {
      Animated.stagger(
        STAGGER_MS,
        [...itemAnims].reverse().map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 0, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(anim.translateX, { toValue: 40, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(anim.scale, { toValue: 0.8, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ])
        )
      ).start(() => { if (!open) setMenuOpen(false); });
    }
  };

  const handleMenuToggle = () => {
    if (!menuOpen) { setMenuOpen(true); animateMenu(true); }
    else { animateMenu(false); }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerRotateDeg = triggerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  useEffect(() => { return () => stopAll(); }, []);

  const startTracking = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setDuration((d) => d + 1);
    }, 1000);

    if (Platform.OS === "web") {
      if (navigator.geolocation) {
        webWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => handleNewPosition(
            pos.coords.latitude, pos.coords.longitude,
            pos.coords.altitude ?? undefined,
            (pos.coords.speed ?? 0) * 3.6
          ),
          undefined,
          { enableHighAccuracy: true }
        );
      }
    } else {
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 3 },
        (loc) => handleNewPosition(
          loc.coords.latitude, loc.coords.longitude,
          loc.coords.altitude ?? undefined,
          (loc.coords.speed ?? 0) * 3.6
        )
      ).then((sub) => { locSubRef.current = sub; });
    }
  };

  const handleNewPosition = (lat: number, lon: number, alt: number | undefined, speedKmh: number) => {
    if (pausedRef.current) return;
    const newCoord: Coordinate = { latitude: lat, longitude: lon, altitude: alt };

    setCoords((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        setDistance((pd) => pd + haversine(last.latitude, last.longitude, lat, lon));
      }
      return [...prev, newCoord];
    });

    const spd = Math.max(0, speedKmh);
    setCurrentSpeed(spd);
    setMaxSpeed((prev) => Math.max(prev, spd));

    if (alt !== undefined && lastAltRef.current !== null) {
      const diff = alt - lastAltRef.current;
      if (diff > 0) setElevGain((prev) => prev + diff);
    }
    if (alt !== undefined) lastAltRef.current = alt;

    if (followMap) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lon, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        600
      );
    }
  };

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (locSubRef.current) locSubRef.current.remove();
    if (webWatchRef.current !== null) navigator.geolocation?.clearWatch(webWatchRef.current);
  };

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== "web") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
    }
    setPhase("active");
    startTracking();
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleMarkLap = () => {
    setLaps((prev) => {
      const lapNum = prev.length + 1;
      const lapDist = distance / 1000;
      const lapLabel = `Lap ${lapNum}  ·  ${formatDuration(duration)}  ·  ${lapDist.toFixed(2)} km`;
      setLapFlash(lapLabel);
      if (lapFlashTimeout.current) clearTimeout(lapFlashTimeout.current);
      lapFlashTimeout.current = setTimeout(() => setLapFlash(null), 3000);
      return [...prev, { duration, distance }];
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDropPin = () => {
    setCoords((c) => {
      if (c.length > 0) {
        const last = c[c.length - 1];
        setPins((p) => [...p, last]);
        setLapFlash(`📍 Pin dropped`);
        if (lapFlashTimeout.current) clearTimeout(lapFlashTimeout.current);
        lapFlashTimeout.current = setTimeout(() => setLapFlash(null), 2000);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return c;
    });
  };

  const handleLockToggle = () => {
    setScreenLocked((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleStop = () => {
    stopAll();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const actId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const activity: Activity = {
      id: actId,
      type: activityType,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      duration,
      distance,
      maxSpeed: Math.max(maxSpeed, 0.1),
      avgSpeed: duration > 0 ? (distance / 1000) / (duration / 3600) : 0,
      elevationGain: Math.round(elevGain),
      coordinates: coords.length > 0 ? coords : [INITIAL_REGION],
    };
    addActivity(activity);
    setSavedActivityId(actId);
    setShowSaveModal(true);
  };

  const handleSaveOnly = () => {
    setShowSaveModal(false);
    router.back();
  };

  const handleGenerateFromModal = () => {
    setShowSaveModal(false);
    setShowVideoOptions(true);
  };

  const handleVideoGenerate = (options: VideoOptions) => {
    setShowVideoOptions(false);
    if (savedActivityId) {
      const params = new URLSearchParams({
        resolution: options.resolution,
        fps: String(options.fps),
        speed: String(options.speed),
        orientation: options.orientation,
      });
      router.replace(`/generate-video/${savedActivityId}?${params.toString()}` as any);
    }
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : insets.bottom;
  const cfg = TYPE_CONFIG[activityType];

  // ─── SETUP PHASE ─────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View
          className="flex-row items-center px-4 pb-4"
          style={{ paddingTop: topPad + 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}
        >
          <TouchableOpacity className="p-1 mr-3" onPress={() => router.back()}>
            <Icon name="chevron-down" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-[22px] font-inter-bold" style={{ color: colors.foreground }}>New Activity</Text>
            <Text className="text-[13px] font-inter-regular" style={{ color: colors.mutedForeground }}>Choose your activity type</Text>
          </View>
        </View>

        {/* Type picker grid */}
        <View className="flex-1 p-5 gap-3">
          <View className="flex-row gap-3">
            {(["run", "cycle"] as ActivityType[]).map((type) => {
              const c = TYPE_CONFIG[type];
              const selected = activityType === type;
              return (
                <TouchableOpacity
                  key={type}
                  className="flex-1 rounded-2xl overflow-hidden"
                  style={{ borderWidth: 2.5, borderColor: selected ? c.color : "transparent" }}
                  onPress={() => { setActivityType(type); Haptics.selectionAsync(); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={c.gradient}
                    className="items-center justify-center py-8 gap-3"
                  >
                    {selected && (
                      <View className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 items-center justify-center">
                        <Icon name="checkmark" size={14} color="white" />
                      </View>
                    )}
                    <Icon name={c.icon} size={40} color="white" />
                    <Text className="text-white text-lg font-inter-bold">{c.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-row gap-3">
            {(["hike", "walk"] as ActivityType[]).map((type) => {
              const c = TYPE_CONFIG[type];
              const selected = activityType === type;
              return (
                <TouchableOpacity
                  key={type}
                  className="flex-1 rounded-2xl overflow-hidden"
                  style={{ borderWidth: 2.5, borderColor: selected ? c.color : "transparent" }}
                  onPress={() => { setActivityType(type); Haptics.selectionAsync(); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={c.gradient}
                    className="items-center justify-center py-8 gap-3"
                  >
                    {selected && (
                      <View className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 items-center justify-center">
                        <Icon name="checkmark" size={14} color="white" />
                      </View>
                    )}
                    <Icon name={c.icon} size={40} color="white" />
                    <Text className="text-white text-lg font-inter-bold">{c.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* GPS info strip */}
          <View
            className="flex-row items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: `${colors.accent}12` }}
          >
            <Icon name="navigate" size={16} color={colors.accent} />
            <Text className="flex-1 text-[13px] font-inter-regular" style={{ color: colors.accent }}>
              {Platform.OS === "web"
                ? "GPS will use browser location"
                : "GPS will request precise location access"}
            </Text>
          </View>
        </View>

        {/* Start button */}
        <View className="px-5" style={{ paddingBottom: botPad + 16 }}>
          <TouchableOpacity
            className="rounded-2xl overflow-hidden"
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={cfg.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center gap-3 py-4"
            >
              <Icon name="navigate" size={22} color="white" />
              <Text className="text-white text-lg font-inter-bold">Start {cfg.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── ACTIVE PHASE ─────────────────────────────────────────────────────────────
  const mapCoords = coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));
  const lastCoord = coords.length > 0 ? coords[coords.length - 1] : null;
  const firstCoord = coords.length > 0 ? coords[0] : null;

  const menuItems = [
    { icon: paused ? "play" : "pause", label: paused ? "Resume" : "Pause", accent: colors.primary, onPress: handlePause },
    { icon: "square", label: "Stop", accent: colors.destructive, onPress: handleStop },
    { icon: "flag-outline", label: "Mark Lap", accent: colors.accent, onPress: () => Haptics.selectionAsync() },
    { icon: "location-outline", label: "Drop Pin", accent: colors.trace, onPress: () => Haptics.selectionAsync() },
  ];

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        zoomControlEnabled={false}
        toolbarEnabled={false}
        onPanDrag={() => setFollowMap(false)}
      >
        {mapCoords.length > 1 && (
          <Polyline
            coordinates={mapCoords}
            strokeColor={cfg.color}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {firstCoord && (
          <Circle
            center={{ latitude: firstCoord.latitude, longitude: firstCoord.longitude }}
            radius={12}
            fillColor={cfg.color}
            strokeColor="white"
            strokeWidth={2}
          />
        )}
        {lastCoord && (
          <Circle
            center={{ latitude: lastCoord.latitude, longitude: lastCoord.longitude }}
            radius={20}
            fillColor={`${cfg.color}30`}
            strokeColor="transparent"
            strokeWidth={0}
          />
        )}
        {pins.map((pin, i) => (
          <Circle
            key={`pin-${i}`}
            center={{ latitude: pin.latitude, longitude: pin.longitude }}
            radius={16}
            fillColor="#088395cc"
            strokeColor="white"
            strokeWidth={2}
          />
        ))}
      </MapView>

      {/* Top bar */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-4 pb-2.5 z-10"
        style={{ paddingTop: topPad, backgroundColor: "rgba(255,255,255,0.88)" }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Icon name="chevron-down" size={24} color="#262626" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <LinearGradient colors={cfg.gradient} className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full">
            <Icon name={cfg.icon} size={12} color="white" />
            <Text className="text-white text-[12px] font-inter-semibold">{cfg.label}</Text>
          </LinearGradient>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: paused ? "#FFB800" : "#FF4444" }} />
            <Text className="text-[13px] font-inter-bold" style={{ color: paused ? "#FFB800" : "#FF4444" }}>
              {paused ? "PAUSED" : "RECORDING"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1 bg-[rgba(8,131,149,0.12)] px-2 py-1 rounded-[10px]">
          <Icon name="navigate" size={11} color="#088395" />
          <Text className="text-[11px] font-inter-semibold text-accent">GPS</Text>
        </View>
      </View>

      {/* Re-center button (shows when map panned away) */}
      {!followMap && (
        <TouchableOpacity
          className="absolute z-10 right-3 bg-white rounded-xl px-3 py-2 flex-row items-center gap-1.5"
          style={{ top: topPad + 56, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}
          onPress={() => {
            setFollowMap(true);
            if (lastCoord) {
              mapRef.current?.animateToRegion(
                { latitude: lastCoord.latitude, longitude: lastCoord.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
                600
              );
            }
          }}
        >
          <Icon name="navigate" size={14} color={cfg.color} />
          <Text className="text-[12px] font-inter-semibold" style={{ color: cfg.color }}>Re-center</Text>
        </TouchableOpacity>
      )}

      {/* Stats card */}
      <View
        className="absolute left-3 rounded-[18px] p-3.5 min-w-[200px] z-10"
        style={{
          bottom: botPad + 80,
          backgroundColor: "rgba(255,255,255,0.93)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text className="text-[32px] font-inter-bold text-foreground mb-2">
          {formatDuration(duration)}
          <Text className="text-[13px] text-[#aaa] font-inter-regular"> duration</Text>
        </Text>
        <View className="flex-row gap-3 mb-2">
          <View className="flex-row items-center gap-[3px]">
            <Icon name="map-outline" size={12} color={cfg.color} />
            <Text className="text-sm font-inter-bold text-foreground">{(distance / 1000).toFixed(2)}</Text>
            <Text className="text-[11px] text-[#999] font-inter-regular">km</Text>
          </View>
          <View className="flex-row items-center gap-[3px]">
            <Icon name="flash-outline" size={12} color={colors.accent} />
            <Text className="text-sm font-inter-bold text-foreground">{currentSpeed.toFixed(1)}</Text>
            <Text className="text-[11px] text-[#999] font-inter-regular">km/h</Text>
          </View>
          <View className="flex-row items-center gap-[3px]">
            <Icon name="trending-up-outline" size={12} color={colors.trace} />
            <Text className="text-sm font-inter-bold text-foreground">+{Math.round(elevGain)}</Text>
            <Text className="text-[11px] text-[#999] font-inter-regular">m</Text>
          </View>
        </View>
        <View className="flex-row gap-3 border-t pt-2" style={{ borderTopColor: "#F0F0F0" }}>
          <View className="flex-row items-center gap-[3px]">
            <Icon name="flash" size={11} color={cfg.color} />
            <Text className="text-[11px] font-inter-medium text-[#666]">{maxSpeed.toFixed(1)} km/h max</Text>
          </View>
          <View className="flex-row items-center gap-[3px]">
            <Icon name="videocam-outline" size={11} color={colors.trace} />
            <Text className="text-[11px] font-inter-medium text-[#666]">4K · 60fps</Text>
          </View>
        </View>
      </View>

      {/* Backdrop to close menu */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={handleMenuToggle}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>
      )}

      {/* Radial action menu */}
      <View className="absolute right-3 items-end gap-2.5 z-20" style={{ bottom: botPad + 80, elevation: 20 }}>
        {menuOpen && (
          <View className="gap-2 items-end">
            {menuItems.map((item, i) => (
              <Animated.View
                key={item.label}
                className="items-end"
                style={{ opacity: itemAnims[i].opacity, transform: [{ translateX: itemAnims[i].translateX }, { scale: itemAnims[i].scale }] }}
              >
                <TouchableOpacity
                  className="flex-row items-center gap-2.5 py-2.5 pl-2.5 pr-3.5 rounded-3xl w-[152px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.96)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 12, elevation: 6 }}
                  onPress={() => { animateMenu(false); setTimeout(item.onPress, 80); }}
                  activeOpacity={0.8}
                >
                  <View className="w-8 h-8 rounded-full items-center justify-center shrink-0" style={{ backgroundColor: `${item.accent}18` }}>
                    <Icon name={item.icon} size={16} color={item.accent} />
                  </View>
                  <Text className="text-[13px] font-inter-semibold shrink grow" style={{ color: colors.foreground }}>{item.label}</Text>
                  <View className="w-[3px] h-5 rounded-sm shrink-0" style={{ backgroundColor: item.accent }} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: triggerScale }] }}>
          <TouchableOpacity
            className="w-[46px] h-[46px] rounded-[23px] items-center justify-center"
            style={{ backgroundColor: menuOpen ? colors.foreground : "rgba(255,255,255,0.95)", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 6 }}
            onPress={handleMenuToggle}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: triggerRotateDeg }] }}>
              <Icon name="ellipsis-vertical" size={20} color={menuOpen ? "white" : colors.foreground} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Lap flash toast */}
      {lapFlash && (
        <View
          className="absolute left-3 right-3 z-30 flex-row items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{
            bottom: botPad + 96,
            backgroundColor: "rgba(20,20,20,0.88)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <Icon name="flag-outline" size={16} color={cfg.color} />
          <Text className="text-sm font-inter-semibold flex-1" style={{ color: "white" }}>{lapFlash}</Text>
        </View>
      )}

      {/* Lock overlay */}
      {screenLocked && (
        <View
          className="absolute inset-0 z-40 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
        >
          <View className="items-center gap-5">
            <Icon name="lock" size={44} color="white" />
            <View className="items-center gap-1">
              <Text className="text-white text-2xl font-inter-bold">{formatDuration(duration)}</Text>
              <Text className="text-white/70 text-base font-inter-regular">{(distance / 1000).toFixed(2)} km</Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-2 px-8 py-3.5 rounded-full mt-4"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" }}
              onPress={handleLockToggle}
            >
              <Icon name="unlock" size={18} color="white" />
              <Text className="text-white text-[15px] font-inter-semibold">Tap to Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom nav — recording-specific controls */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center border-t pt-1.5 z-10"
        style={{ paddingBottom: botPad || 8, backgroundColor: "rgba(255,255,255,0.97)", borderTopColor: colors.border }}
      >
        {/* Stop */}
        <TouchableOpacity
          className="flex-1 items-center justify-center py-1.5 gap-1"
          onPress={handleStop}
        >
          <View className="w-9 h-9 rounded-2xl items-center justify-center" style={{ backgroundColor: "#FFF0F0" }}>
            <Icon name="square" size={17} color={colors.destructive} />
          </View>
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.destructive }}>Stop</Text>
        </TouchableOpacity>

        {/* Lap */}
        <TouchableOpacity
          className="flex-1 items-center justify-center py-1.5 gap-1"
          onPress={handleMarkLap}
        >
          <View className="relative">
            <View className="w-9 h-9 rounded-2xl items-center justify-center" style={{ backgroundColor: `${cfg.color}18` }}>
              <Icon name="flag-outline" size={17} color={cfg.color} />
            </View>
            {laps.length > 0 && (
              <View
                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full items-center justify-center"
                style={{ backgroundColor: cfg.color }}
              >
                <Text className="text-white text-[9px] font-inter-bold">{laps.length}</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] font-inter-semibold" style={{ color: cfg.color }}>Lap</Text>
        </TouchableOpacity>

        {/* Pause / Resume — centre FAB */}
        <TouchableOpacity
          className="flex-1 items-center justify-center py-1 gap-1"
          onPress={handlePause}
        >
          <View
            className="w-[54px] h-[54px] rounded-[27px] items-center justify-center"
            style={{
              backgroundColor: paused ? colors.accent : cfg.color,
              shadowColor: cfg.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Icon name={paused ? "play" : "pause"} size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Drop Pin */}
        <TouchableOpacity
          className="flex-1 items-center justify-center py-1.5 gap-1"
          onPress={handleDropPin}
        >
          <View className="relative">
            <View className="w-9 h-9 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.accent}18` }}>
              <Icon name="location-outline" size={17} color={colors.accent} />
            </View>
            {pins.length > 0 && (
              <View
                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white text-[9px] font-inter-bold">{pins.length}</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.accent }}>Pin</Text>
        </TouchableOpacity>

        {/* Lock */}
        <TouchableOpacity
          className="flex-1 items-center justify-center py-1.5 gap-1"
          onPress={handleLockToggle}
        >
          <View className="w-9 h-9 rounded-2xl items-center justify-center" style={{ backgroundColor: screenLocked ? "#26262618" : "#26262612" }}>
            <Icon name={screenLocked ? "lock" : "lock-outline"} size={17} color={screenLocked ? colors.foreground : colors.mutedForeground} />
          </View>
          <Text className="text-[10px] font-inter-semibold" style={{ color: screenLocked ? colors.foreground : colors.mutedForeground }}>
            {screenLocked ? "Locked" : "Lock"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={handleSaveOnly}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="mx-6 rounded-3xl overflow-hidden" style={{ backgroundColor: colors.card, width: 320 }}>
            <LinearGradient
              colors={cfg.gradient}
              className="items-center pt-8 pb-6 px-6"
            >
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-3">
                <Icon name="checkmark-circle" size={36} color="white" />
              </View>
              <Text className="text-white text-[20px] font-inter-bold">Activity Saved!</Text>
              <Text className="text-white/80 text-[13px] font-inter-regular mt-1 text-center">
                {(distance / 1000).toFixed(2)} km · {formatDuration(duration)}
              </Text>
            </LinearGradient>

            <View className="px-5 py-5 gap-3">
              <Text className="text-[14px] font-inter-semibold text-center" style={{ color: colors.foreground }}>
                Generate a 3D video replay?
              </Text>
              <Text className="text-[12px] font-inter-regular text-center" style={{ color: colors.mutedForeground }}>
                You can also generate videos later from the History or Videos tab
              </Text>

              <TouchableOpacity
                className="rounded-2xl overflow-hidden mt-1"
                onPress={handleGenerateFromModal}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#088395", "#066B7A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center justify-center gap-2.5 py-3.5"
                >
                  <Icon name="film" size={18} color="white" />
                  <Text className="text-white text-[15px] font-inter-bold">Generate 3D Video</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 py-3 rounded-2xl border"
                style={{ borderColor: colors.border }}
                onPress={handleSaveOnly}
                activeOpacity={0.8}
              >
                <Icon name="download" size={16} color={colors.foreground} />
                <Text className="text-[14px] font-inter-semibold" style={{ color: colors.foreground }}>
                  Save for Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <VideoOptionsModal
        visible={showVideoOptions}
        onClose={() => {
          setShowVideoOptions(false);
          router.back();
        }}
        onGenerate={handleVideoGenerate}
        activityName={`${TYPE_CONFIG[activityType].label} · ${(distance / 1000).toFixed(2)} km`}
      />
    </View>
  );
}
