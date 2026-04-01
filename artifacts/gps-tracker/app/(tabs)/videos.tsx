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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { Activity, useActivities } from "@/context/ActivityContext";
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
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function getTimeOfDay(ts: number) {
  const h = new Date(ts).getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

function VideoCard({ activity }: { activity: Activity }) {
  const colors = useColors();
  const gradient = (TYPE_GRADIENT[activity.type] ?? ["#6D9E51", "#088395"]) as [string, string];
  const label = TYPE_LABEL[activity.type] ?? "Activity";
  const tod = getTimeOfDay(activity.startTime);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={gradient} style={styles.thumbnail}>
        <View style={styles.activityIconBadge}>
          <Icon name={TYPE_ICON[activity.type]} size={14} color="rgba(255,255,255,0.9)" />
        </View>

        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Icon name="play" size={18} color="white" />
          </View>
        </View>

        <View style={styles.bottomBadges}>
          <View style={styles.qualityBadge}>
            <Icon name="videocam" size={9} color="white" />
            <Text style={styles.qualityText}>4K</Text>
          </View>
          <Text style={styles.durationBadge}>{formatDuration(activity.duration)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
          {tod} {label}
        </Text>
        <Text style={[styles.cardDate, { color: colors.mutedForeground }]} numberOfLines={1}>
          {new Date(activity.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Icon name="map-outline" size={10} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {(activity.distance / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.statChip}>
            <Icon name="trending-up" size={10} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              +{activity.elevationGain}m
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Icon name="play" size={11} color="white" />
            <Text style={styles.actionBtnText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: `${colors.primary}12`, borderColor: colors.border }]}
          >
            <Icon name="share-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const videoActivities = activities.filter((a) => a.elevationGain > 30);

  const pairs: Activity[][] = [];
  for (let i = 0; i < videoActivities.length; i += 2) {
    pairs.push(videoActivities.slice(i, i + 2));
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Journey Videos</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {videoActivities.length} videos generated · 4K · 60fps
        </Text>
      </View>

      {videoActivities.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}12` }]}>
            <Icon name="videocam-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No videos yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Record an activity with elevation gain to generate a 3D video
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {pairs.map((pair, pi) => (
            <View key={pi} style={styles.row}>
              {pair.map((a) => (
                <VideoCard key={a.id} activity={a} />
              ))}
              {pair.length === 1 && <View style={styles.halfCell} />}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAP = 12;
const H_PAD = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const THUMB_HEIGHT = CARD_WIDTH * 0.62;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  grid: { paddingHorizontal: H_PAD, gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  halfCell: { flex: 1 },

  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: THUMB_HEIGHT,
  },
  activityIconBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bottomBadges: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qualityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityText: { color: "white", fontSize: 9, fontFamily: "Inter_700Bold" },
  durationBadge: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  cardBody: { padding: 10, gap: 4 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", lineHeight: 17 },
  cardDate: { fontSize: 11, fontFamily: "Inter_400Regular" },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 10, fontFamily: "Inter_500Medium" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  empty: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 12,
  },
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
