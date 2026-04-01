import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useActivities } from "@/context/ActivityContext";
import { useVideos } from "@/context/VideoContext";
import { useColors } from "@/hooks/useColors";

const TYPE_LABELS: Record<string, string> = {
  run: "Run",
  cycle: "Cycle",
  hike: "Hike",
  walk: "Walk",
};

function getTimeOfDay(ts: number) {
  const h = new Date(ts).getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

export default function VideoReplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities } = useActivities();
  const { getVideoForActivity } = useVideos();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showControls, setShowControls] = useState(true);

  const activity = activities.find((a) => a.id === id);
  const video = activity ? getVideoForActivity(activity.id) : undefined;

  const player = useVideoPlayer(video?.filePath ?? "", (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!activity) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Icon name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text className="mt-4 text-lg font-inter-semibold" style={{ color: colors.foreground }}>Activity not found</Text>
        <TouchableOpacity className="mt-4 px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }} onPress={() => router.back()}>
          <Text className="text-white font-inter-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!video || !video.filePath || video.filePath === "web-blob") {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Icon name="film" size={48} color={colors.mutedForeground} />
        <Text className="mt-4 text-lg font-inter-semibold" style={{ color: colors.foreground }}>No video found</Text>
        <Text className="mt-2 text-sm text-center px-8" style={{ color: colors.mutedForeground }}>
          Generate a 3D video for this activity first
        </Text>
        <TouchableOpacity className="mt-4 px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }} onPress={() => router.back()}>
          <Text className="text-white font-inter-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activityName = `${getTimeOfDay(activity.startTime)} ${TYPE_LABELS[activity.type] || "Activity"}`;

  return (
    <View className="flex-1" style={{ backgroundColor: "#000" }}>
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1"
        onPress={() => setShowControls(!showControls)}
      >
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
        />
      </TouchableOpacity>

      {showControls && (
        <View
          className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
          style={{ paddingTop: Platform.OS === "web" ? 12 : insets.top + 4, paddingBottom: 8, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-[15px] font-inter-semibold flex-1 text-center" numberOfLines={1}>
            {activityName}
          </Text>

          <View className="w-9" />
        </View>
      )}

      {showControls && (
        <View
          className="absolute bottom-0 left-0 right-0 z-10 flex-row items-center justify-center gap-6 px-4"
          style={{ paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 16, paddingTop: 16, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (player.playing) {
                player.pause();
              } else {
                player.play();
              }
              setShowControls(true);
            }}
          >
            <Icon name={player.playing ? "pause" : "play"} size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
