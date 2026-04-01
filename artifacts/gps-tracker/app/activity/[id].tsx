import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import VideoOptionsModal, { VideoOptions } from "@/components/VideoOptionsModal";
import { Activity, Coordinate, useActivities } from "@/context/ActivityContext";
import { useVideos } from "@/context/VideoContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const ROUTE_W = SCREEN_W;
const ROUTE_H = 260;
const PAD = 28;

type ActivityType = Activity["type"];

const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: string; gradient: [string, string]; color: string }
> = {
  run:   { label: "Run",   icon: "walk",       gradient: ["#A8C97F", "#6D9E51"], color: "#6D9E51" },
  cycle: { label: "Cycle", icon: "bicycle",    gradient: ["#5BB8C8", "#088395"], color: "#088395" },
  hike:  { label: "Hike",  icon: "trail-sign", gradient: ["#C8A86B", "#8B6914"], color: "#8B6914" },
  walk:  { label: "Walk",  icon: "footsteps",  gradient: ["#9BB5B5", "#5B7070"], color: "#5B7070" },
};

const CALORIE_FACTOR: Record<ActivityType, number> = {
  run: 65, cycle: 40, hike: 55, walk: 50,
};

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function buildRouteFromCoords(coords: Coordinate[], w: number, h: number) {
  if (coords.length < 2) return null;
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 0.0001;
  const lonRange = maxLon - minLon || 0.0001;

  const toX = (lon: number) => PAD + ((lon - minLon) / lonRange) * (w - PAD * 2);
  const toY = (lat: number) => h - PAD - ((lat - minLat) / latRange) * (h - PAD * 2);

  const pts = coords.map((c) => [toX(c.longitude), toY(c.latitude)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1);
    const my = ((pts[i - 1][1] + pts[i][1]) / 2).toFixed(1);
    d += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;

  return {
    path: d,
    startX: pts[0][0], startY: pts[0][1],
    endX: pts[pts.length - 1][0], endY: pts[pts.length - 1][1],
  };
}

function ActivityNameForType(type: ActivityType, startTime: number) {
  const hour = new Date(startTime).getHours();
  const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const typeLabel = TYPE_CONFIG[type].label;
  return `${timeOfDay} ${typeLabel}`;
}

function PaceDisplay({ activity }: { activity: Activity }) {
  const distKm = activity.distance / 1000;
  if (distKm < 0.01 || activity.duration < 1) return <Text>—</Text>;
  const secsPerKm = activity.duration / distKm;
  const paceMin = Math.floor(secsPerKm / 60);
  const paceSec = Math.round(secsPerKm % 60);
  return (
    <Text className="text-2xl font-inter-bold text-foreground">
      {paceMin}:{String(paceSec).padStart(2, "0")}
    </Text>
  );
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, deleteActivity } = useActivities();
  const { getVideoForActivity, isGenerating } = useVideos();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const existingVideo = id ? getVideoForActivity(id) : undefined;
  const currentlyGenerating = isGenerating === id;

  const handleVideoGenerate = useCallback((options: VideoOptions) => {
    setShowVideoOptions(false);
    if (id) {
      const params = new URLSearchParams({
        resolution: options.resolution,
        fps: String(options.fps),
        speed: String(options.speed),
        orientation: options.orientation,
      });
      router.push(`/generate-video/${id}?${params.toString()}` as any);
    }
  }, [id]);

  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Icon name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text className="mt-4 text-lg font-inter-semibold" style={{ color: colors.foreground }}>Activity not found</Text>
        <TouchableOpacity className="mt-4 px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }} onPress={() => router.back()}>
          <Text className="text-white font-inter-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = TYPE_CONFIG[activity.type];
  const route = buildRouteFromCoords(activity.coordinates, ROUTE_W, ROUTE_H);
  const distKm = (activity.distance / 1000).toFixed(2);
  const calories = Math.round((activity.distance / 1000) * CALORIE_FACTOR[activity.type]);
  const activityName = ActivityNameForType(activity.type, activity.startTime);

  const handleDelete = () => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${activityName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            await deleteActivity(activity.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient
          colors={[cfg.gradient[0] + "dd", cfg.gradient[1]]}
          style={{ paddingTop: insets.top + 12, paddingBottom: 0, minHeight: ROUTE_H + insets.top + 60 }}
        >
          {/* Nav row */}
          <View className="flex-row items-center justify-between px-4 mb-4">
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              onPress={() => router.back()}
            >
              <Icon name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <Icon name={cfg.icon} size={14} color="white" />
              <Text className="text-white text-[13px] font-inter-semibold">{cfg.label}</Text>
            </View>

            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              onPress={() => {}}
            >
              <Icon name="share-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className="px-5 mb-2">
            <Text className="text-white text-2xl font-inter-bold">{activityName}</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Icon name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/80 text-[13px] font-inter-regular">
                {formatDate(activity.startTime)} · {formatTime(activity.startTime)}
              </Text>
            </View>
          </View>

          {/* Route SVG */}
          <View style={{ height: ROUTE_H }}>
            <Svg width={ROUTE_W} height={ROUTE_H}>
              <Defs>
                <SvgGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="white" stopOpacity="0.5" />
                  <Stop offset="1" stopColor="white" stopOpacity="1" />
                </SvgGradient>
              </Defs>
              {route ? (
                <>
                  <Path
                    d={route.path}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.25}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={route.path}
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx={route.startX} cy={route.startY} r={7} fill="white" opacity={0.9} />
                  <Circle cx={route.startX} cy={route.startY} r={4} fill={cfg.color} />
                  <Circle cx={route.endX} cy={route.endY} r={9} fill="white" opacity={0.5} />
                  <Circle cx={route.endX} cy={route.endY} r={6} fill="white" />
                  <Circle cx={route.endX} cy={route.endY} r={3} fill={cfg.color} />
                </>
              ) : (
                <Circle cx={ROUTE_W / 2} cy={ROUTE_H / 2} r={6} fill="white" opacity={0.6} />
              )}
            </Svg>
          </View>
        </LinearGradient>

        {/* Stats section */}
        <View className="px-4 -mt-5">
          {/* Big 3 */}
          <View
            className="flex-row rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 }}
          >
            <View className="flex-1 items-center py-5 border-r" style={{ borderRightColor: colors.border }}>
              <Text className="text-2xl font-inter-bold" style={{ color: colors.foreground }}>{distKm}</Text>
              <Text className="text-[11px] font-inter-regular mt-0.5" style={{ color: colors.mutedForeground }}>km</Text>
            </View>
            <View className="flex-1 items-center py-5 border-r" style={{ borderRightColor: colors.border }}>
              <Text className="text-2xl font-inter-bold" style={{ color: colors.foreground }}>{formatDuration(activity.duration)}</Text>
              <Text className="text-[11px] font-inter-regular mt-0.5" style={{ color: colors.mutedForeground }}>duration</Text>
            </View>
            <View className="flex-1 items-center py-5">
              <Text className="text-2xl font-inter-bold" style={{ color: colors.foreground }}>{activity.avgSpeed.toFixed(1)}</Text>
              <Text className="text-[11px] font-inter-regular mt-0.5" style={{ color: colors.mutedForeground }}>avg km/h</Text>
            </View>
          </View>

          {/* Detailed stats grid */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            {[
              { icon: "flash", label: "Max Speed", value: `${activity.maxSpeed.toFixed(1)} km/h`, color: cfg.color },
              { icon: "trending-up", label: "Elevation", value: `+${activity.elevationGain} m`, color: "#982598" },
              { icon: "flame", label: "Calories", value: `${calories} kcal`, color: "#FF6B35" },
              { icon: "timer-outline", label: "Pace", value: null, color: colors.accent, isPace: true },
            ].map((stat) => (
              <View
                key={stat.label}
                className="rounded-2xl p-4"
                style={{
                  width: (SCREEN_W - 32 - 12) / 2,
                  backgroundColor: colors.card,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Icon name={stat.icon} size={14} color={stat.color} />
                  <Text className="text-[12px] font-inter-medium" style={{ color: colors.mutedForeground }}>{stat.label}</Text>
                </View>
                {stat.isPace ? (
                  <View className="flex-row items-end gap-1">
                    <PaceDisplay activity={activity} />
                    <Text className="text-[12px] font-inter-regular pb-1" style={{ color: colors.mutedForeground }}>/km</Text>
                  </View>
                ) : (
                  <Text className="text-2xl font-inter-bold" style={{ color: colors.foreground }}>{stat.value}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Timeline strip */}
          <View
            className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${cfg.color}18` }}>
                <Icon name="play" size={14} color={cfg.color} />
              </View>
              <View>
                <Text className="text-[11px] font-inter-regular" style={{ color: colors.mutedForeground }}>Started</Text>
                <Text className="text-[14px] font-inter-semibold" style={{ color: colors.foreground }}>{formatTime(activity.startTime)}</Text>
              </View>
            </View>

            <View className="flex-1 mx-3 h-0.5 rounded" style={{ backgroundColor: colors.border }} />

            <View className="flex-row items-center gap-2">
              <View>
                <Text className="text-[11px] font-inter-regular text-right" style={{ color: colors.mutedForeground }}>Finished</Text>
                <Text className="text-[14px] font-inter-semibold" style={{ color: colors.foreground }}>{formatTime(activity.endTime)}</Text>
              </View>
              <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${cfg.color}18` }}>
                <Icon name="square" size={14} color={cfg.color} />
              </View>
            </View>
          </View>

          {/* GPS points */}
          <View
            className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 mb-6"
            style={{ backgroundColor: `${colors.accent}10` }}
          >
            <Icon name="navigate" size={16} color={colors.accent} />
            <Text className="flex-1 text-[13px] font-inter-regular" style={{ color: colors.accent }}>
              {activity.coordinates.length} GPS point{activity.coordinates.length !== 1 ? "s" : ""} recorded
            </Text>
          </View>

          {activity.coordinates.length >= 2 && (
            <View className="gap-3 mb-3">
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
                style={{ backgroundColor: colors.primary }}
                onPress={() => router.push(`/video-replay/${activity.id}`)}
                activeOpacity={0.8}
              >
                <Icon name="play" size={18} color="white" />
                <Text className="text-[15px] font-inter-semibold text-white">
                  Watch Journey Replay
                </Text>
              </TouchableOpacity>

              {existingVideo ? (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
                  style={{ backgroundColor: colors.accent }}
                  onPress={() => router.push("/(tabs)/videos")}
                  activeOpacity={0.8}
                >
                  <Icon name="videocam-outline" size={18} color="white" />
                  <Text className="text-[15px] font-inter-semibold text-white">
                    View 3D Video
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
                  style={{
                    backgroundColor: currentlyGenerating ? `${colors.accent}40` : colors.accent,
                  }}
                  onPress={() => {
                    if (!currentlyGenerating) {
                      setShowVideoOptions(true);
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={currentlyGenerating}
                >
                  <Icon
                    name={currentlyGenerating ? "hourglass" : "videocam-outline"}
                    size={18}
                    color="white"
                  />
                  <Text className="text-[15px] font-inter-semibold text-white">
                    {currentlyGenerating ? "Generating 3D Video..." : "Generate 3D Video"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Delete button */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 rounded-2xl py-4 mb-8"
            style={{ backgroundColor: `${colors.destructive}12`, borderWidth: 1, borderColor: `${colors.destructive}30` }}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.75}
          >
            <Icon name="trash" size={18} color={colors.destructive} />
            <Text className="text-[15px] font-inter-semibold" style={{ color: colors.destructive }}>
              {deleting ? "Deleting…" : "Delete Activity"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <VideoOptionsModal
        visible={showVideoOptions}
        onClose={() => setShowVideoOptions(false)}
        onGenerate={handleVideoGenerate}
        activityName={`${cfg.label} · ${(activity.distance / 1000).toFixed(1)} km`}
      />
    </View>
  );
}
