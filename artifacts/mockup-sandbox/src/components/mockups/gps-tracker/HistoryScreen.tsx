import { useState } from "react";
import {
  Play,
  Video,
  User,
  History,
  BarChart2,
  Mountain,
  Timer,
  MapPin,
  ChevronRight,
  Filter,
  Share2,
  Zap,
} from "lucide-react";

const COLORS = {
  primary: "#6D9E51",
  background: "#EAEFEF",
  text: "#262626",
  trace: "#982598",
  accent: "#088395",
};

const allActivities = [
  {
    id: 1,
    type: "Morning Run",
    date: "Apr 1, 2026",
    time: "6:30 AM",
    distance: "5.2 km",
    distanceVal: 5.2,
    duration: "28:14",
    avgSpeed: "11.1",
    maxSpeed: "14.8",
    elevation: 64,
    tag: "run",
    hasVideo: true,
    color: COLORS.primary,
  },
  {
    id: 2,
    type: "Evening Cycle",
    date: "Mar 31, 2026",
    time: "5:45 PM",
    distance: "18.6 km",
    distanceVal: 18.6,
    duration: "52:30",
    avgSpeed: "21.3",
    maxSpeed: "34.2",
    elevation: 120,
    tag: "cycle",
    hasVideo: true,
    color: COLORS.accent,
  },
  {
    id: 3,
    type: "Trail Hike",
    date: "Mar 29, 2026",
    time: "8:00 AM",
    distance: "12.1 km",
    distanceVal: 12.1,
    duration: "2h 18m",
    avgSpeed: "5.3",
    maxSpeed: "8.4",
    elevation: 480,
    tag: "hike",
    hasVideo: true,
    color: COLORS.trace,
  },
  {
    id: 4,
    type: "Morning Run",
    date: "Mar 28, 2026",
    time: "7:00 AM",
    distance: "4.8 km",
    distanceVal: 4.8,
    duration: "26:40",
    avgSpeed: "10.8",
    maxSpeed: "13.1",
    elevation: 38,
    tag: "run",
    hasVideo: false,
    color: COLORS.primary,
  },
  {
    id: 5,
    type: "Recovery Walk",
    date: "Mar 27, 2026",
    time: "6:00 PM",
    distance: "3.2 km",
    distanceVal: 3.2,
    duration: "38:00",
    avgSpeed: "5.1",
    maxSpeed: "6.2",
    elevation: 12,
    tag: "walk",
    hasVideo: false,
    color: "#aaa",
  },
];

const tagColors: Record<string, string> = {
  run: COLORS.primary,
  cycle: COLORS.accent,
  hike: COLORS.trace,
  walk: "#aaa",
};

