import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { Activity, Coordinate, useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

const TYPE_GRADIENT: Record<string, [string, string]> = {
  run: ["#A8C97F", "#6D9E51"],
  cycle: ["#5BB8C8", "#088395"],
  hike: ["#C8A86B", "#8B6914"],
  walk: ["#9BB5B5", "#5B7070"],
};

const TYPE_LABEL: Record<string, string> = {
  run: "Run",
  cycle: "Cycle",
  hike: "Trail Hike",
  walk: "Walk",
};

const TYPE_ICON: Record<string, string> = {
  run: "walk",
  cycle: "bicycle",
  hike: "trail-sign",
  walk: "footsteps",
};

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function getTimeOfDay(ts: number) {
  const h = new Date(ts).getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAP = 12;
const H_PAD = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const THUMB_HEIGHT = CARD_WIDTH * 0.62;
const MINI_W = CARD_WIDTH - 16;
const MINI_H = THUMB_HEIGHT - 24;

function buildMiniPath(coords: Coordinate[], w: number, h: number): string | null {
  if (coords.length < 2) return null;
  const pad = 6;
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latR = maxLat - minLat || 0.0001;
  const lonR = maxLon - minLon || 0.0001;
  const toX = (lon: number) => pad + ((lon - minLon) / lonR) * (w - pad * 2);
  const toY = (lat: number) => h - pad - ((lat - minLat) / latR) * (h - pad * 2);
  const pts = coords.map((c) => [toX(c.longitude), toY(c.latitude)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1);
    const my = ((pts[i - 1][1] + pts[i][1]) / 2).toFixed(1);
    d += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
  return d;
}

function VideoCard({ activity }: { activity: Activity }) {
  const colors = useColors();
  const gradient = (TYPE_GRADIENT[activity.type] ?? ["#6D9E51", "#088395"]) as [string, string];
  const label = TYPE_LABEL[activity.type] ?? "Activity";
  const tod = getTimeOfDay(activity.startTime);
  const miniPath = buildMiniPath(activity.coordinates, MINI_W, MINI_H);

  const handlePlay = () => {
    router.push(`/video-replay/${activity.id}`);
  };

  return (
    <TouchableOpacity
      className="flex-1 rounded-2xl border overflow-hidden"
      style={{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}
      activeOpacity={0.85}
      onPress={handlePlay}
    >
      <LinearGradient colors={gradient} style={{ width: "100%", height: THUMB_HEIGHT }}>
        <View className="absolute top-2 left-2 w-[26px] h-[26px] rounded-lg bg-black/[0.28] items-center justify-center">
          <Icon name={TYPE_ICON[activity.type]} size={14} color="rgba(255,255,255,0.9)" />
        </View>

        {miniPath && (
          <View className="absolute inset-0 items-center justify-center" style={{ opacity: 0.35 }}>
            <Svg width={MINI_W} height={MINI_H}>
              <Path
                d={miniPath}
                fill="none"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}

        <View className="absolute inset-0 items-center justify-center">
          <View className="w-10 h-10 rounded-full bg-black/[0.38] items-center justify-center border-[1.5px] border-white/40">
            <Icon name="play" size={18} color="white" />
          </View>
        </View>

        <View className="absolute bottom-1.5 left-1.5 right-1.5 flex-row justify-between items-center">
          <View className="flex-row items-center gap-[3px] bg-black/[0.45] px-1.5 py-[3px] rounded-md">
            <Icon name="navigate" size={9} color="white" />
            <Text className="text-white text-[9px] font-inter-bold">{activity.coordinates.length} pts</Text>
          </View>
          <Text className="text-white text-[10px] font-inter-semibold bg-black/[0.45] px-1.5 py-[3px] rounded-md">
            {formatDuration(activity.duration)}
          </Text>
        </View>
      </LinearGradient>

      <View className="p-2.5 gap-1">
        <Text className="text-[13px] font-inter-bold leading-[17px]" style={{ color: colors.foreground }} numberOfLines={1}>
          {tod} {label}
        </Text>
        <Text className="text-[11px] font-inter-regular" style={{ color: colors.mutedForeground }} numberOfLines={1}>
          {new Date(activity.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>

        <View className="flex-row gap-2 mt-0.5">
          <View className="flex-row items-center gap-[3px]">
            <Icon name="map-outline" size={10} color={colors.mutedForeground} />
            <Text className="text-[10px] font-inter-medium" style={{ color: colors.mutedForeground }}>
              {(activity.distance / 1000).toFixed(1)} km
            </Text>
          </View>
          <View className="flex-row items-center gap-[3px]">
            <Icon name="trending-up" size={10} color={colors.mutedForeground} />
            <Text className="text-[10px] font-inter-medium" style={{ color: colors.mutedForeground }}>
              +{activity.elevationGain}m
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-1.5 py-[7px] rounded-[10px] mt-1.5"
          style={{ backgroundColor: colors.primary }}
          onPress={handlePlay}
        >
          <Icon name="play" size={11} color="white" />
          <Text className="text-white text-xs font-inter-semibold">Watch Replay</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const videoActivities = activities.filter((a) => a.coordinates.length >= 2);

  const pairs: Activity[][] = [];
  for (let i = 0; i < videoActivities.length; i += 2) {
    pairs.push(videoActivities.slice(i, i + 2));
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text className="text-[28px] font-inter-bold" style={{ color: colors.foreground }}>Journey Replays</Text>
        <Text className="text-[13px] font-inter-regular mt-0.5" style={{ color: colors.mutedForeground }}>
          {videoActivities.length} {videoActivities.length === 1 ? "replay" : "replays"} available
        </Text>
      </View>

      {videoActivities.length === 0 ? (
        <View className="items-center px-10 py-[60px] gap-3">
          <View
            className="w-[72px] h-[72px] rounded-[20px] items-center justify-center mb-1"
            style={{ backgroundColor: `${colors.primary}12` }}
          >
            <Icon name="videocam-outline" size={36} color={colors.primary} />
          </View>
          <Text className="text-lg font-inter-bold" style={{ color: colors.foreground }}>No replays yet</Text>
          <Text className="text-sm font-inter-regular text-center leading-5" style={{ color: colors.mutedForeground }}>
            Record an activity with GPS tracking to watch your journey replayed on a real map
          </Text>
        </View>
      ) : (
        <View className="gap-3" style={{ paddingHorizontal: H_PAD }}>
          {pairs.map((pair, pi) => (
            <View key={pi} className="flex-row gap-3">
              {pair.map((a) => (
                <VideoCard key={a.id} activity={a} />
              ))}
              {pair.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
