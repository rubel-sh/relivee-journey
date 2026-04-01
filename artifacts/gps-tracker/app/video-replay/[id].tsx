import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Icon } from "@/components/Icon";
import { buildReplayHtml } from "@/components/replay-template";
import { useActivities } from "@/context/ActivityContext";
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [replayState, setReplayState] = useState<"idle" | "playing" | "paused" | "done">("idle");

  const activity = activities.find((a) => a.id === id);

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

  const activityName = `${getTimeOfDay(activity.startTime)} ${TYPE_LABELS[activity.type] || "Activity"}`;

  const html = buildReplayHtml({
    coordinates: activity.coordinates,
    activityType: activity.type,
    distance: activity.distance,
    duration: activity.duration,
    elevationGain: activity.elevationGain,
    activityName,
  });

  const sendMessage = (msg: object) => {
    webRef.current?.injectJavaScript(
      `window.postMessage(${JSON.stringify(JSON.stringify(msg))}, "*"); true;`
    );
  };

  const handlePlayPause = () => {
    if (replayState === "idle" || replayState === "done") {
      sendMessage({ type: "play" });
      setReplayState("playing");
    } else if (replayState === "playing") {
      sendMessage({ type: "pause" });
      setReplayState("paused");
    } else if (replayState === "paused") {
      sendMessage({ type: "resume" });
      setReplayState("playing");
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSpeed = () => {
    sendMessage({ type: "speed" });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "replay_complete") {
        setReplayState("done");
      }
    } catch {}
  };

  const isWeb = Platform.OS === "web";

  return (
    <View className="flex-1" style={{ backgroundColor: "#1a1a2e" }}>
      <View
        className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
        style={{ paddingTop: isWeb ? 12 : insets.top + 4, paddingBottom: 8 }}
      >
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(10,10,20,0.7)" }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        >
          <Icon name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-[15px] font-inter-semibold" numberOfLines={1}>
          {activityName}
        </Text>

        <View className="w-9" />
      </View>

      {isWeb ? (
        <View className="flex-1">
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "100%", border: "none" } as any}
          />
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ html }}
          style={{ flex: 1, backgroundColor: "#1a1a2e" }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onWebViewMessage}
          originWhitelist={["*"]}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}
