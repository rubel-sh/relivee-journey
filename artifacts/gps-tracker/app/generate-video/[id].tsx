import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";

import { Icon } from "@/components/Icon";
import { buildVideoGeneratorHTML } from "@/components/video-generator-template";
import { useActivities } from "@/context/ActivityContext";
import { useVideos } from "@/context/VideoContext";
import { useColors } from "@/hooks/useColors";

type Phase = "loading" | "generating" | "saving" | "done" | "error";

const RESOLUTION_MAP: Record<string, { w: number; h: number }> = {
  "720p": { w: 720, h: 720 },
  "1080p": { w: 1080, h: 1080 },
  "1440p": { w: 1440, h: 1440 },
};

const ORIENTATION_RATIOS: Record<string, { wRatio: number; hRatio: number }> = {
  square: { wRatio: 1, hRatio: 1 },
  portrait: { wRatio: 9, hRatio: 16 },
  landscape: { wRatio: 16, hRatio: 9 },
};

function resolveVideoDimensions(
  resolution: string,
  orientation: string
): { w: number; h: number } {
  const base = RESOLUTION_MAP[resolution] || RESOLUTION_MAP["1080p"];
  const ratio = ORIENTATION_RATIOS[orientation] || ORIENTATION_RATIOS["square"];
  if (ratio.wRatio === ratio.hRatio) return { w: base.w, h: base.h };
  const maxDim = base.w;
  if (ratio.wRatio > ratio.hRatio) {
    return { w: maxDim, h: Math.round(maxDim * (ratio.hRatio / ratio.wRatio)) };
  }
  return { w: Math.round(maxDim * (ratio.wRatio / ratio.hRatio)), h: maxDim };
}

