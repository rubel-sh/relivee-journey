import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { Activity, useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

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
  return { run: "Run", cycle: "Cycle", hike: "Trail Hike", walk: "Walk" }[type];
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
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatPace(activity: Activity): string {
  const distKm = activity.distance / 1000;
  if (distKm < 0.01 || activity.duration < 1) return "--'--\"";
  const secPerKm = activity.duration / distKm;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${String(sec).padStart(2, "0")}\"`;
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

function buildRoutePath(id: string, w: number, h: number): string {
  const rand = seededRand(hashStr(id));
  const pts: [number, number][] = [];
  const N = 10;
  for (let i = 0; i < N; i++) {
    pts.push([
      (i / (N - 1)) * w * 0.9 + w * 0.05,
      h * 0.15 + rand() * h * 0.7,
    ]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    const my = (pts[i - 1][1] + pts[i][1]) / 2;
    d += ` Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  return d;
}

const TYPE_GRADIENT: Record<Activity["type"], [string, string, string]> = {
  run:   ["#B8D898", "#7DB55A", "#5A8A3C"],
  cycle: ["#7DCFDF", "#3FAEC0", "#1E8A9E"],
  hike:  ["#D4BC82", "#A08040", "#7A6020"],
  walk:  ["#AABEBE", "#6E9090", "#4E7070"],
};

const TYPE_ICON: Record<Activity["type"], string> = {
  run: "walk",
  cycle: "bicycle",
  hike: "trail-sign",
  walk: "footsteps",
};

const BANNER_H = 118;
const BANNER_W = 340;

function ActivityCard({ activity }: { activity: Activity }) {
  const colors = useColors();
  const gradient = TYPE_GRADIENT[activity.type];
  const routePath = buildRoutePath(activity.id, BANNER_W, BANNER_H);
  const startX = BANNER_W * 0.05;
  const endX = BANNER_W * 0.95;
  const pace = formatPace(activity);
  const distKm = (activity.distance / 1000).toFixed(2);

  const stats = [
    {
      icon: "timer-outline",
      label: "Duration",
      value: formatDuration(activity.duration),
      color: gradient[1],
    },
    {
      icon: "flash",
      label: "Avg Speed",
      value: `${activity.avgSpeed.toFixed(1)} km/h`,
      color: "#088395",
    },
    {
      icon: "trending-up",
      label: "Elevation",
      value: `+${activity.elevationGain} m`,
      color: "#982598",
    },
    {
      icon: "navigate",
      label: "Pace",
      value: pace,
      color: "#F59E0B",
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: gradient[2] }]}>
      {/* Banner */}
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        {/* Route SVG */}
        <Svg
          width="100%"
          height={BANNER_H}
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
          preserveAspectRatio="none"
        >
          <Path
            d={routePath}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={routePath}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 5"
          />
          <SvgCircle cx={startX} cy={BANNER_H * 0.5} r={5} fill="rgba(255,255,255,0.9)" />
          <SvgCircle cx={endX} cy={BANNER_H * 0.5} r={7} fill="white" fillOpacity={0.3} />
          <SvgCircle cx={endX} cy={BANNER_H * 0.5} r={4} fill="white" />
        </Svg>

        {/* Top row */}
        <View style={styles.bannerTop}>
          <View style={styles.activityBadge}>
            <Icon name={TYPE_ICON[activity.type]} size={14} color="white" />
            <Text style={styles.activityBadgeText}>{getActivityLabel(activity.type)}</Text>
          </View>
          <View style={styles.videoBadge}>
            <Icon name="videocam" size={10} color="white" />
            <Text style={styles.videoBadgeText}>4K</Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bannerBottom}>
          <View>
            <Text style={styles.bannerTitle}>{getActivityName(activity)}</Text>
            <Text style={styles.bannerDate}>
              {getActivityDate(activity.startTime)} ·{" "}
              {new Date(activity.startTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.distBadge}>
            <Text style={styles.distValue}>{distKm}</Text>
            <Text style={styles.distUnit}>km</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats snapshot grid */}
      <View style={[styles.statsGrid, { borderBottomColor: colors.border }]}>
        {stats.map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.statCell,
              i % 2 === 0 && { borderRightWidth: 1, borderRightColor: colors.border },
              i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.statCellTop}>
              <View style={[styles.statIconDot, { backgroundColor: `${s.color}18` }]}>
                <Icon name={s.icon} size={11} color={s.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {s.label}
              </Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Footer actions */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: gradient[1] }]}
          activeOpacity={0.85}
        >
          <Icon name="play" size={13} color="white" />
          <Text style={styles.playBtnText}>Play Video</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
          activeOpacity={0.8}
        >
          <Icon name="share-outline" size={16} color={gradient[1]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
          activeOpacity={0.8}
        >
          <Icon name="ellipsis-vertical" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
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
  const recent = activities.slice(0, 5);
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
                { label: "Top Speed", value: topSpeed.toFixed(1) },
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
                  { width: `${progress}%` as any, backgroundColor: colors.primary },
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
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the record button to start your first journey!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16, paddingHorizontal: 16 }}>
            {recent.map((a) => (
              <ActivityCard key={a.id} activity={a} />
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

  /* ─── Activity Card ─── */
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  banner: {
    height: BANNER_H,
    padding: 12,
    justifyContent: "space-between",
  },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activityBadgeText: { color: "white", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  videoBadgeText: { color: "white", fontSize: 10, fontFamily: "Inter_700Bold" },
  bannerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bannerTitle: { color: "white", fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  bannerDate: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_400Regular" },
  distBadge: {
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  distValue: { color: "white", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 22 },
  distUnit: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "Inter_500Medium" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderBottomWidth: 1,
  },
  statCell: {
    width: "50%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 3,
    backgroundColor: "white",
  },
  statCellTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  statIconDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  playBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  playBtnText: { color: "white", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
