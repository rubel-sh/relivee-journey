import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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

export default function RecordingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useActivities();

  const [coords, setCoords] = useState<Coordinate[]>([]);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [elevGain, setElevGain] = useState(0);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locSubRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchRef = useRef<number | null>(null);
  const lastAltRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const pausedRef = useRef(false);

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
    const easing = open ? Easing.out(Easing.back(1.4)) : Easing.in(Easing.quad);

    Animated.timing(triggerRotate, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(triggerScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(triggerScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (open) {
      Animated.stagger(
        STAGGER_MS,
        itemAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: dur,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: 0,
              duration: dur,
              easing: Easing.out(Easing.back(1.3)),
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: dur,
              easing: Easing.out(Easing.back(1.3)),
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    } else {
      Animated.stagger(
        STAGGER_MS,
        [...itemAnims].reverse().map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: dur,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: 40,
              duration: dur,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration: dur,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        )
      ).start(() => {
        if (!open) setMenuOpen(false);
      });
    }
  };

  const handleMenuToggle = () => {
    if (!menuOpen) {
      setMenuOpen(true);
      animateMenu(true);
    } else {
      animateMenu(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerRotateDeg = triggerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  useEffect(() => {
    requestPermission();
    return () => stopAll();
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      setPermGranted(true);
      startTracking();
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setPermGranted(true);
      startTracking();
    } else {
      setPermGranted(false);
    }
  };

  const startTracking = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setDuration((d) => d + 1);
    }, 1000);

    if (Platform.OS === "web") {
      if (navigator.geolocation) {
        webWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            handleNewPosition(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.altitude ?? undefined,
              (pos.coords.speed ?? 0) * 3.6
            );
          },
          undefined,
          { enableHighAccuracy: true }
        );
      }
    } else {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 3,
        },
        (loc) => {
          handleNewPosition(
            loc.coords.latitude,
            loc.coords.longitude,
            loc.coords.altitude ?? undefined,
            (loc.coords.speed ?? 0) * 3.6
          );
        }
      ).then((sub) => {
        locSubRef.current = sub;
      });
    }
  };

  const handleNewPosition = (
    lat: number, lon: number,
    alt: number | undefined, speedKmh: number
  ) => {
    if (pausedRef.current) return;
    const newCoord: Coordinate = { latitude: lat, longitude: lon, altitude: alt };
    setCoords((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        setDistance((pd) => pd + haversine(last.latitude, last.longitude, lat, lon));
      } else {
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          800
        );
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
  };

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (locSubRef.current) locSubRef.current.remove();
    if (webWatchRef.current !== null)
      navigator.geolocation?.clearWatch(webWatchRef.current);
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStop = () => {
    stopAll();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const activity: Activity = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      type: "run",
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
    router.back();
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : insets.bottom;

  if (permGranted === false) {
    return (
      <View className="flex-1 items-center justify-center p-10 gap-4" style={{ backgroundColor: colors.background }}>
        <Icon name="location-outline" size={56} color={colors.mutedForeground} />
        <Text className="text-[22px] font-inter-bold" style={{ color: colors.foreground }}>
          Location Required
        </Text>
        <Text className="text-[15px] font-inter-regular text-center" style={{ color: colors.mutedForeground }}>
          Journey needs location access to track your GPS route.
        </Text>
        <TouchableOpacity
          className="px-8 py-3.5 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={requestPermission}
        >
          <Text className="text-white text-base font-inter-semibold">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[15px] font-inter-regular" style={{ color: colors.mutedForeground }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapCoords = coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));
  const lastCoord = coords.length > 0 ? coords[coords.length - 1] : null;
  const firstCoord = coords.length > 0 ? coords[0] : null;

  const menuItems = [
    {
      icon: paused ? "play" : "pause",
      label: paused ? "Resume" : "Pause",
      accent: colors.primary,
      onPress: handlePause,
    },
    {
      icon: "square",
      label: "Stop",
      accent: colors.destructive,
      onPress: handleStop,
    },
    {
      icon: "flag-outline",
      label: "Mark Lap",
      accent: colors.accent,
      onPress: () => Haptics.selectionAsync(),
    },
    {
      icon: "location-outline",
      label: "Drop Pin",
      accent: colors.trace,
      onPress: () => Haptics.selectionAsync(),
    },
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
      >
        {mapCoords.length > 1 && (
          <Polyline
            coordinates={mapCoords}
            strokeColor="#982598"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {firstCoord && (
          <Circle
            center={{ latitude: firstCoord.latitude, longitude: firstCoord.longitude }}
            radius={12}
            fillColor={colors.primary}
            strokeColor="white"
            strokeWidth={2}
          />
        )}
        {lastCoord && (
          <Circle
            center={{ latitude: lastCoord.latitude, longitude: lastCoord.longitude }}
            radius={20}
            fillColor="rgba(152,37,152,0.18)"
            strokeColor="transparent"
            strokeWidth={0}
          />
        )}
      </MapView>

      {/* Top bar */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-4 pb-2.5 z-10"
        style={{ paddingTop: topPad, backgroundColor: "rgba(255,255,255,0.88)" }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Icon name="chevron-down" size={24} color="#262626" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: paused ? "#FFB800" : "#FF4444" }} />
          <Text className="text-[13px] font-inter-bold text-[#FF4444]">
            {paused ? "PAUSED" : "RECORDING"}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 bg-[rgba(8,131,149,0.12)] px-2 py-1 rounded-[10px]">
          <Icon name="navigate" size={11} color="#088395" />
          <Text className="text-[11px] font-inter-semibold text-accent">GPS</Text>
        </View>
      </View>

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
            <Icon name="map-outline" size={12} color={colors.primary} />
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
            <Icon name="flash" size={11} color={colors.primary} />
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
      <View
        className="absolute right-3 items-end gap-2.5 z-20"
        style={{ bottom: botPad + 80, elevation: 20 }}
      >
        {menuOpen && (
          <View className="gap-2 items-end">
            {menuItems.map((item, i) => (
              <Animated.View
                key={item.label}
                className="items-end"
                style={{
                  opacity: itemAnims[i].opacity,
                  transform: [
                    { translateX: itemAnims[i].translateX },
                    { scale: itemAnims[i].scale },
                  ],
                }}
              >
                <TouchableOpacity
                  className="flex-row items-center gap-2.5 py-2.5 pl-2.5 pr-3.5 rounded-3xl w-[152px]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.13,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                  onPress={() => {
                    animateMenu(false);
                    setTimeout(item.onPress, 80);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.accent}18` }}
                  >
                    <Icon name={item.icon} size={16} color={item.accent} />
                  </View>
                  <Text className="text-[13px] font-inter-semibold shrink grow" style={{ color: colors.foreground }}>
                    {item.label}
                  </Text>
                  <View
                    className="w-[3px] h-5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.accent }}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Trigger button */}
        <Animated.View style={{ transform: [{ scale: triggerScale }] }}>
          <TouchableOpacity
            className="w-[46px] h-[46px] rounded-[23px] items-center justify-center"
            style={{
              backgroundColor: menuOpen ? colors.foreground : "rgba(255,255,255,0.95)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 6,
            }}
            onPress={handleMenuToggle}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: triggerRotateDeg }] }}>
              <Icon
                name="ellipsis-vertical"
                size={20}
                color={menuOpen ? "white" : colors.foreground}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom nav */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center border-t pt-2 z-10"
        style={{
          paddingBottom: botPad,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        }}
      >
        <TouchableOpacity className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]" onPress={handleStop}>
          <View className="w-8 h-8 rounded-2xl bg-[#FFF0F0] items-center justify-center">
            <Icon name="square" size={16} color={colors.destructive} />
          </View>
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.destructive }}>Stop</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]">
          <Icon name="time-outline" size={22} color={colors.mutedForeground} />
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.mutedForeground }}>History</Text>
        </View>

        <TouchableOpacity className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]" onPress={handlePause}>
          <View
            className="w-[52px] h-[52px] rounded-[26px] items-center justify-center"
            style={{
              backgroundColor: paused ? colors.accent : colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Icon name={paused ? "play" : "pause"} size={22} color="white" />
          </View>
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]">
          <Icon name="videocam-outline" size={22} color={colors.mutedForeground} />
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.mutedForeground }}>Videos</Text>
        </View>

        <View className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]">
          <Icon name="person-outline" size={22} color={colors.mutedForeground} />
          <Text className="text-[10px] font-inter-semibold" style={{ color: colors.mutedForeground }}>Profile</Text>
        </View>
      </View>
    </View>
  );
}
