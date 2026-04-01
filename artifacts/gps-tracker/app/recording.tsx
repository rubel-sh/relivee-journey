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
    const duration = open ? OPEN_DURATION : CLOSE_DURATION;
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
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.back(1.3)),
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration,
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
              duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: 40,
              duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0.8,
              duration,
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
      <View style={[styles.permContainer, { backgroundColor: colors.background }]}>
        <Icon name="location-outline" size={56} color={colors.mutedForeground} />
        <Text style={[styles.permTitle, { color: colors.foreground }]}>
          Location Required
        </Text>
        <Text style={[styles.permText, { color: colors.mutedForeground }]}>
          Journey needs location access to track your GPS route.
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
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
    <View style={styles.container}>
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
      <View style={[styles.topBar, { paddingTop: topPad, backgroundColor: "rgba(255,255,255,0.88)" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-down" size={24} color="#262626" />
        </TouchableOpacity>
        <View style={styles.recIndicator}>
          <View style={[styles.recDot, { backgroundColor: paused ? "#FFB800" : "#FF4444" }]} />
          <Text style={styles.recText}>{paused ? "PAUSED" : "RECORDING"}</Text>
        </View>
        <View style={styles.gpsBadge}>
          <Icon name="navigate" size={11} color="#088395" />
          <Text style={styles.gpsText}>GPS</Text>
        </View>
      </View>

      {/* Stats card */}
      <View style={[styles.statsCard, { bottom: botPad + 80, backgroundColor: "rgba(255,255,255,0.93)" }]}>
        <Text style={styles.timerText}>
          {formatDuration(duration)}
          <Text style={styles.timerLabel}> duration</Text>
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="map-outline" size={12} color={colors.primary} />
            <Text style={styles.statVal}>{(distance / 1000).toFixed(2)}</Text>
            <Text style={styles.statUnit}>km</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="flash-outline" size={12} color={colors.accent} />
            <Text style={styles.statVal}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.statUnit}>km/h</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="trending-up-outline" size={12} color={colors.trace} />
            <Text style={styles.statVal}>+{Math.round(elevGain)}</Text>
            <Text style={styles.statUnit}>m</Text>
          </View>
        </View>
        <View style={[styles.statsDivider, { borderTopColor: "#F0F0F0" }]}>
          <View style={styles.statItem}>
            <Icon name="flash" size={11} color={colors.primary} />
            <Text style={styles.subStatText}>{maxSpeed.toFixed(1)} km/h max</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="videocam-outline" size={11} color={colors.trace} />
            <Text style={styles.subStatText}>4K · 60fps</Text>
          </View>
        </View>
      </View>

      {/* Radial action menu */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={handleMenuToggle}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      )}

      <View style={[styles.menuContainer, { bottom: botPad + 80 }]}>
        {menuOpen && (
          <View style={styles.menuItems}>
            {menuItems.map((item, i) => (
              <Animated.View
                key={item.label}
                style={[
                  styles.menuRow,
                  {
                    opacity: itemAnims[i].opacity,
                    transform: [
                      { translateX: itemAnims[i].translateX },
                      { scale: itemAnims[i].scale },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.menuPill, { backgroundColor: "rgba(255,255,255,0.96)" }]}
                  onPress={() => {
                    animateMenu(false);
                    setTimeout(item.onPress, 80);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: `${item.accent}18` }]}>
                    <Icon name={item.icon} size={16} color={item.accent} />
                  </View>
                  <Text style={[styles.menuPillText, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <View style={[styles.menuAccentBar, { backgroundColor: item.accent }]} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Trigger button */}
        <Animated.View style={{ transform: [{ scale: triggerScale }] }}>
          <TouchableOpacity
            style={[styles.menuTrigger, { backgroundColor: menuOpen ? colors.foreground : "rgba(255,255,255,0.95)" }]}
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
        style={[
          styles.bottomNav,
          {
            paddingBottom: botPad,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity style={styles.navTab} onPress={handleStop}>
          <View style={styles.stopIcon}>
            <Icon name="square" size={16} color={colors.destructive} />
          </View>
          <Text style={[styles.navLabel, { color: colors.destructive }]}>Stop</Text>
        </TouchableOpacity>

        <View style={styles.navTab}>
          <Icon name="time-outline" size={22} color={colors.mutedForeground} />
          <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>History</Text>
        </View>

        <TouchableOpacity style={styles.navTab} onPress={handlePause}>
          <View
            style={[
              styles.fab,
              {
                backgroundColor: paused ? colors.accent : colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Icon name={paused ? "play" : "pause"} size={22} color="white" />
          </View>
        </TouchableOpacity>

        <View style={styles.navTab}>
          <Icon name="videocam-outline" size={22} color={colors.mutedForeground} />
          <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>Videos</Text>
        </View>

        <View style={styles.navTab}>
          <Icon name="person-outline" size={22} color={colors.mutedForeground} />
          <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>Profile</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  recIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4 },
  recText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF4444" },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(8,131,149,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  gpsText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#088395" },
  statsCard: {
    position: "absolute",
    left: 12,
    borderRadius: 18,
    padding: 14,
    minWidth: 200,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  timerText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#262626",
    marginBottom: 8,
  },
  timerLabel: { fontSize: 13, color: "#aaa", fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#262626" },
  statUnit: { fontSize: 11, color: "#999", fontFamily: "Inter_400Regular" },
  statsDivider: { flexDirection: "row", gap: 12, borderTopWidth: 1, paddingTop: 8 },
  subStatText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#666" },

  menuContainer: {
    position: "absolute",
    right: 12,
    alignItems: "flex-end",
    gap: 10,
    zIndex: 20,
    elevation: 20,
  },
  menuItems: {
    gap: 8,
    alignItems: "flex-end",
  },
  menuRow: {
    alignItems: "flex-end",
  },
  menuPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 24,
    width: 152,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 6,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuPillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
    flexGrow: 1,
  },
  menuAccentBar: {
    width: 3,
    height: 20,
    borderRadius: 2,
    flexShrink: 0,
  },
  menuTrigger: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    zIndex: 10,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    gap: 3,
    minHeight: 50,
  },
  navLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  permContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  permTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  permText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  permBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  permBtnText: { color: "white", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 4 },
});
