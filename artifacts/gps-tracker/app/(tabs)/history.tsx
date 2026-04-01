import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Activity, useActivities } from "@/context/ActivityContext";
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

const TYPE_ICON: Record<Activity["type"], React.ComponentProps<typeof Ionicons>["name"]> = {
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
  const [expanded, setExpanded] = useState(false);
  const gradient = TYPE_GRADIENT[activity.type];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
    >
      <View style={styles.cardRow}>
        <LinearGradient colors={gradient} style={styles.miniMap}>
          <Ionicons name={TYPE_ICON[activity.type]} size={20} color="white" />
        </LinearGradient>

        <View style={styles.cardInfo}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {getActivityName(activity)}
            </Text>
            {activity.elevationGain > 100 && (
              <View style={[styles.videoBadge, { backgroundColor: `${colors.trace}18` }]}>
                <Ionicons name="videocam" size={11} color={colors.trace} />
                <Text style={[styles.videoBadgeText, { color: colors.trace }]}>Video</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {formatDate(activity.startTime)}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="map-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {(activity.distance / 1000).toFixed(1)} km
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="timer-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {formatDuration(activity.duration)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="flash-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {activity.avgSpeed.toFixed(1)} km/h
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={[styles.expandedRow, { borderTopColor: colors.border }]}>
          <View style={styles.expandedStats}>
            <View style={styles.expandedStat}>
              <View style={[styles.expandedStatIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="flash" size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.expandedVal, { color: colors.foreground }]}>
                  {activity.maxSpeed.toFixed(1)} km/h
                </Text>
                <Text style={[styles.expandedLabel, { color: colors.mutedForeground }]}>
                  max speed
                </Text>
              </View>
            </View>
            <View style={styles.expandedStat}>
              <View style={[styles.expandedStatIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="trending-up" size={14} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.expandedVal, { color: colors.foreground }]}>
                  +{activity.elevationGain}m
                </Text>
                <Text style={[styles.expandedLabel, { color: colors.mutedForeground }]}>
                  elevation
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="play" size={14} color="white" />
            <Text style={styles.playBtnText}>Video</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const [filter, setFilter] = useState<FilterType>("all");
  const isWeb = Platform.OS === "web";

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.type === filter);

  const totalDist = activities.reduce((s, a) => s + a.distance, 0) / 1000;
  const topSpeed =
    activities.length > 0 ? Math.max(...activities.map((a) => a.maxSpeed)) : 0;

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Activity History
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          {activities.length} activities recorded
        </Text>
      </View>

      <View style={[styles.summaryStrip, { backgroundColor: "#1A2A1A" }]}>
        {[
          { label: "Distance", value: `${totalDist.toFixed(1)} km` },
          { label: "Top Speed", value: `${topSpeed.toFixed(1)} km/h` },
          { label: "Videos", value: String(activities.length) },
          { label: "Trips", value: String(activities.length) },
        ].map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.summaryItem,
              i < 3 && { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" },
            ]}
          >
            <Text style={styles.summaryValue}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterRow}>
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
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? "white" : colors.foreground },
                  ]}
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
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No activities match this filter
            </Text>
          </View>
        }
        renderItem={({ item }) => <HistoryCard activity={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pageSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  summaryValue: {
    color: "white",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  filterRow: { marginBottom: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  miniMap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  videoBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  statVal: { fontSize: 11, fontFamily: "Inter_500Medium" },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexWrap: "wrap",
    gap: 8,
  },
  expandedStats: { flexDirection: "row", gap: 16, flexShrink: 1 },
  expandedStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  expandedStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  expandedVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  expandedLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playBtnText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
});
