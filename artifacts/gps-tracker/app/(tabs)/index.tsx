import { Ionicons } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Activity, useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1);
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
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_GRADIENT: Record<
  Activity["type"],
  [string, string]
> = {
  run: ["#A8C97F", "#6D9E51"],
  cycle: ["#5BB8C8", "#088395"],
  hike: ["#C8A86B", "#8B6914"],
  walk: ["#9BB5B5", "#5B7070"],
};

const TYPE_ICON: Record<Activity["type"], React.ComponentProps<typeof Ionicons>["name"]> = {
  run: "walk",
  cycle: "bicycle",
  hike: "trail-sign",
  walk: "footsteps",
};

function ActivityCard({ activity }: { activity: Activity }) {
  const colors = useColors();
  const gradient = TYPE_GRADIENT[activity.type];
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderContent}>
          <Ionicons name={TYPE_ICON[activity.type]} size={18} color="rgba(255,255,255,0.85)" />
        </View>
        <View style={styles.videoTag}>
          <Ionicons name="videocam" size={10} color="rgba(255,255,255,0.9)" />
          <Text style={styles.videoTagText}>4K Video</Text>
        </View>
        <Text style={styles.distanceBadge}>
          {formatDistance(activity.distance)} km
        </Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {getActivityName(activity)}
          </Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
          {getActivityDate(activity.startTime)} ·{" "}
          {new Date(activity.startTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="timer-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {formatDuration(activity.duration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {activity.maxSpeed.toFixed(1)} km/h max
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {activity.elevationGain}m
            </Text>
          </View>
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
  const topSpeed =
    weekActivities.length > 0
      ? Math.max(...weekActivities.map((a) => a.maxSpeed))
      : 0;
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
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good morning, Alex
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Your Journey
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekCard}>
          <LinearGradient
            colors={["#2A3A2A", "#1A2A1A"]}
            style={styles.weekGradient}
          >
            <View style={styles.weekTop}>
              <Text style={styles.weekLabel}>This Week</Text>
              <View style={styles.weekBadge}>
                <Ionicons name="trending-up" size={12} color="#6D9E51" />
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
              <Text style={styles.goalLabel}>
                Weekly goal: {weeklyGoal} km
              </Text>
              <Text style={styles.goalPct}>{Math.round(progress)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%` as any,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activities
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="map-outline"
              size={48}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              No activities yet. Tap the record button to start tracking!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
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
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
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
  weekLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(109,158,81,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  weekBadgeText: {
    color: "#6D9E51",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  weekDistance: {
    color: "white",
    fontSize: 46,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  weekUnit: { fontSize: 22, color: "rgba(255,255,255,0.7)" },
  weekStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekStatItem: { alignItems: "center" },
  weekStatValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  weekStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  goalPct: {
    color: "#6D9E51",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardHeader: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 12,
  },
  cardHeaderContent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoTagText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  distanceBadge: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  cardBody: { padding: 12 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