function MiniRouteMap({ color }: { color: string }) {
  const paths = [
    "M5,25 C15,20 20,15 30,18 C40,21 42,12 50,15 C58,18 60,8 70,6",
    "M5,25 C20,18 35,22 45,10 C55,0 65,12 70,8",
    "M5,20 C15,30 25,12 35,18 C45,24 55,8 70,15",
    "M5,22 C20,15 30,25 45,18 C55,12 62,20 70,10",
    "M5,25 C15,22 30,18 45,22 C55,26 62,15 70,18",
  ];
  const idx = Math.floor(Math.random() * paths.length);
  return (
    <svg viewBox="0 0 75 30" className="w-full h-full">
      <rect width="75" height="30" fill={`${color}10`} rx="4" />
      <path d={paths[0]} stroke={COLORS.trace} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
      <circle cx="5" cy="25" r="3" fill={color} />
      <circle cx="70" cy="6" r="3" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function HistoryScreen() {
  const [filter, setFilter] = useState("all");
  const [activeTab] = useState("history");

  const filters = ["all", "run", "cycle", "hike", "walk"];
  const filtered = filter === "all" ? allActivities : allActivities.filter((a) => a.tag === filter);

  const totalDist = filtered.reduce((s, a) => s + a.distanceVal, 0).toFixed(1);
  const topSpeed = filtered.reduce((max, a) => Math.max(max, parseFloat(a.maxSpeed)), 0).toFixed(1);
  const withVideo = filtered.filter((a) => a.hasVideo).length;

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      style={{ background: COLORS.background, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1 text-xs font-medium" style={{ color: COLORS.text }}>
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <span>●●●</span>
          <span className="font-bold">100%</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
            Activity History
          </h1>
          <p className="text-xs font-medium" style={{ color: "#888" }}>
            {filtered.length} activities recorded
          </p>
        </div>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        >
          <Filter size={16} style={{ color: COLORS.text }} />
        </button>
      </div>

      {/* Summary strip */}
      <div className="mx-5 mb-3 rounded-2xl px-4 py-3 flex justify-between" style={{ background: COLORS.text }}>
        {[
          { val: `${totalDist} km`, label: "Distance", color: COLORS.primary },
          { val: `${topSpeed} km/h`, label: "Top Speed", color: COLORS.trace },
          { val: `${withVideo}`, label: "Videos", color: COLORS.accent },
          { val: `${filtered.length}`, label: "Trips", color: "#ccc" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-base font-bold text-white">{s.val}</div>
            <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-5 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {filters.map((f) => {
            const active = filter === f;
            const color = f === "all" ? COLORS.primary : tagColors[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                style={{
                  background: active ? color : "white",
                  color: active ? "white" : "#888",
                  boxShadow: active ? `0 2px 10px ${color}40` : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {f === "all" ? "All Types" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        <div className="flex flex-col gap-3">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div className="p-3.5">
                <div className="flex gap-3 items-start">
                  {/* Mini map */}
                  <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <MiniRouteMap color={act.color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: COLORS.text }}>
                          {act.type}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#aaa" }}>
                          {act.date} · {act.time}
                        </p>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {act.hasVideo && (
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background: `${COLORS.trace}18` }}
                          >
                            <Video size={9} style={{ color: COLORS.trace }} />
                            <span className="text-[9px] font-semibold" style={{ color: COLORS.trace }}>
                              Video
                            </span>
                          </div>
                        )}
                        <ChevronRight size={14} style={{ color: "#ccc" }} />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} style={{ color: act.color }} />
                        <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
                          {act.distance}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer size={10} style={{ color: COLORS.accent }} />
                        <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
                          {act.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={10} style={{ color: COLORS.trace }} />
                        <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
                          {act.avgSpeed} km/h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded stats - show for video activities */}
                {act.hasVideo && (
                  <div
                    className="mt-3 pt-3 flex justify-between items-center"
                    style={{ borderTop: "1px solid #f0f0f0" }}
                  >
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1">
                        <Zap size={10} style={{ color: act.color }} />
                        <span className="text-[10px] font-medium" style={{ color: "#888" }}>
                          max {act.maxSpeed} km/h
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mountain size={10} style={{ color: COLORS.accent }} />
                        <span className="text-[10px] font-medium" style={{ color: "#888" }}>
                          +{act.elevation} m
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${COLORS.accent}15` }}
                      >
                        <Share2 size={11} style={{ color: COLORS.accent }} />
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{ background: `${COLORS.trace}18` }}
                      >
                        <Play size={10} style={{ color: COLORS.trace }} fill={COLORS.trace} />
                        <span className="text-[10px] font-bold" style={{ color: COLORS.trace }}>
                          Play Video
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        className="relative flex items-center pt-3 pb-5"
        style={{ background: "white", boxShadow: "0 -4px 20px rgba(0,0,0,0.07)" }}
      >
        <button className="flex-1 flex flex-col items-center gap-1">
          <BarChart2 size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Dashboard</span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1">
          <History size={22} style={{ color: COLORS.primary }} />
          <span className="text-[10px] font-semibold" style={{ color: COLORS.primary }}>History</span>
          <div className="w-1 h-1 rounded-full" style={{ background: COLORS.primary }} />
        </button>

        {/* Center spacer — keeps FAB centered in its own equal slot */}
        <div className="flex-1" />

        {/* FAB Record Button — absolutely centered over the spacer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              boxShadow: `0 6px 20px ${COLORS.primary}55`,
            }}
          >
            <Play size={22} color="white" fill="white" />
          </div>
        </div>

        <button className="flex-1 flex flex-col items-center gap-1">
          <Video size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Videos</span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1">
          <User size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Profile</span>
        </button>
      </div>
    </div>
  );
}