export default function GenerateVideoScreen() {
  const params = useLocalSearchParams<{
    id: string;
    resolution?: string;
    fps?: string;
    speed?: string;
    orientation?: string;
  }>();
  const { id } = params;
  const videoResolution = params.resolution || "1080p";
  const videoFps = parseInt(params.fps || "30", 10);
  const videoSpeed = parseFloat(params.speed || "1");
  const videoOrientation = params.orientation || "square";
  const dims = resolveVideoDimensions(videoResolution, videoOrientation);
  const { activities } = useActivities();
  const { addVideo, setIsGenerating } = useVideos();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState<{ durationMs: number; fileSizeBytes: number } | null>(null);

  const chunksRef = useRef<string[]>([]);
  const videoMetaRef = useRef<{ mimeType: string; fileSizeBytes: number; totalChunks: number }>({
    mimeType: "video/webm",
    fileSizeBytes: 0,
    totalChunks: 0,
  });

  const activity = activities.find((a) => a.id === id);
  const isWeb = Platform.OS === "web";

  const getTimeOfDay = (ts: number) => {
    const h = new Date(ts).getHours();
    return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  };

  const typeLabels: Record<string, string> = { run: "Run", cycle: "Cycle", hike: "Hike", walk: "Walk" };

  const activityName = activity
    ? `${getTimeOfDay(activity.startTime)} ${typeLabels[activity.type] || "Activity"}`
    : "Activity";

  const htmlContent = activity
    ? buildVideoGeneratorHTML({
        activityName,
        activityType: activity.type,
        coordinates: activity.coordinates,
        distance: activity.distance,
        duration: activity.duration,
        elevationGain: activity.elevationGain,
        avgSpeed: activity.avgSpeed,
        videoDurationSec: 20,
        videoWidth: dims.w,
        videoHeight: dims.h,
        videoFps,
        playbackSpeed: videoSpeed,
      })
    : "";

  const handleMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);

        if (msg.type === "progress") {
          setPhase("generating");
          setProgress(msg.percent);
          setStatusText(msg.text || "Generating...");
        } else if (msg.type === "video-start") {
          setPhase("saving");
          videoMetaRef.current = {
            mimeType: msg.mimeType,
            fileSizeBytes: msg.fileSizeBytes,
            totalChunks: msg.totalChunks,
          };
          chunksRef.current = new Array(msg.totalChunks);
        } else if (msg.type === "video-chunk") {
          chunksRef.current[msg.index] = msg.data;
        } else if (msg.type === "video-complete") {
          setStatusText("Saving video...");
          setProgress(98);
          setPendingComplete({ durationMs: msg.durationMs, fileSizeBytes: msg.fileSizeBytes });
        } else if (msg.type === "error") {
          setPhase("error");
          setErrorMsg(msg.message);
          setIsGenerating(null);
        }
      } catch (e) {
        console.warn("Failed to parse WebView message:", e);
      }
    },
    [id, isWeb, addVideo, setIsGenerating]
  );

  useEffect(() => {
    if (!pendingComplete) return;
    const { durationMs, fileSizeBytes } = pendingComplete;

    (async () => {
      try {
        const base64Data = chunksRef.current.join("");
        const ext = videoMetaRef.current.mimeType.includes("mp4") ? "mp4" : "webm";
        const videoId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
        const fileName = `journey_${id}_${videoId}.${ext}`;

        if (!isWeb) {
          const dir = FileSystem.documentDirectory + "journey_videos/";
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          }
          const filePath = dir + fileName;
          await FileSystem.writeAsStringAsync(filePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await addVideo({
            id: videoId,
            activityId: id!,
            filePath,
            createdAt: Date.now(),
            durationMs,
            fileSize: fileSizeBytes,
          });
        } else {
          await addVideo({
            id: videoId,
            activityId: id!,
            filePath: "web-blob",
            createdAt: Date.now(),
            durationMs,
            fileSize: fileSizeBytes,
          });
        }

        setSavedVideoId(videoId);
        setIsGenerating(null);
        setPhase("done");
        setProgress(100);
        setStatusText("Video saved!");
      } catch (saveErr: any) {
        console.warn("Video save failed:", saveErr);
        setPhase("error");
        setErrorMsg(saveErr?.message || "Failed to save video file");
        setIsGenerating(null);
      }
    })();
  }, [pendingComplete]);

  if (!activity) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Icon name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text className="mt-4 text-lg font-inter-semibold" style={{ color: colors.foreground }}>
          Activity not found
        </Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.back()}
        >
          <Text className="text-white font-inter-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#000" }}>
      <View
        className="absolute z-10 flex-row items-center px-4"
        style={{ top: insets.top + 8 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          onPress={() => {
            setIsGenerating(null);
            router.back();
          }}
        >
          <Icon name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="ml-3 text-white text-[16px] font-inter-semibold">
          {phase === "done" ? "Video Ready" : "Generating Video"}
        </Text>
      </View>

      {phase !== "done" && phase !== "error" && (
        <View className="absolute z-10 items-center" style={{ bottom: insets.bottom + 100, left: 0, right: 0 }}>
          <View className="bg-black/70 rounded-2xl px-6 py-4 items-center" style={{ width: 280 }}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
            <Text className="text-white text-[14px] font-inter-semibold mb-2">{statusText}</Text>
            <View className="w-full h-[4px] rounded bg-white/15 overflow-hidden">
              <View
                className="h-full rounded"
                style={{ width: `${progress}%`, backgroundColor: colors.primary }}
              />
            </View>
            <Text className="text-white/50 text-[11px] font-inter-regular mt-2">
              {progress}% complete
            </Text>
          </View>
        </View>
      )}

      {phase === "done" && (
        <View className="absolute z-10 items-center" style={{ bottom: insets.bottom + 80, left: 0, right: 0 }}>
          <View className="bg-black/70 rounded-2xl px-6 py-5 items-center" style={{ width: 280 }}>
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${colors.primary}30` }}
            >
              <Icon name="checkmark-circle" size={32} color={colors.primary} />
            </View>
            <Text className="text-white text-[16px] font-inter-bold mb-1">Video Generated!</Text>
            <Text className="text-white/60 text-[12px] font-inter-regular mb-4">
              Saved to your Journey Videos
            </Text>
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={() => {
                router.back();
                setTimeout(() => router.push(`/video-replay/${id}`), 100);
              }}
            >
              <Icon name="play" size={18} color="white" />
              <Text className="text-white text-[14px] font-inter-bold">Play Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 py-3 mt-2 rounded-xl border border-white/25"
              onPress={() => {
                router.back();
                setTimeout(() => router.push("/(tabs)/videos"), 100);
              }}
            >
              <Icon name="film" size={16} color="white" />
              <Text className="text-white text-[14px] font-inter-semibold">Go to Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full items-center py-3 mt-1"
              onPress={() => router.back()}
            >
              <Text className="text-white/50 text-[13px] font-inter-regular">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === "error" && (
        <View className="absolute z-10 items-center" style={{ bottom: insets.bottom + 100, left: 0, right: 0 }}>
          <View className="bg-black/70 rounded-2xl px-6 py-5 items-center" style={{ width: 280 }}>
            <Icon name="alert-circle" size={32} color="#F44336" />
            <Text className="text-white text-[14px] font-inter-semibold mt-3 mb-1">
              Generation Failed
            </Text>
            <Text className="text-white/60 text-[12px] font-inter-regular text-center mb-4">
              {errorMsg || "An unexpected error occurred"}
            </Text>
            <TouchableOpacity
              className="w-full items-center py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.back()}
            >
              <Text className="text-white text-[14px] font-inter-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isWeb ? (
        <WebView
          source={{ html: htmlContent }}
          style={{ flex: 1, backgroundColor: "#000" }}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          onMessage={handleMessage}
          onError={() => {
            setPhase("error");
            setErrorMsg("WebView failed to load");
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/60 text-[14px] font-inter-regular text-center px-8">
            3D video generation requires a native device.{"\n"}
            Use the Expo Go app to generate videos.
          </Text>
          <TouchableOpacity
            className="mt-4 px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.back()}
          >
            <Text className="text-white font-inter-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
