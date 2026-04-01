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
    <View style={[
      styles.card,
      { backgroundColor: colors.card, shadowColor: gradient[2], width: cardW },
    ]}>
      {/* Thumbnail */}
      <View style={[styles.thumb, { height: thumbH }]}>
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
          <SvgCircle
            cx={route.startX}
            cy={route.startY}
            r={featured ? 5 : 4}
            fill="rgba(255,255,255,0.9)"
          />
          <SvgCircle
            cx={route.endX}
            cy={route.endY}
            r={featured ? 8 : 6}
            fill="rgba(255,255,255,0.25)"
          />
          <SvgCircle
            cx={route.endX}
            cy={route.endY}
            r={featured ? 4.5 : 3.5}
            fill="white"
          />
          {/* Bottom scrim for text legibility */}
          <Rect
            x={0}
            y={thumbH * 0.58}
            width={cardW}
            height={thumbH * 0.42}
            fill="rgba(0,0,0,0.38)"
          />
        </Svg>

        {/* Top badges */}
        <View style={styles.thumbTop}>
          <View style={styles.typeBadge}>
            <Icon name={TYPE_ICON[activity.type]} size={featured ? 13 : 11} color="white" />
            {featured && (
              <Text style={styles.typeBadgeText}>{getActivityLabel(activity.type)}</Text>
            )}
          </View>
          <View style={styles.fourKBadge}>
            <Icon name="videocam" size={9} color="white" />
            <Text style={styles.fourKText}>4K</Text>
          </View>
        </View>

        {/* Distance overlay — bottom of thumbnail */}
        <View style={styles.thumbBottom}>
          <Text style={[styles.distOverlay, { fontSize: featured ? 28 : 22 }]}>
            {distKm}
            <Text style={styles.distOverlayUnit}> km</Text>
          </Text>
        </View>
      </View>

      {/* Info strip */}
      <View style={[styles.infoStrip, { backgroundColor: colors.card }]}>
        <Text style={[styles.actName, { color: colors.foreground }]} numberOfLines={1}>
          {getActivityName(activity)}
        </Text>
        <Text style={[styles.actDate, { color: colors.mutedForeground }]}>
          {getActivityDate(activity.startTime)} · {timeStr}
        </Text>

        {/* Stats row */}
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Icon name="timer-outline" size={11} color={gradient[1]} />
            <Text style={[styles.miniStatText, { color: colors.foreground }]}>
              {formatDuration(activity.duration)}
            </Text>
          </View>
          <View style={[styles.miniStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.miniStat}>
            <Icon name="flash" size={11} color="#088395" />
            <Text style={[styles.miniStatText, { color: colors.foreground }]}>
              {activity.avgSpeed.toFixed(1)}<Text style={{ color: colors.mutedForeground, fontSize: 9 }}> km/h</Text>
            </Text>
          </View>
          {featured && (
            <>
              <View style={[styles.miniStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.miniStat}>
                <Icon name="trending-up" size={11} color="#982598" />
                <Text style={[styles.miniStatText, { color: colors.foreground }]}>
                  +{activity.elevationGain}<Text style={{ color: colors.mutedForeground, fontSize: 9 }}> m</Text>
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.playPill, { backgroundColor: gradient[1] }]}
            activeOpacity={0.85}
          >
            <Icon name="play" size={10} color="white" />
            <Text style={styles.playPillText}>Play</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
            <Icon name="share-outline" size={13} color={gradient[1]} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
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

  // First card is full-width "featured", rest go in 2-column pairs
  const recent = activities.slice(0, 7);
  const featured = recent[0];
  const grid = recent.slice(1);

  // Pair grid items into rows of 2
  const rows: Activity[][] = [];
  for (let i = 0; i < grid.length; i += 2) {
    rows.push(grid.slice(i, i + 2));
  }

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topPadding }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good morning, Alex
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Your Journey</Text>
          </View>
          <TouchableOpacity style={[styles.bellBtn, { backgroundColor: colors.primary }]}>
            <Icon name="notifications-outline" size={20} color="white" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Week card */}
        <View style={styles.weekCard}>
          <LinearGradient colors={["#2A3A2A", "#1A2A1A"]} style={styles.weekGradient}>
            <View style={styles.weekTop}>
              <Text style={styles.weekLabel}>This Week</Text>
              <View style={styles.weekBadge}>
                <Icon name="trending-up" size={12} color="#6D9E51" />
                <Text style={styles.weekBadgeText}>+12% vs last week</Text>
              </View>
            </View>
            <Text style={styles.weekDistance}>
              {totalDistKm.toFixed(1)}
              <Text style={styles.weekUnit}> km</Text>
            </Text>
            <View style={styles.weekStats}>
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
                <View key={s.label} style={styles.weekStatItem}>
                  <Text style={styles.weekStatValue}>{s.value}</Text>
                  <Text style={styles.weekStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Weekly goal: {weeklyGoal} km</Text>
              <Text style={styles.goalPct}>{Math.round(progress)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` as any, backgroundColor: "#6D9E51" },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activities
          </Text>
          <TouchableOpacity style={styles.seeAllBtn}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            <Icon name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}12` }]}>
              <Icon name="map-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No activities yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the record button to start your first journey!
            </Text>
          </View>
        ) : (
          <View style={styles.gridOuter}>
            {/* Featured full-width card */}
            {featured && (
              <ActivityCard activity={featured} featured />
            )}

            {/* 2-column grid rows */}
            {rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
                {/* Spacer if odd item in last row */}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
    borderWidth: 1.5,
    borderColor: "#6D9E51",
  },
  weekCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  weekGradient: { padding: 20 },
  weekTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weekLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_500Medium" },
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(109,158,81,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  weekBadgeText: { color: "#6D9E51", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  weekDistance: { color: "white", fontSize: 46, fontFamily: "Inter_700Bold", marginBottom: 12 },
  weekUnit: { fontSize: 22, color: "rgba(255,255,255,0.7)" },
  weekStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  weekStatItem: { alignItems: "center" },
  weekStatValue: { color: "white", fontSize: 16, fontFamily: "Inter_700Bold" },
  weekStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  goalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  goalLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular" },
  goalPct: { color: "#6D9E51", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* ─── Grid layout ─── */
  gridOuter: {
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },

  /* ─── Activity Card ─── */
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  thumb: {
    width: "100%",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  thumbTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  fourKBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
  },
  fourKText: { color: "white", fontSize: 9, fontFamily: "Inter_700Bold" },
  thumbBottom: {
    padding: 8,
    paddingBottom: 10,
  },
  distOverlay: {
    color: "white",
    fontFamily: "Inter_700Bold",
  },
  distOverlayUnit: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },

  /* ─── Info strip ─── */
  infoStrip: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 3,
  },
  actName: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    lineHeight: 16,
  },
  actDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  miniStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  miniStatText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  miniStatDivider: {
    width: 1,
    height: 10,
    borderRadius: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  playPillText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: { alignItems: "center", gap: 10, paddingHorizontal: 40, paddingVertical: 48 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
