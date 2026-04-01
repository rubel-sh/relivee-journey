import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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

const AUTO_HIDE_MS = 3000;

export default function VideoReplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities } = useActivities();
  const { getVideoForActivity } = useVideos();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showControls, setShowControls] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activity = activities.find((a) => a.id === id);
  const video = activity ? getVideoForActivity(activity.id) : undefined;

  const player = useVideoPlayer(video?.filePath ?? "", (p) => {
    p.loop = true;
    p.play();
  });

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), AUTO_HIDE_MS);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => {
      if (!prev) {
        resetHideTimer();
        return true;
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return false;
    });
  }, [resetHideTimer]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  const handleExport = async () => {
    if (!video?.filePath || video.filePath === "web-blob") return;
    setExporting(true);
    revealControls();

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Not Available", "Sharing is not available on this device.");
        setExporting(false);
        return;
      }

      await Sharing.shareAsync(video.filePath, {
        mimeType: "video/mp4",
        dialogTitle: "Save Journey Video",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.warn("Export failed:", err);
      Alert.alert("Export Failed", err?.message || "Could not export the video.");
    } finally {
      setExporting(false);
    }
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setShowControls(true);
    } else {
      player.play();
      setIsPlaying(true);
      resetHideTimer();
    }
  };

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
        onPress={toggleControls}
      >
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
        />
      </TouchableOpacity>

      {showControls && (
        <>
          <View
            className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
            style={{ paddingTop: Platform.OS === "web" ? 12 : insets.top + 4, paddingBottom: 10, backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            >
              <Icon name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-[15px] font-inter-semibold flex-1 text-center mx-3" numberOfLines={1}>
              {activityName}
            </Text>

            {Platform.OS !== "web" && (
              <TouchableOpacity
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", opacity: exporting ? 0.5 : 1 }}
                disabled={exporting}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleExport();
                }}
              >
                <Icon name="download" size={18} color="white" />
              </TouchableOpacity>
            )}
            {Platform.OS === "web" && <View className="w-10" />}
          </View>

          <View
            className="absolute inset-0 z-10 items-center justify-center"
            pointerEvents="box-none"
          >
            <TouchableOpacity
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onPress={handlePlayPause}
            >
              <Icon name={isPlaying ? "pause" : "play"} size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View
            className="absolute bottom-0 left-0 right-0 z-10 items-center px-4"
            style={{ paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 16, paddingTop: 14, backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            {Platform.OS !== "web" && (
              <TouchableOpacity
                className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", opacity: exporting ? 0.5 : 1 }}
                disabled={exporting}
                onPress={handleExport}
              >
                <Icon name="download" size={16} color="white" />
                <Text className="text-white text-[13px] font-inter-semibold">
                  {exporting ? "Exporting..." : "Export to Device"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}
