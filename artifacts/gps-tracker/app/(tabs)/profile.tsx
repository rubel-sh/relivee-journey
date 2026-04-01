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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities, clearActivities } = useActivities();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const totalKm = activities.reduce((s, a) => s + a.distance, 0) / 1000;
  const totalTime = activities.reduce((s, a) => s + a.duration, 0);
  const totalElev = activities.reduce((s, a) => s + a.elevationGain, 0);

  const settings = [
    { icon: "notifications-outline" as const, label: "Notifications", value: "On" },
    { icon: "map-outline" as const, label: "Map Style", value: "Voyager" },
    { icon: "videocam-outline" as const, label: "Video Quality", value: "4K · 60fps" },
    { icon: "cloud-upload-outline" as const, label: "Auto Backup", value: "On" },
    { icon: "moon-outline" as const, label: "Dark Mode", value: "Auto" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={{ paddingTop: topPadding }}>
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>A</Text>
          </LinearGradient>
          <Text style={[styles.name, { color: colors.foreground }]}>Alex</Text>
          <Text style={[styles.since, { color: colors.mutedForeground }]}>
            Journey member since 2024
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: "#1A2A1A" }]}>
          {[
            { label: "Total Distance", value: `${totalKm.toFixed(1)} km` },
            { label: "Total Time", value: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m` },
            { label: "Elevation", value: `${totalElev}m` },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.statBlock,
                i < 2 && { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" },
              ]}
            >
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>SETTINGS</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {settings.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              style={[
                styles.settingsRow,
                i < settings.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={s.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                {s.label}
              </Text>
              <View style={styles.settingsRight}>
                <Text style={[styles.settingsValue, { color: colors.mutedForeground }]}>
                  {s.value}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>DATA</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingsRow} onPress={clearActivities}>
            <View style={[styles.settingsIcon, { backgroundColor: "#FF444415" }]}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.settingsLabel, { color: colors.destructive }]}>
              Clear All Activities
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "white", fontSize: 32, fontFamily: "Inter_700Bold" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  since: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  statBlock: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statVal: { color: "white", fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  section: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  settingsValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
