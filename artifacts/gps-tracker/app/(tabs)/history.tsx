import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import VideoOptionsModal, { VideoOptions } from "@/components/VideoOptionsModal";
import { Activity, useActivities } from "@/context/ActivityContext";
import { useVideos } from "@/context/VideoContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | Activity["type"];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All Types" },
  { key: "run", label: "Run" },
  { key: "cycle", label: "Cycle" },
  { key: "hike", label: "Hike" },
  { key: "walk", label: "Walk" },
];

const TYPE_GRADIENT: Record<Activity["type"], [string, string]> = {
  run: ["#A8C97F", "#6D9E51"],
  cycle: ["#5BB8C8", "#088395"],
  hike: ["#C8A86B", "#8B6914"],
  walk: ["#9BB5B5", "#5B7070"],
};

const TYPE_ICON: Record<Activity["type"], string> = {
  run: "walk",
  cycle: "bicycle",
  hike: "trail-sign",
  walk: "footsteps",
};

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getActivityName(a: Activity): string {
  const h = new Date(a.startTime).getHours();
  const tod = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  const label = { run: "Run", cycle: "Cycle", hike: "Trail Hike", walk: "Walk" }[a.type];
  return `${tod} ${label}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HistoryCard({ activity }: { activity: Activity }) {
  const colors = useColors();
  const { getVideoForActivity } = useVideos();
  const [expanded, setExpanded] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const gradient = TYPE_GRADIENT[activity.type];
  const hasVideo = !!getVideoForActivity(activity.id);

  const handleVideoGenerate = (options: VideoOptions) => {
    setShowVideoOptions(false);
    const params = new URLSearchParams({
      resolution: options.resolution,
      fps: String(options.fps),
      speed: String(options.speed),
      orientation: options.orientation,
    });
    router.push(`/generate-video/${activity.id}?${params.toString()}` as any);
  };

  return (
    <>
      <TouchableOpacity
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.9}
      >
        <View className="flex-row items-center p-3 gap-3">
          <LinearGradient colors={gradient} className="w-[52px] h-[52px] rounded-xl items-center justify-center shrink-0">
            <Icon name={TYPE_ICON[activity.type]} size={20} color="white" />
          </LinearGradient>

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Text className="text-[15px] font-inter-bold flex-1" style={{ color: colors.foreground }}>
                {getActivityName(activity)}
              </Text>
              {hasVideo ? (
                <TouchableOpacity
                  className="flex-row items-center gap-[3px] px-[7px] py-[3px] rounded-[10px]"
                  style={{ backgroundColor: `${colors.accent}18` }}
                  onPress={() => router.push("/(tabs)/videos")}
                >
                  <Icon name="checkmark-circle" size={11} color={colors.accent} />
                  <Text className="text-[10px] font-inter-semibold" style={{ color: colors.accent }}>Video Ready</Text>
                </TouchableOpacity>
              ) : (
                <View
                  className="flex-row items-center gap-[3px] px-[7px] py-[3px] rounded-[10px]"
                  style={{ backgroundColor: `${colors.mutedForeground}12` }}
                >
                  <Icon name="videocam-outline" size={11} color={colors.mutedForeground} />
                  <Text className="text-[10px] font-inter-regular" style={{ color: colors.mutedForeground }}>No Video</Text>
                </View>
              )}
            </View>
            <Text className="text-xs font-inter-regular mb-1.5" style={{ color: colors.mutedForeground }}>
              {formatDate(activity.startTime)}
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <View className="flex-row items-center gap-[3px]">
                <Icon name="map-outline" size={12} color={colors.mutedForeground} />
                <Text className="text-[11px] font-inter-medium" style={{ color: colors.foreground }}>
                  {(activity.distance / 1000).toFixed(1)} km
                </Text>
              </View>
              <View className="flex-row items-center gap-[3px]">
                <Icon name="timer-outline" size={12} color={colors.mutedForeground} />
                <Text className="text-[11px] font-inter-medium" style={{ color: colors.foreground }}>
                  {formatDuration(activity.duration)}
                </Text>
              </View>
              <View className="flex-row items-center gap-[3px]">
                <Icon name="flash-outline" size={12} color={colors.mutedForeground} />
                <Text className="text-[11px] font-inter-medium" style={{ color: colors.foreground }}>
                  {activity.avgSpeed.toFixed(1)} km/h
                </Text>
              </View>
            </View>
          </View>

          <Icon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>

        {expanded && (
          <View
            className="flex-row items-center justify-between px-3 py-2.5 border-t flex-wrap gap-2"
            style={{ borderTopColor: colors.border }}
          >
            <View className="flex-row gap-4 shrink">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-7 h-7 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Icon name="flash" size={14} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-[13px] font-inter-bold" style={{ color: colors.foreground }}>
                    {activity.maxSpeed.toFixed(1)} km/h
                  </Text>
                  <Text className="text-[10px] font-inter-regular" style={{ color: colors.mutedForeground }}>
                    max speed
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-7 h-7 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${colors.accent}15` }}
                >
                  <Icon name="trending-up" size={14} color={colors.accent} />
                </View>
                <View>
                  <Text className="text-[13px] font-inter-bold" style={{ color: colors.foreground }}>
                    +{activity.elevationGain}m
                  </Text>
                  <Text className="text-[10px] font-inter-regular" style={{ color: colors.mutedForeground }}>
                    elevation
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="flex-row items-center gap-[5px] px-3 py-2 rounded-full border"
                style={{ borderColor: colors.border }}
                onPress={() => router.push(`/activity/${activity.id}` as any)}
              >
                <Icon name="chevron-forward" size={13} color={colors.foreground} />
                <Text className="text-xs font-inter-semibold" style={{ color: colors.foreground }}>Details</Text>
              </TouchableOpacity>
              {hasVideo ? (
                <TouchableOpacity
                  className="flex-row items-center gap-[5px] px-3.5 py-2 rounded-full"
                  style={{ backgroundColor: colors.accent }}
                  onPress={() => router.push("/(tabs)/videos")}
                >
                  <Icon name="play" size={14} color="white" />
                  <Text className="text-white text-xs font-inter-semibold">Watch</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center gap-[5px] px-3.5 py-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => setShowVideoOptions(true)}
                >
                  <Icon name="film" size={14} color="white" />
                  <Text className="text-white text-xs font-inter-semibold">3D Video</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>

      <VideoOptionsModal
        visible={showVideoOptions}
        onClose={() => setShowVideoOptions(false)}
        onGenerate={handleVideoGenerate}
        activityName={`${getActivityName(activity)} · ${(activity.distance / 1000).toFixed(1)} km`}
      />
    </>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const { videos } = useVideos();
  const [filter, setFilter] = useState<FilterType>("all");
  const isWeb = Platform.OS === "web";

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.type === filter);

  const totalDist = activities.reduce((s, a) => s + a.distance, 0) / 1000;
  const topSpeed =
    activities.length > 0 ? Math.max(...activities.map((a) => a.maxSpeed)) : 0;

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text className="text-[28px] font-inter-bold" style={{ color: colors.foreground }}>
          Activity History
        </Text>
        <Text className="text-[13px] font-inter-regular mt-0.5" style={{ color: colors.mutedForeground }}>
          {activities.length} activities recorded
        </Text>
      </View>

      <View className="flex-row mx-4 rounded-2xl mb-4 overflow-hidden bg-[#1A2A1A]">
        {[
          { label: "Distance", value: `${totalDist.toFixed(1)} km` },
          { label: "Top Speed", value: `${topSpeed.toFixed(1)} km/h` },
          { label: "Videos", value: String(videos.length) },
          { label: "Trips", value: String(activities.length) },
        ].map((s, i) => (
          <View
            key={s.label}
            className="flex-1 items-center py-3.5"
            style={i < 3 ? { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" } : undefined}
          >
            <Text className="text-white text-[15px] font-inter-bold">{s.value}</Text>
            <Text className="text-white/50 text-[10px] font-inter-regular mt-0.5">{s.label}</Text>
          </View>
        ))}
      </View>

      <View className="mb-2">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item.key)}
                className="px-3.5 py-[7px] rounded-full border"
                style={{
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-[13px] font-inter-semibold"
                  style={{ color: active ? "white" : colors.foreground }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View className="items-center py-10 gap-2.5">
            <Icon name="map-outline" size={40} color={colors.mutedForeground} />
            <Text className="text-[15px] font-inter-regular text-center" style={{ color: colors.mutedForeground }}>
              No activities match this filter
            </Text>
          </View>
        }
        renderItem={({ item }) => <HistoryCard activity={item} />}
      />
    </View>
  );
}
