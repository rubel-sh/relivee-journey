import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface GeneratedVideo {
  id: string;
  activityId: string;
  filePath: string;
  createdAt: number;
  durationMs: number;
  fileSize: number;
}

interface VideoContextType {
  videos: GeneratedVideo[];
  addVideo: (video: GeneratedVideo) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  getVideoForActivity: (activityId: string) => GeneratedVideo | undefined;
  isGenerating: string | null;
  setIsGenerating: (activityId: string | null) => void;
}

const STORAGE_KEY = "@journey_videos_v1";

const VideoContext = createContext<VideoContextType>({
  videos: [],
  addVideo: async () => {},
  deleteVideo: async () => {},
  getVideoForActivity: () => undefined,
  isGenerating: null,
  setIsGenerating: () => {},
});

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setVideos(JSON.parse(stored) as GeneratedVideo[]);
        }
      } catch (e) {
        console.warn("Failed to load videos:", e);
      }
    })();
  }, []);

  const addVideo = useCallback(
    async (video: GeneratedVideo) => {
      const updated = [video, ...videos];
      setVideos(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save video:", e);
      }
    },
    [videos]
  );

  const deleteVideo = useCallback(
    async (id: string) => {
      const updated = videos.filter((v) => v.id !== id);
      setVideos(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to delete video:", e);
      }
    },
    [videos]
  );

  const getVideoForActivity = useCallback(
    (activityId: string) => videos.find((v) => v.activityId === activityId),
    [videos]
  );

  return (
    <VideoContext.Provider
      value={{ videos, addVideo, deleteVideo, getVideoForActivity, isGenerating, setIsGenerating }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideos() {
  return useContext(VideoContext);
}
