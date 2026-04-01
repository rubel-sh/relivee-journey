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

import { useActivities } from "@/context/ActivityContext";
import { useColors } from "@/hooks/useColors";

const TYPE_GRADIENT: Record<string, [string, string]> = {
  run: ["#A8C97F", "#6D9E51"],
  cycle: ["#5BB8C8", "#088395"],
  hike: ["#C8A86B", "#8B6914"],
  walk: ["#9BB5B5", "#5B7070"],
};

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useActivities();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const videoActivities = activities.filter((a) => a.elevationGain > 30);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Journey Videos</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {videoActivities.length} videos generated · 4K · 60fps
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {videoActivities.map((a) => {
          const h = new Date(a.startTime).getHours();
          const tod = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
          const label = { run: "Run", cycle: "Cycle", hike: "Trail Hike", walk: "Walk" }[a.type];
          const gradient = TYPE_GRADIENT[a.type] ?? ["#6D9E51", "#088395"] as [string, string];

          return (
            <View
              key={a.id}
              style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <LinearGradient
                colors={gradient}
                style={styles.thumbnail}
              >
                <View style={styles.playOverlay}>
                  <View style={styles.playCircle}>
                    <Ionicons name="play" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.qualityBadge}>
                  <Ionicons name="videocam" size={11} color="white" />
                  <Text style={styles.qualityText}>4K · 60fps</Text>
                </View>
                <Text style={styles.durationBadge}>
                  {Math.floor(a.duration / 60)}:{String(a.duration % 60).padStart(2, "0")}
                </Text>
              </LinearGradient>
              <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, { color: colors.foreground }]}>
                  {tod} {label}
                </Text>
                <Text style={[styles.videoMeta, { color: colors.mutedForeground }]}>
                  {new Date(a.startTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {(a.distance / 1000).toFixed(1)} km
                </Text>
              </View>
              <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border }]}>
                <Ionicons name="share-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 100,
    height: 72,
    justifyContent: "flex-end",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  qualityBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qualityText: { color: "white", fontSize: 9, fontFamily: "Inter_600SemiBold" },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoInfo: { flex: 1, paddingHorizontal: 12 },
  videoTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
  videoMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shareBtn: {
    padding: 14,
    borderLeftWidth: 1,
  },
});
