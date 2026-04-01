import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
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
    { icon: "notifications-outline", label: "Notifications", value: "On" },
    { icon: "map-outline", label: "Map Style", value: "Voyager" },
    { icon: "videocam-outline", label: "Video Quality", value: "4K · 60fps" },
    { icon: "cloud-upload-outline", label: "Auto Backup", value: "On" },
    { icon: "moon-outline", label: "Dark Mode", value: "Auto" },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={{ paddingTop: topPadding }}>
        <View className="items-center py-6">
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
          >
            <Text className="text-white text-[32px] font-inter-bold">A</Text>
          </LinearGradient>
          <Text className="text-2xl font-inter-bold" style={{ color: colors.foreground }}>Alex</Text>
          <Text className="text-[13px] font-inter-regular mt-1" style={{ color: colors.mutedForeground }}>
            Journey member since 2024
          </Text>
        </View>

        <View className="flex-row mx-4 rounded-2xl mb-6 overflow-hidden bg-[#1A2A1A]">
          {[
            { label: "Total Distance", value: `${totalKm.toFixed(1)} km` },
            { label: "Total Time", value: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m` },
            { label: "Elevation", value: `${totalElev}m` },
          ].map((s, i) => (
            <View
              key={s.label}
              className="flex-1 items-center py-4"
              style={i < 2 ? { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" } : undefined}
            >
              <Text className="text-white text-lg font-inter-bold">{s.value}</Text>
              <Text className="text-white/50 text-[11px] font-inter-regular mt-[3px]">{s.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-[11px] font-inter-semibold tracking-[0.8px] px-5 mb-2" style={{ color: colors.mutedForeground }}>
          SETTINGS
        </Text>
        <View
          className="mx-4 rounded-2xl border overflow-hidden mb-6"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          {settings.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              className="flex-row items-center px-4 py-3.5 gap-3"
              style={i < settings.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
            >
              <View
                className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Icon name={s.icon} size={18} color={colors.primary} />
              </View>
              <Text className="flex-1 text-[15px] font-inter-medium" style={{ color: colors.foreground }}>
                {s.label}
              </Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-[13px] font-inter-regular" style={{ color: colors.mutedForeground }}>
                  {s.value}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[11px] font-inter-semibold tracking-[0.8px] px-5 mb-2" style={{ color: colors.mutedForeground }}>
          DATA
        </Text>
        <View
          className="mx-4 rounded-2xl border overflow-hidden mb-6"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={clearActivities}>
            <View className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-[#FF444415]">
              <Icon name="trash-outline" size={18} color={colors.destructive} />
            </View>
            <Text className="flex-1 text-[15px] font-inter-medium" style={{ color: colors.destructive }}>
              Clear All Activities
            </Text>
            <Icon name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
