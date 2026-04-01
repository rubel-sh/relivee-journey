import { useState } from "react";
import {
  Square,
  Pause,
  Play,
  Video,
  User,
  History,
  BarChart2,
  Clock,
  MapPin,
  Zap,
  Navigation,
  Mountain,
  Heart,
  Timer,
  Flame,
} from "lucide-react";

const COLORS = {
  primary: "#6D9E51",
  background: "#EAEFEF",
  text: "#262626",
  trace: "#982598",
  accent: "#088395",
};

function GPSPath() {
  return (
    <svg viewBox="0 0 340 220" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      {/* Background map tiles */}
      <rect width="340" height="220" fill="#D8E4D0" />
      {/* Streets */}
      <line x1="0" y1="55" x2="340" y2="55" stroke="white" strokeWidth="6" opacity="0.5" />
      <line x1="0" y1="110" x2="340" y2="110" stroke="white" strokeWidth="4" opacity="0.4" />
      <line x1="0" y1="170" x2="340" y2="170" stroke="white" strokeWidth="6" opacity="0.5" />
      <line x1="60" y1="0" x2="60" y2="220" stroke="white" strokeWidth="4" opacity="0.4" />
      <line x1="150" y1="0" x2="150" y2="220" stroke="white" strokeWidth="6" opacity="0.5" />
      <line x1="250" y1="0" x2="250" y2="220" stroke="white" strokeWidth="4" opacity="0.4" />
      {/* Green zones */}
      <ellipse cx="200" cy="80" rx="40" ry="30" fill="#B8D4A0" opacity="0.6" />
      <ellipse cx="90" cy="160" rx="30" ry="20" fill="#B8D4A0" opacity="0.5" />
      {/* GPS Trace */}
      <defs>
        <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#982598" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#982598" stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d="M30,180 C50,165 65,155 80,145 C95,135 110,130 120,118 C130,106 135,95 148,88 C161,81 175,82 185,75 C195,68 200,55 215,50 C230,45 245,50 258,42 C271,34 282,28 300,32"
        stroke="url(#traceGrad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {/* Start dot */}
      <circle cx="30" cy="180" r="6" fill={COLORS.primary} stroke="white" strokeWidth="2" />
      {/* Current position animated pulse */}
      <circle cx="300" cy="32" r="14" fill={COLORS.trace} opacity="0.2" />
      <circle cx="300" cy="32" r="9" fill={COLORS.trace} opacity="0.3" />
      <circle cx="300" cy="32" r="6" fill={COLORS.trace} stroke="white" strokeWidth="2" />
      {/* Navigation arrow */}
      <polygon points="300,22 306,36 300,32 294,36" fill={COLORS.accent} />
    </svg>
  );
}

function PulsingDot() {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#ff4444", boxShadow: "0 0 0 4px rgba(255,68,68,0.2)" }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color: "#ff4444" }}>
        RECORDING
      </span>
    </div>
  );
}

export function RecordingScreen() {
  const [paused, setPaused] = useState(false);
  const [activeTab] = useState("record");

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      style={{ background: COLORS.background, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1 text-xs font-medium z-10" style={{ color: COLORS.text }}>
        <span>9:41</span>
        <PulsingDot />
        <span className="font-bold">●●●</span>
      </div>

      {/* Map - full width */}
      <div className="w-full h-52 relative overflow-hidden">
        <GPSPath />
        {/* Gradient overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{ background: `linear-gradient(to top, ${COLORS.background}, transparent)` }}
        />
        {/* GPS accuracy badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}
        >
          <Navigation size={11} style={{ color: COLORS.accent }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
            GPS: ±3m
          </span>
        </div>
        {/* Map type badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}
        >
          <MapPin size={11} style={{ color: COLORS.primary }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
            Running
          </span>
        </div>
      </div>

      {/* Timer - large display */}
      <div className="px-5 pt-3 pb-2">
        <div className="text-center mb-3">
          <div
            className="text-5xl font-black tracking-tight mb-0.5"
            style={{ color: COLORS.text, fontVariantNumeric: "tabular-nums" }}
          >
            28:14
          </div>
          <p className="text-xs font-medium" style={{ color: "#888" }}>
            Duration
          </p>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {
              label: "Distance",
              value: "5.24",
              unit: "km",
              icon: MapPin,
              color: COLORS.primary,
            },
            {
              label: "Pace",
              value: "5:23",
              unit: "/km",
              icon: Zap,
              color: COLORS.accent,
            },
            {
              label: "Calories",
              value: "312",
              unit: "kcal",
              icon: Flame,
              color: COLORS.trace,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl px-3 py-3 text-center"
              style={{ background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
            >
              <stat.icon size={15} style={{ color: stat.color, margin: "0 auto 4px" }} />
              <div className="text-lg font-bold" style={{ color: COLORS.text }}>
                {stat.value}
              </div>
              <div className="text-[10px] font-medium" style={{ color: "#999" }}>
                {stat.unit}
              </div>
              <div className="text-[9px] font-medium mt-0.5" style={{ color: "#bbb" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Elevation", value: "+64 m", icon: Mountain, color: COLORS.accent },
            { label: "Avg Heart Rate", value: "152 bpm", icon: Heart, color: "#ff6b6b" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}18` }}
              >
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>
                  {stat.value}
                </p>
                <p className="text-[10px]" style={{ color: "#aaa" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Control buttons row above nav */}
      <div className="flex items-center justify-center gap-6 px-5 pb-3">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: "white" }}
        >
          <Timer size={20} style={{ color: "#888" }} />
        </button>
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: "white" }}
        >
          <MapPin size={20} style={{ color: "#888" }} />
        </button>
      </div>

      {/* Bottom Nav */}
      <div
        className="relative flex items-center justify-around pt-3 pb-5 px-4"
        style={{ background: "white", boxShadow: "0 -4px 20px rgba(0,0,0,0.07)" }}
      >
        <button className="flex flex-col items-center gap-1">
          <BarChart2 size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Dashboard
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <History size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            History
          </span>
        </button>

        {/* FAB - stop/pause */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 flex gap-2">
          {/* Stop button */}
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{ background: "#ff4444", boxShadow: "0 4px 14px rgba(255,68,68,0.4)" }}
          >
            <Square size={18} color="white" fill="white" />
          </button>
          {/* Pause/Resume */}
          <button
            onClick={() => setPaused(!paused)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-1"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              boxShadow: `0 6px 20px ${COLORS.primary}55`,
            }}
          >
            {paused ? (
              <Play size={22} color="white" fill="white" />
            ) : (
              <Pause size={22} color="white" />
            )}
          </button>
        </div>

        <button className="flex flex-col items-center gap-1">
          <Video size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Videos
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <User size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Profile
          </span>
        </button>
      </div>
    </div>
  );
}
