import { useState } from "react";
import {
  MapPin,
  Play,
  Bell,
  ChevronRight,
  Zap,
  BarChart2,
  User,
  History,
  Video,
  Mountain,
  Timer,
} from "lucide-react";

const COLORS = {
  primary: "#6D9E51",
  background: "#EAEFEF",
  text: "#262626",
  trace: "#982598",
  accent: "#088395",
};

const activities = [
  {
    id: 1,
    type: "Morning Run",
    date: "Today, 6:30 AM",
    distance: "5.2 km",
    duration: "28:14",
    maxSpeed: "14.8 km/h",
    elevation: "64 m",
    color: COLORS.primary,
    hasVideo: true,
    mapGradient: ["#6D9E51", "#4a7a34"],
  },
  {
    id: 2,
    type: "Evening Cycle",
    date: "Yesterday, 5:45 PM",
    distance: "18.6 km",
    duration: "52:30",
    maxSpeed: "34.2 km/h",
    elevation: "120 m",
    color: COLORS.accent,
    hasVideo: true,
    mapGradient: ["#088395", "#065f6e"],
  },
  {
    id: 3,
    type: "Trail Hike",
    date: "Mar 29, 8:00 AM",
    distance: "12.1 km",
    duration: "2h 18m",
    maxSpeed: "8.4 km/h",
    elevation: "480 m",
    color: COLORS.trace,
    hasVideo: true,
    mapGradient: ["#982598", "#6b1a6b"],
  },
  {
    id: 4,
    type: "Morning Run",
    date: "Mar 28, 7:00 AM",
    distance: "4.8 km",
    duration: "26:40",
    maxSpeed: "13.1 km/h",
    elevation: "38 m",
    color: COLORS.primary,
    hasVideo: false,
    mapGradient: ["#6D9E51", "#4a7a34"],
  },
  {
    id: 5,
    type: "Recovery Walk",
    date: "Mar 27, 6:00 PM",
    distance: "3.2 km",
    duration: "38:00",
    maxSpeed: "6.2 km/h",
    elevation: "12 m",
    color: "#888",
    hasVideo: false,
    mapGradient: ["#888", "#555"],
  },
];

function MiniMapTrace({ gradient }: { gradient: string[] }) {
  return (
    <svg viewBox="0 0 80 40" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${gradient[0].slice(1)}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={gradient[0]} stopOpacity="0.4" />
          <stop offset="100%" stopColor={gradient[1]} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M0,35 C10,30 15,20 25,22 C35,24 40,15 50,18 C60,21 65,10 80,8"
        stroke="#982598"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M0,35 C10,30 15,20 25,22 C35,24 40,15 50,18 C60,21 65,10 80,8 L80,40 L0,40Z"
        fill={`url(#g-${gradient[0].slice(1)})`}
      />
    </svg>
  );
}

function StatBadge({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} style={{ color }} />
      <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: "#666" }}>
        {label}
      </span>
    </div>
  );
}

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      style={{ background: COLORS.background, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1 text-xs font-medium" style={{ color: COLORS.text }}>
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <span>●●●</span>
          <span>WiFi</span>
          <span className="font-bold">100%</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#666" }}>
            Good morning, Alex
          </p>
          <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
            Your Journey
          </h1>
        </div>
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: COLORS.primary }}
          >
            <Bell size={16} color="white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-[7px] font-bold">2</span>
          </div>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden shadow-md" style={{ background: COLORS.text }}>
        <div className="relative px-4 pt-4 pb-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                This Week
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">38.9</span>
                <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
                  km
                </span>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: COLORS.primary, color: "white" }}
            >
              +12% vs last week
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Activities
              </p>
              <p className="text-base font-bold text-white">8</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Duration
              </p>
              <p className="text-base font-bold text-white">5h 42m</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Top Speed
              </p>
              <p className="text-base font-bold text-white">34.2</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Videos
              </p>
              <p className="text-base font-bold text-white">5</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Weekly goal: 50 km
              </span>
              <span className="text-xs font-medium" style={{ color: COLORS.primary }}>
                78%
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: "78%", background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent})` }}
              />
            </div>
          </div>

          {/* Decorative dot grid */}
          <div className="absolute top-2 right-2 opacity-10">
            {[...Array(3)].map((_, r) => (
              <div key={r} className="flex gap-1.5 mb-1">
                {[...Array(5)].map((_, c) => (
                  <div key={c} className="w-1 h-1 rounded-full bg-white" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold" style={{ color: COLORS.text }}>
            Recent Activities
          </h2>
          <button
            className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: COLORS.accent }}
          >
            See all <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {activities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              {/* Map preview strip */}
              <div className="h-12 relative overflow-hidden" style={{ background: `${act.mapGradient[0]}15` }}>
                <MiniMapTrace gradient={act.mapGradient} />
                {act.hasVideo && (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: COLORS.trace, opacity: 0.9 }}
                  >
                    <Video size={9} color="white" />
                    <span className="text-white text-[9px] font-semibold">Video</span>
                  </div>
                )}
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: act.color }}
                />
              </div>

              <div className="px-3.5 py-2.5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: COLORS.text }}>
                      {act.type}
                    </p>
                    <p className="text-xs" style={{ color: "#999" }}>
                      {act.date}
                    </p>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${act.color}18`, color: act.color }}
                  >
                    {act.distance}
                  </div>
                </div>

                <div className="flex gap-4">
                  <StatBadge icon={Timer} value={act.duration} label="time" color={act.color} />
                  <StatBadge icon={Zap} value={act.maxSpeed} label="max" color={COLORS.trace} />
                  <StatBadge icon={Mountain} value={act.elevation} label="elev" color={COLORS.accent} />
                </div>
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
        {[
          { id: "home", icon: BarChart2, label: "Dashboard" },
          { id: "history", icon: History, label: "History" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className="flex-1 flex flex-col items-center gap-1"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={22} style={{ color: active ? COLORS.primary : "#bbb" }} />
              <span className="text-[10px] font-semibold" style={{ color: active ? COLORS.primary : "#bbb" }}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center slot — invisible spacer so FAB sits in a true 1/5 slot */}
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

        {[
          { id: "videos", icon: Video, label: "Videos" },
          { id: "profile", icon: User, label: "Profile" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className="flex-1 flex flex-col items-center gap-1"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={22} style={{ color: active ? COLORS.primary : "#bbb" }} />
              <span className="text-[10px] font-semibold" style={{ color: active ? COLORS.primary : "#bbb" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
