import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";

export interface VideoOptions {
  resolution: "720p" | "1080p" | "1440p";
  fps: 24 | 30 | 60;
  speed: 0.5 | 1 | 1.5 | 2;
  orientation: "square" | "portrait" | "landscape";
}

const RESOLUTIONS: { key: VideoOptions["resolution"]; label: string; desc: string }[] = [
  { key: "720p", label: "720p", desc: "Fast render" },
  { key: "1080p", label: "1080p", desc: "Recommended" },
  { key: "1440p", label: "1440p", desc: "High quality" },
];

const FPS_OPTIONS: { key: VideoOptions["fps"]; label: string; desc: string }[] = [
  { key: 24, label: "24 fps", desc: "Cinematic" },
  { key: 30, label: "30 fps", desc: "Standard" },
  { key: 60, label: "60 fps", desc: "Smooth" },
];

const SPEED_OPTIONS: { key: VideoOptions["speed"]; label: string; desc: string }[] = [
  { key: 0.5, label: "0.5x", desc: "Slow motion" },
  { key: 1, label: "1x", desc: "Normal" },
  { key: 1.5, label: "1.5x", desc: "Faster" },
  { key: 2, label: "2x", desc: "Double" },
];

const ORIENTATION_OPTIONS: { key: VideoOptions["orientation"]; label: string; icon: string; desc: string }[] = [
  { key: "square", label: "Square", icon: "square-outline", desc: "1:1" },
  { key: "portrait", label: "Portrait", icon: "phone-portrait-outline", desc: "9:16" },
  { key: "landscape", label: "Landscape", icon: "phone-landscape-outline", desc: "16:9" },
];

interface VideoOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (options: VideoOptions) => void;
  activityName?: string;
}

function OptionChip({
  label,
  desc,
  selected,
  onPress,
  color,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      className="flex-1 items-center py-2.5 rounded-xl border"
      style={{
        backgroundColor: selected ? `${color}15` : colors.card,
        borderColor: selected ? color : colors.border,
        borderWidth: selected ? 1.5 : 1,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        className="text-[14px] font-inter-bold"
        style={{ color: selected ? color : colors.foreground }}
      >
        {label}
      </Text>
      <Text
        className="text-[10px] font-inter-regular mt-0.5"
        style={{ color: selected ? color : colors.mutedForeground }}
      >
        {desc}
      </Text>
    </TouchableOpacity>
  );
}

export default function VideoOptionsModal({
  visible,
  onClose,
  onGenerate,
  activityName,
}: VideoOptionsModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [resolution, setResolution] = useState<VideoOptions["resolution"]>("1080p");
  const [fps, setFps] = useState<VideoOptions["fps"]>(30);
  const [speed, setSpeed] = useState<VideoOptions["speed"]>(1);
  const [orientation, setOrientation] = useState<VideoOptions["orientation"]>("square");

  const handleGenerate = () => {
    onGenerate({ resolution, fps, speed, orientation });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className="rounded-t-3xl"
          style={{
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View className="items-center pt-3 pb-1">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: colors.border }}
            />
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          >
            <View className="flex-row items-center gap-3 mt-3 mb-1">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${colors.accent}15` }}
              >
                <Icon name="settings-outline" size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[18px] font-inter-bold"
                  style={{ color: colors.foreground }}
                >
                  Video Settings
                </Text>
                {activityName && (
                  <Text
                    className="text-[12px] font-inter-regular"
                    style={{ color: colors.mutedForeground }}
                  >
                    {activityName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Icon name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-[13px] font-inter-semibold mt-5 mb-2"
              style={{ color: colors.foreground }}
            >
              Resolution
            </Text>
            <View className="flex-row gap-2">
              {RESOLUTIONS.map((r) => (
                <OptionChip
                  key={r.key}
                  label={r.label}
                  desc={r.desc}
                  selected={resolution === r.key}
                  onPress={() => setResolution(r.key)}
                  color={colors.primary}
                />
              ))}
            </View>

            <Text
              className="text-[13px] font-inter-semibold mt-4 mb-2"
              style={{ color: colors.foreground }}
            >
              Frame Rate
            </Text>
            <View className="flex-row gap-2">
              {FPS_OPTIONS.map((f) => (
                <OptionChip
                  key={f.key}
                  label={f.label}
                  desc={f.desc}
                  selected={fps === f.key}
                  onPress={() => setFps(f.key)}
                  color={colors.accent}
                />
              ))}
            </View>

            <Text
              className="text-[13px] font-inter-semibold mt-4 mb-2"
              style={{ color: colors.foreground }}
            >
              Playback Speed
            </Text>
            <View className="flex-row gap-2">
              {SPEED_OPTIONS.map((s) => (
                <OptionChip
                  key={s.key}
                  label={s.label}
                  desc={s.desc}
                  selected={speed === s.key}
                  onPress={() => setSpeed(s.key)}
                  color={colors.trace}
                />
              ))}
            </View>

            <Text
              className="text-[13px] font-inter-semibold mt-4 mb-2"
              style={{ color: colors.foreground }}
            >
              Orientation
            </Text>
            <View className="flex-row gap-2">
              {ORIENTATION_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  className="flex-1 items-center py-2.5 rounded-xl border"
                  style={{
                    backgroundColor:
                      orientation === o.key
                        ? `${colors.primary}15`
                        : colors.card,
                    borderColor:
                      orientation === o.key ? colors.primary : colors.border,
                    borderWidth: orientation === o.key ? 1.5 : 1,
                  }}
                  onPress={() => setOrientation(o.key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={o.icon}
                    size={18}
                    color={
                      orientation === o.key
                        ? colors.primary
                        : colors.mutedForeground
                    }
                  />
                  <Text
                    className="text-[13px] font-inter-bold mt-1"
                    style={{
                      color:
                        orientation === o.key
                          ? colors.primary
                          : colors.foreground,
                    }}
                  >
                    {o.label}
                  </Text>
                  <Text
                    className="text-[10px] font-inter-regular"
                    style={{
                      color:
                        orientation === o.key
                          ? colors.primary
                          : colors.mutedForeground,
                    }}
                  >
                    {o.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl mt-4"
              style={{ backgroundColor: `${colors.accent}10` }}
            >
              <Icon name="information-circle-outline" size={16} color={colors.accent} />
              <Text
                className="flex-1 text-[11px] font-inter-regular"
                style={{ color: colors.accent }}
              >
                Higher resolution and FPS will take longer to generate
              </Text>
            </View>

            <TouchableOpacity
              className="mt-4 rounded-2xl overflow-hidden"
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.accent, "#066B7A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center gap-2.5 py-4"
              >
                <Icon name="film" size={20} color="white" />
                <Text className="text-white text-[16px] font-inter-bold">
                  Generate Video
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
