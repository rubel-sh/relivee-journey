import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle as SvgCircle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { Activity, useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_PAD = 16;
const GRID_GAP = 10;
const CARD_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;
const THUMB_H = Math.round(CARD_W * 0.9);

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTimeOfDay(ts: number): string {
  const h = new Date(ts).getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function getActivityLabel(type: Activity["type"]): string {
  return { run: "Run", cycle: "Cycle", hike: "Hike", walk: "Walk" }[type];
}

function getActivityName(a: Activity): string {
  return `${getTimeOfDay(a.startTime)} ${getActivityLabel(a.type)}`;
}

function getActivityDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildRoute(id: string, w: number, h: number): {
  path: string;
  startX: number; startY: number;
  endX: number; endY: number;
} {
  const rand = seededRand(hashStr(id));
  const N = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    pts.push([
      w * 0.06 + (i / (N - 1)) * w * 0.88,
      h * 0.2 + rand() * h * 0.55,
    ]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = ((pts[i - 1][0] + pts[i][0]) / 2).toFixed(1);
    const my = ((pts[i - 1][1] + pts[i][1]) / 2).toFixed(1);
    d += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${pts[N - 1][0].toFixed(1)} ${pts[N - 1][1].toFixed(1)}`;
  return {
    path: d,
    startX: pts[0][0], startY: pts[0][1],
    endX: pts[N - 1][0], endY: pts[N - 1][1],
  };
}

const TYPE_GRADIENT: Record<Activity["type"], [string, string, string]> = {
  run:   ["#C8E0A8", "#7DB55A", "#4A7A30"],
  cycle: ["#90D8E8", "#3FAEC0", "#1A7A90"],
  hike:  ["#DEC898", "#B08040", "#7A5A20"],
  walk:  ["#BCCECE", "#6E9090", "#3E6060"],
};

const TYPE_ICON: Record<Activity["type"], string> = {
  run: "walk",
  cycle: "bicycle",
  hike: "trail-sign",
  walk: "footsteps",
};

function ActivityCard({ activity, featured }: { activity: Activity; featured?: boolean }) {
  const colors = useColors();
  const gradient = TYPE_GRADIENT[activity.type];
  const cardW = featured ? SCREEN_W - GRID_PAD * 2 : CARD_W;
  const thumbH = featured ? Math.round(cardW * 0.52) : THUMB_H;
  const route = buildRoute(activity.id, cardW, thumbH);
  const distKm = (activity.distance / 1000).toFixed(2);
  const timeStr = new Date(activity.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.card, shadowColor: gradient[2], width: cardW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 5 }}
    >
      {/* Thumbnail */}
      <View className="w-full overflow-hidden justify-between" style={{ height: thumbH }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* SVG route */}
        <Svg
          width={cardW}
          height={thumbH}
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${cardW} ${thumbH}`}
        >
          <Path
            d={route.path}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={featured ? 5 : 3.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={route.path}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={featured ? 2 : 1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 4"
          />
          <SvgCircle cx={route.startX} cy={route.startY} r={featured ? 5 : 4} fill="rgba(255,255,255,0.9)" />
          <SvgCircle cx={route.endX} cy={route.endY} r={featured ? 8 : 6} fill="rgba(255,255,255,0.25)" />
          <SvgCircle cx={route.endX} cy={route.endY} r={featured ? 4.5 : 3.5} fill="white" />
          <Rect x={0} y={thumbH * 0.58} width={cardW} height={thumbH * 0.42} fill="rgba(0,0,0,0.38)" />
        </Svg>

        {/* Top badges */}
        <View className="flex-row justify-between items-center p-2">
          <View className="flex-row items-center gap-1 bg-black/[0.28] px-[7px] py-1 rounded-full">
            <Icon name={TYPE_ICON[activity.type]} size={featured ? 13 : 11} color="white" />
            {featured && (
              <Text className="text-white text-[10px] font-inter-semibold">
                {getActivityLabel(activity.type)}
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-[3px] bg-black/[0.28] px-1.5 py-1 rounded-full">
            <Icon name="videocam" size={9} color="white" />
            <Text className="text-white text-[9px] font-inter-bold">4K</Text>
          </View>
        </View>

        {/* Distance overlay */}
        <View className="p-2 pb-2.5">
          <Text className="text-white font-inter-bold" style={{ fontSize: featured ? 28 : 22 }}>
            {distKm}
            <Text className="text-xs font-inter-medium text-white/85"> km</Text>
          </Text>
        </View>
      </View>

      {/* Info strip */}
      <View className="px-2.5 pt-2 pb-2 gap-[3px]" style={{ backgroundColor: colors.card }}>
        <Text className="text-xs font-inter-bold leading-4" style={{ color: colors.foreground }} numberOfLines={1}>
          {getActivityName(activity)}
        </Text>
        <Text className="text-[10px] font-inter-regular mb-1" style={{ color: colors.mutedForeground }}>
          {getActivityDate(activity.startTime)} · {timeStr}
        </Text>

        {/* Stats row */}
        <View className="flex-row items-center gap-[5px] mb-2">
          <View className="flex-row items-center gap-[3px]">
            <Icon name="timer-outline" size={11} color={gradient[1]} />
            <Text className="text-[11px] font-inter-semibold" style={{ color: colors.foreground }}>
              {formatDuration(activity.duration)}
            </Text>
          </View>
          <View className="w-px h-[10px] rounded-sm" style={{ backgroundColor: colors.border }} />
          <View className="flex-row items-center gap-[3px]">
            <Icon name="flash" size={11} color="#088395" />
            <Text className="text-[11px] font-inter-semibold" style={{ color: colors.foreground }}>
              {activity.avgSpeed.toFixed(1)}<Text className="text-[9px]" style={{ color: colors.mutedForeground }}> km/h</Text>
            </Text>
          </View>
          {featured && (
            <>
              <View className="w-px h-[10px] rounded-sm" style={{ backgroundColor: colors.border }} />
              <View className="flex-row items-center gap-[3px]">
                <Icon name="trending-up" size={11} color="#982598" />
                <Text className="text-[11px] font-inter-semibold" style={{ color: colors.foreground }}>
                  +{activity.elevationGain}<Text className="text-[9px]" style={{ color: colors.mutedForeground }}> m</Text>
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action row */}
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            className="flex-row items-center gap-1 px-2.5 py-[5px] rounded-full"
            style={{ backgroundColor: gradient[1] }}
            activeOpacity={0.85}
          >
            <Icon name="play" size={10} color="white" />
            <Text className="text-white text-[10px] font-inter-semibold">Play</Text>
          </TouchableOpacity>
          <View className="flex-1" />
          <TouchableOpacity
            className="w-7 h-7 rounded-lg border items-center justify-center"
            style={{ borderColor: colors.border }}
            activeOpacity={0.7}
          >
            <Icon name="share-outline" size={13} color={gradient[1]} />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-7 h-7 rounded-lg border items-center justify-center"
            style={{ borderColor: colors.border }}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-horizontal" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const isWeb = Platform.OS === "web";

  const weekAgo = Date.now() - 7 * 86400000;
  const weekActivities = activities.filter((a) => a.startTime >= weekAgo);
  const totalDistKm = weekActivities.reduce((s, a) => s + a.distance, 0) / 1000;
  const totalDuration = weekActivities.reduce((s, a) => s + a.duration, 0);
  const topSpeed = weekActivities.length > 0 ? Math.max(...weekActivities.map((a) => a.maxSpeed)) : 0;
  const weeklyGoal = 50;
  const progress = Math.min((totalDistKm / weeklyGoal) * 100, 100);

  const recent = activities.slice(0, 7);
  const featured = recent[0];
  const grid = recent.slice(1);

  const rows: Activity[][] = [];
  for (let i = 0; i < grid.length; i += 2) {
    rows.push(grid.slice(i, i + 2));
  }

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topPadding }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
          <View>
            <Text className="text-sm font-inter-regular" style={{ color: colors.mutedForeground }}>
              Good morning, Alex
            </Text>
            <Text className="text-[26px] font-inter-bold mt-0.5" style={{ color: colors.foreground }}>
              Your Journey
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Icon name="notifications-outline" size={20} color="white" />
            <View className="absolute top-[7px] right-2 w-2 h-2 rounded-full bg-destructive border-[1.5px] border-primary" />
          </TouchableOpacity>
        </View>

        {/* Week card */}
        <View className="mx-4 rounded-[20px] overflow-hidden mb-6">
          <LinearGradient colors={["#2A3A2A", "#1A2A1A"]} className="p-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[13px] font-inter-medium text-white/60">This Week</Text>
              <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-full">
                <Icon name="trending-up" size={12} color="#6D9E51" />
                <Text className="text-primary text-[11px] font-inter-semibold">+12% vs last week</Text>
              </View>
            </View>
            <Text className="text-[46px] font-inter-bold text-white mb-3">
              {totalDistKm.toFixed(1)}
              <Text className="text-[22px] text-white/70"> km</Text>
            </Text>
            <View className="flex-row justify-between mb-4">
              {[
                { label: "Activities", value: String(weekActivities.length) },
                {
                  label: "Duration",
                  value: `${Math.floor(totalDuration / 3600)}h ${String(
                    Math.floor((totalDuration % 3600) / 60)
                  ).padStart(2, "0")}m`,
                },
                { label: "Top Speed", value: `${topSpeed.toFixed(1)}` },
                { label: "Videos", value: String(weekActivities.length) },
              ].map((s) => (
                <View key={s.label} className="items-center">
                  <Text className="text-white text-base font-inter-bold">{s.value}</Text>
                  <Text className="text-white/50 text-[10px] font-inter-regular mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-white/50 text-[11px] font-inter-regular">Weekly goal: {weeklyGoal} km</Text>
              <Text className="text-primary text-[11px] font-inter-semibold">{Math.round(progress)}%</Text>
            </View>
            <View className="h-1.5 rounded-[3px] overflow-hidden bg-white/[0.12]">
              <View
                className="h-1.5 rounded-[3px] bg-primary"
                style={{ width: `${progress}%` as any }}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Section header */}
        <View className="flex-row justify-between items-center px-5 mb-3.5">
          <Text className="text-lg font-inter-bold" style={{ color: colors.foreground }}>
            Recent Activities
          </Text>
          <TouchableOpacity className="flex-row items-center gap-0.5">
            <Text className="text-[13px] font-inter-semibold" style={{ color: colors.primary }}>See all</Text>
            <Icon name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View className="items-center gap-2.5 px-10 py-12">
            <View
              className="w-[72px] h-[72px] rounded-[20px] items-center justify-center mb-1"
              style={{ backgroundColor: `${colors.primary}12` }}
            >
              <Icon name="map-outline" size={36} color={colors.primary} />
            </View>
            <Text className="text-lg font-inter-bold" style={{ color: colors.foreground }}>No activities yet</Text>
            <Text className="text-sm font-inter-regular text-center leading-5" style={{ color: colors.mutedForeground }}>
              Tap the record button to start your first journey!
            </Text>
          </View>
        ) : (
          <View className="gap-[10px]" style={{ paddingHorizontal: GRID_PAD }}>
            {featured && <ActivityCard activity={featured} featured />}
            {rows.map((row, ri) => (
              <View key={ri} className="flex-row gap-[10px]">
                {row.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
