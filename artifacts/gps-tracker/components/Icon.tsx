import {
  ArrowLeft,
  Bell,
  Bike,
  Calendar,
  ChartBar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock,
  CloudUpload,
  Ellipsis,
  EllipsisVertical,
  Flag,
  Flame,
  Footprints,
  Map,
  MapPin,
  Moon,
  Navigation,
  Pause,
  PersonStanding,
  Play,
  Share2,
  Signpost,
  Square,
  Timer,
  Trash2,
  TrendingUp,
  User,
  Video,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  "alert-circle": CircleAlert,
  "arrow-back": ArrowLeft,
  "arrow-back-outline": ArrowLeft,
  "bar-chart-outline": ChartBar,
  "bar-chart": ChartBar,
  "bicycle": Bike,
  "calendar-outline": Calendar,
  "calendar": Calendar,
  "check": Check,
  "checkmark": Check,
  "checkmark-circle": CheckCircle,
  "chevron-down": ChevronDown,
  "chevron-forward": ChevronRight,
  "chevron-up": ChevronUp,
  "close": X,
  "cloud-upload-outline": CloudUpload,
  "ellipsis-horizontal": Ellipsis,
  "ellipsis-vertical": EllipsisVertical,
  "flag-outline": Flag,
  "flame": Flame,
  "flame-outline": Flame,
  "flash": Zap,
  "flash-outline": Zap,
  "footsteps": Footprints,
  "location-outline": MapPin,
  "map-outline": Map,
  "moon-outline": Moon,
  "navigate": Navigation,
  "notifications-outline": Bell,
  "pause": Pause,
  "person-outline": User,
  "person": User,
  "play": Play,
  "share-outline": Share2,
  "square": Square,
  "time-outline": Clock,
  "time": Clock,
  "timer-outline": Timer,
  "trail-sign": Signpost,
  "trash-outline": Trash2,
  "trash": Trash2,
  "trending-up": TrendingUp,
  "trending-up-outline": TrendingUp,
  "videocam": Video,
  "videocam-outline": Video,
  "walk": PersonStanding,
  "x": X,
};

export type IconName = keyof typeof ICON_MAP;

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: any;
};

export function Icon({ name, size = 24, color = "#000", style }: IconProps) {
  const LucideComp = ICON_MAP[name];
  if (!LucideComp) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }
  return <LucideComp size={size} color={color} style={style} strokeWidth={2} />;
}
