import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  Shield, LayoutDashboard, MapPin, Ear, Lock, Users, History, Map as MapIcon,
  Lightbulb, Settings, Bell, ChevronRight, Phone, MessageCircle, Award,
  PhoneCall, Mic, MicOff, Flashlight, Share2, Plus, Sun, Cloud, Moon, Zap, AlertTriangle,
  Sparkles, Target, X, Home, Building2, UserPlus, Pin,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import type { IncidentPin } from "@/components/map/LiveMap";

const LiveMap = lazy(() => import("@/components/map/LiveMap").then(m => ({ default: m.LiveMap })));

// Default to Hyderabad, Banjara Hills as fallback when geolocation denied
const DEFAULT_CENTER = { lat: 17.4126, lng: 78.4400 };
const INCIDENT_LABELS: Record<IncidentPin["category"], string> = {
  harassment: "Harassment reported",
  stalking: "Stalking incident",
  robbery: "Robbery / theft",
  road: "Road danger",
  suspicious: "Suspicious person",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeWalk Dashboard — Your Safety. Our Priority." },
      { name: "description", content: "Live tracking, ambient listening, safe word triggers, trusted contacts and verified journeys — all in one dashboard." },
    ],
  }),
  component: Dashboard,
});

type Mode = "day" | "evening" | "night" | "rush";

function Dashboard() {
  const [mode, setMode] = useState<Mode>("night");
  const [sosOpen, setSosOpen] = useState(false);
  const [threat, setThreat] = useState(false);
  const [incidents, setIncidents] = useState<IncidentPin[]>([]);
  const [geofenceRadius, setGeofenceRadius] = useState(500);
  const { pos } = useGeolocation(true);
  const audio = useAmbientAudio();

  const userPos = pos ? { lat: pos.lat, lng: pos.lng } : null;
  const center = userPos ?? DEFAULT_CENTER;

  // Real threat trigger from sustained loud audio
  useEffect(() => {
    if (audio.enabled && audio.threatScore >= 0.9 && !threat && !sosOpen) {
      setThreat(true);
    }
  }, [audio.enabled, audio.threatScore, threat, sosOpen]);

  const handleDropPin = (category: IncidentPin["category"]) => {
    const p = userPos ?? DEFAULT_CENTER;
    setIncidents((cur) => [...cur, {
      id: crypto.randomUUID(),
      lat: p.lat + (Math.random() - 0.5) * 0.001,
      lng: p.lng + (Math.random() - 0.5) * 0.001,
      category,
      label: INCIDENT_LABELS[category],
    }]);
  };

  return (
    <div className="min-h-screen flex text-foreground">
      <Sidebar />
      <div className="flex-1 ml-[280px] flex flex-col min-w-0">
        <Header onSOS={() => setSosOpen(true)} />
        <main className="flex-1 px-8 pb-12 pt-2">
          {threat && <ThreatBanner onClose={() => setThreat(false)} onSOS={() => { setThreat(false); setSosOpen(true); }} />}
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT MAIN */}
            <section className="col-span-12 xl:col-span-8 space-y-6">
              <LiveLocationCard
                mode={mode} onModeChange={setMode}
                center={center} user={userPos}
                incidents={incidents} geofenceRadius={geofenceRadius}
              />
              <SafeStatusBanner />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SafeWordCard />
                <QuickActions />
              </div>
              <JourneyHistory />
              <BottomBanner />
            </section>
            {/* RIGHT COL */}
            <aside className="col-span-12 xl:col-span-4 space-y-6">
              <AmbientListening audio={audio} onSimulate={() => setThreat(true)} />
              <TrustedContacts />
              <GeofenceCard radius={geofenceRadius} onRadiusChange={setGeofenceRadius} />
              <BuddyMatch />
            </aside>
          </div>
        </main>
      </div>

      <IncidentFAB onDrop={handleDropPin} />
      {sosOpen && <SOSModal onClose={() => setSosOpen(false)} />}
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: MapPin, label: "Live Tracking" },
    { icon: Ear, label: "Ambient Listening", live: true },
    { icon: Lock, label: "Safe Word" },
    { icon: Users, label: "Contacts" },
    { icon: History, label: "Journey History" },
    { icon: MapIcon, label: "Community Map" },
    { icon: Lightbulb, label: "Safety Tips" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] glass border-r border-white/5 flex flex-col z-30">
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow-pink">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-primary opacity-30 blur-md -z-10" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight">SafeWalk</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Your Safety. Our Priority.</div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 pb-2">Menu</div>
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.label}>
              <button
                className={[
                  "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  it.active
                    ? "bg-gradient-to-r from-[rgba(123,97,255,0.25)] to-[rgba(255,77,157,0.12)] text-white shadow-glow-purple border border-white/10"
                    : "text-foreground/75 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <it.icon className={"w-4.5 h-4.5 " + (it.active ? "text-[#FF4D9D]" : "")} size={18} />
                <span className="flex-1 text-left font-medium">{it.label}</span>
                {it.live && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/40 text-[9px] font-bold tracking-wider text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-dot" /> LIVE
                  </span>
                )}
                {it.active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Invite card */}
      <div className="m-4 p-4 rounded-2xl gradient-border overflow-hidden relative">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-primary opacity-30 blur-2xl" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm font-semibold">Invite & Protect</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Add your sisters, friends and family. Together we're safer.
        </p>
        <button className="w-full text-xs font-semibold py-2 rounded-lg bg-gradient-primary text-white shadow-glow-pink hover:opacity-90 transition">
          Invite Friends
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Header ---------------- */
function Header({ onSOS }: { onSOS: () => void }) {
  return (
    <header className="sticky top-0 z-20 px-8 py-5 backdrop-blur-xl bg-[#0B0F1A]/60 border-b border-white/5 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold">Good Evening, Ananya <span className="inline-block animate-float-slow">👋</span></h1>
        <p className="text-sm text-muted-foreground mt-0.5">You are protected. You are powerful.</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onSOS}
          className="relative px-6 py-3 rounded-2xl bg-gradient-sos text-white font-bold tracking-wide text-sm flex items-center gap-2 animate-pulse-glow hover:scale-[1.02] transition-transform"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
          SOS EMERGENCY
        </button>
        <button className="relative w-11 h-11 rounded-xl glass grid place-items-center hover:bg-white/10 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4D9D] ring-2 ring-[#0B0F1A]" />
        </button>
        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#FF4D9D] to-[#7B61FF] p-[2px]">
          <div className="w-full h-full rounded-full bg-[#0B0F1A] grid place-items-center text-sm font-semibold">A</div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Live Location Map ---------------- */
function LiveLocationCard({
  mode, onModeChange, center, user, incidents, geofenceRadius,
}: {
  mode: Mode; onModeChange: (m: Mode) => void;
  center: { lat: number; lng: number };
  user: { lat: number; lng: number } | null;
  incidents: IncidentPin[];
  geofenceRadius: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const modes: { key: Mode; label: string; icon: any }[] = [
    { key: "day", label: "Day", icon: Sun },
    { key: "evening", label: "Evening", icon: Cloud },
    { key: "night", label: "Night", icon: Moon },
    { key: "rush", label: "Rush", icon: Zap },
  ];

  return (
    <div className="glass rounded-3xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">Live Location</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold tracking-wider text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> ACTIVE
          </span>
          <span className="text-xs text-muted-foreground">Live for <span className="text-white font-mono">02:45:18</span></span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl glass">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition",
                mode === m.key ? "bg-gradient-primary text-white shadow-glow-pink" : "text-foreground/70 hover:text-white",
              ].join(" ")}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0d18] z-0">
        {mounted ? (
          <Suspense fallback={<div className="w-full h-full grid place-items-center text-muted-foreground text-sm">Loading map…</div>}>
            <LiveMap center={center} user={user} mode={mode} incidents={incidents} geofenceRadius={geofenceRadius} />
          </Suspense>
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">Initializing map…</div>
        )}

        {/* Mode badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass-strong text-xs font-semibold flex items-center gap-2">
          {mode === "night" && <><Moon className="w-3.5 h-3.5 text-[#7B61FF]" /> Night Mode Active — Enhanced Alerts ON</>}
          {mode === "day" && <><Sun className="w-3.5 h-3.5 text-amber-300" /> Day Mode — Safe corridors</>}
          {mode === "evening" && <><Cloud className="w-3.5 h-3.5 text-amber-400" /> Evening Mode — Moderate risk</>}
          {mode === "rush" && <><Zap className="w-3.5 h-3.5 text-[#FF4D9D]" /> Rush Hour — Crowd density alerts</>}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-strong rounded-xl px-3 py-2 flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF4D9D] shadow-glow-pink" /> Start</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4DA3FF] shadow-glow-blue" /> You</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Zone</span>
        </div>

        {/* ETA card */}
        <div className="absolute top-4 right-4 glass-strong rounded-2xl p-3 w-[200px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Destination</div>
          <div className="font-semibold text-sm mt-0.5">Banjara Hills</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground">ETA</div>
              <div className="text-sm font-mono">12 min</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Safety</div>
              <div className="text-sm font-mono text-emerald-300">92%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapVisual({ color, mode }: { color: string; mode: Mode }) {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4D9D" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1f35" />
          <stop offset="100%" stopColor="#0a0d18" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="800" height="400" fill="url(#bgGlow)" />

      {/* grid */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={"v" + i} x1={i * 70} y1="0" x2={i * 70} y2="400" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={"h" + i} x1="0" y1={i * 60} x2="800" y2={i * 60} />
        ))}
      </g>

      {/* roads */}
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" strokeLinecap="round">
        <path d="M 0 280 Q 200 240 400 270 T 800 230" />
        <path d="M 100 0 Q 140 200 240 400" />
        <path d="M 500 0 Q 560 180 620 400" />
        <path d="M 0 120 Q 300 110 800 90" />
      </g>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none">
        <path d="M 0 280 Q 200 240 400 270 T 800 230" />
        <path d="M 100 0 Q 140 200 240 400" />
      </g>

      {/* risk overlays */}
      {mode !== "day" && (
        <g opacity={mode === "evening" ? 0.45 : 0.55} style={{ mixBlendMode: "screen" as any }}>
          <circle cx="180" cy="180" r="70" fill={color} opacity="0.25" />
          <circle cx="560" cy="300" r="90" fill={color} opacity="0.22" />
        </g>
      )}
      {mode === "day" && (
        <g opacity="0.5" style={{ mixBlendMode: "screen" as any }}>
          <circle cx="300" cy="220" r="90" fill="#2ED2A8" opacity="0.22" />
          <circle cx="600" cy="180" r="80" fill="#2ED2A8" opacity="0.2" />
        </g>
      )}

      {/* route */}
      <path
        d="M 120 320 C 220 260, 320 320, 420 240 S 620 160, 700 120"
        stroke="url(#routeGrad)" strokeWidth="5" fill="none"
        strokeLinecap="round" filter="url(#glow)"
      />
      <path
        d="M 120 320 C 220 260, 320 320, 420 240 S 620 160, 700 120"
        stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none"
        strokeLinecap="round" className="animate-dash"
      />

      {/* start */}
      <g transform="translate(120 320)">
        <circle r="18" fill="#FF4D9D" opacity="0.25" />
        <circle r="10" fill="#FF4D9D" opacity="0.5" />
        <circle r="5" fill="#FF4D9D" />
      </g>

      {/* current */}
      <g transform="translate(700 120)">
        <circle r="22" fill="#4DA3FF" opacity="0.2">
          <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="12" fill="#4DA3FF" opacity="0.6" />
        <circle r="6" fill="#fff" />
      </g>
    </svg>
  );
}

/* ---------------- Safe Status Banner ---------------- */
function SafeStatusBanner() {
  return (
    <div className="relative rounded-3xl p-5 overflow-hidden border border-emerald-400/20"
      style={{ background: "linear-gradient(135deg, rgba(46,210,168,0.18), rgba(63,182,255,0.08))" }}>
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-safe grid place-items-center shadow-[0_10px_40px_-10px_rgba(46,210,168,0.6)]">
            <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-lg font-bold">You are in a Safe Zone</div>
            <div className="text-sm text-foreground/70">Verified by 1,240 community members in the last 24 hours.</div>
          </div>
        </div>
        <button className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center gap-2">
          View Details <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Ambient Listening ---------------- */
type AudioState = ReturnType<typeof useAmbientAudio>;
function AmbientListening({ audio, onSimulate }: { audio: AudioState; onSimulate: () => void }) {
  const { enabled, setEnabled, level, threatScore, error } = audio;
  const detected = threatScore > 0.3;
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ear className="w-4 h-4 text-[#FF4D9D]" />
          <span className="text-sm font-semibold">Ambient Listening</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={[
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider transition",
            enabled
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-white/5 border-white/10 text-foreground/60 hover:text-white",
          ].join(" ")}
        >
          {enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
          <span className={enabled ? "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" : "hidden"} />
          {enabled ? "LIVE" : "OFF"}
        </button>
      </div>

      <LiveWaveform level={level} active={enabled} />

      <p className="text-xs text-muted-foreground mt-3 mb-3">
        Monitoring environment for: <span className="text-foreground/90">Yelling · Screams · Traffic danger</span>
      </p>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2 text-xs text-red-200 mb-3">
          {error}
        </div>
      )}

      <div className={[
        "rounded-xl px-3 py-2.5 flex items-center gap-2.5 border",
        detected
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-emerald-500/10 border-emerald-500/25",
      ].join(" ")}>
        <div className={[
          "w-7 h-7 rounded-lg grid place-items-center",
          detected ? "bg-amber-500/25" : "bg-emerald-500/25",
        ].join(" ")}>
          {detected ? <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> : <Shield className="w-3.5 h-3.5 text-emerald-300" />}
        </div>
        <div className="text-xs flex-1">
          <div className={detected ? "font-semibold text-amber-200" : "font-semibold text-emerald-200"}>
            {detected ? `Elevated sound detected — ${Math.round(threatScore * 100)}%` : enabled ? "No threats detected" : "Microphone off"}
          </div>
          <div className={detected ? "text-amber-200/60 text-[11px]" : "text-emerald-200/60 text-[11px]"}>
            Pattern recognition runs locally · No audio stored
          </div>
        </div>
      </div>

      <button
        onClick={onSimulate}
        className="mt-3 w-full text-xs font-semibold py-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 transition flex items-center justify-center gap-2"
      >
        <Zap className="w-3.5 h-3.5" /> Simulate Safety Threat
      </button>
    </div>
  );
}

function LiveWaveform({ level, active }: { level: number; active: boolean }) {
  const bars = Array.from({ length: 36 });
  return (
    <div className="h-20 rounded-xl bg-black/30 border border-white/5 px-3 flex items-center gap-[3px] overflow-hidden">
      {bars.map((_, i) => {
        const base = 18 + Math.abs(Math.sin((i + Date.now() / 800) * 0.7)) * 25;
        const reactive = active ? base + level * 70 : base * 0.4;
        return (
          <div
            key={i}
            className="flex-1 rounded-full bg-gradient-to-t from-[#7B61FF] to-[#FF4D9D] origin-center transition-[height] duration-100"
            style={{
              height: `${Math.min(95, reactive)}%`,
              opacity: active ? 0.85 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------------- Safe Word ---------------- */
function SafeWordCard() {
  const [word, setWord] = useState("SUNFLOWER");
  return (
    <div className="glass rounded-3xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
          <Lock className="w-4 h-4 text-[#7B61FF]" />
        </div>
        <div>
          <div className="text-sm font-semibold">Safe Word</div>
          <div className="text-[11px] text-muted-foreground">Trigger silent SOS via text or voice</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Saying or typing your safe word instantly alerts guardians and shares your live location.
      </p>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Your code word</label>
      <input
        value={word}
        onChange={(e) => setWord(e.target.value.toUpperCase())}
        className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FF4D9D]/50 focus:ring-2 focus:ring-[#FF4D9D]/20 transition"
      />
      <button className="mt-3 w-full text-sm font-semibold py-2.5 rounded-xl bg-gradient-primary text-white shadow-glow-pink hover:opacity-90 transition flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" /> Send Safe Word
      </button>
    </div>
  );
}

/* ---------------- Quick Actions ---------------- */
function QuickActions() {
  const actions = [
    { icon: PhoneCall, label: "Fake Call", color: "#FF4D9D" },
    { icon: Mic, label: "Record Audio", color: "#7B61FF" },
    { icon: Flashlight, label: "Flashlight", color: "#FFB547" },
    { icon: Share2, label: "Share Live", color: "#4DA3FF" },
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Quick Actions</div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tap to use</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className="group relative aspect-square rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col items-center justify-center gap-2 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-200"
          >
            <div
              className="w-11 h-11 rounded-xl grid place-items-center transition-transform group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${a.color}33, ${a.color}11)`, boxShadow: `0 10px 30px -12px ${a.color}77` }}
            >
              <a.icon className="w-5 h-5" style={{ color: a.color }} />
            </div>
            <span className="text-xs font-medium">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Trusted Contacts ---------------- */
function TrustedContacts() {
  const contacts = [
    { name: "Akshay Sharma", rel: "Brother", phone: "+91 98XXX 12340", color: "from-[#FF4D9D] to-[#7B61FF]" },
    { name: "Priya Reddy", rel: "Best Friend", phone: "+91 98XXX 87362", color: "from-[#7B61FF] to-[#4DA3FF]" },
    { name: "Mom", rel: "Family", phone: "+91 98XXX 11023", color: "from-[#4DA3FF] to-[#2ED2A8]" },
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Trusted Contacts</div>
          <div className="text-[11px] text-muted-foreground">{contacts.length} guardians on call</div>
        </div>
        <button className="text-[11px] flex items-center gap-1 text-foreground/70 hover:text-white transition">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <ul className="space-y-3">
        {contacts.map((c) => (
          <li key={c.name} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} grid place-items-center text-sm font-bold`}>
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{c.name} <span className="text-[10px] text-muted-foreground font-normal">· {c.rel}</span></div>
              <div className="text-[11px] text-muted-foreground font-mono">{c.phone}</div>
            </div>
            <button className="w-8 h-8 rounded-lg border border-white/10 hover:border-[#7B61FF]/50 hover:bg-[#7B61FF]/10 transition grid place-items-center" aria-label="message">
              <MessageCircle className="w-4 h-4 text-[#7B61FF]" />
            </button>
            <button className="w-8 h-8 rounded-lg border border-white/10 hover:border-[#FF4D9D]/50 hover:bg-[#FF4D9D]/10 transition grid place-items-center" aria-label="call">
              <Phone className="w-4 h-4 text-[#FF4D9D]" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Geofence ---------------- */
function GeofenceCard({ radius, onRadiusChange }: { radius: number; onRadiusChange: (v: number) => void }) {
  const zones = [
    { icon: Home, label: "Home", color: "#2ED2A8", on: true },
    { icon: Building2, label: "Office", color: "#4DA3FF", on: true },
    { icon: UserPlus, label: "Friend's House", color: "#7B61FF", on: false },
    { icon: Pin, label: "Custom", color: "#FF4D9D", on: false },
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-sm font-semibold mb-1">Geofence Safe Zones</div>
      <div className="text-[11px] text-muted-foreground mb-3">Get alerted when entering or leaving</div>

      <div className="mb-4 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">Active zone radius</span>
          <span className="text-xs font-mono text-[#FF4D9D]">{radius < 1000 ? `${radius}m` : `${(radius / 1000).toFixed(1)}km`}</span>
        </div>
        <input
          type="range" min={100} max={2000} step={50}
          value={radius} onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full accent-[#FF4D9D]"
        />
      </div>

      <ul className="space-y-2">
        {zones.map((z) => (
          <li key={z.label} className="flex items-center gap-3 p-2 rounded-xl border border-white/5 hover:border-white/15 transition">
            <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `${z.color}22` }}>
              <z.icon className="w-4 h-4" style={{ color: z.color }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">{z.label}</div>
              <div className="text-[10px] text-muted-foreground">Live geofence: {radius}m</div>
            </div>
            <Toggle on={z.on} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ on: initial }: { on: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      onClick={() => setOn(!on)}
      className={[
        "w-10 h-5.5 rounded-full p-0.5 transition relative",
        on ? "bg-gradient-primary shadow-glow-pink" : "bg-white/10",
      ].join(" ")}
      style={{ height: 22, width: 40 }}
    >
      <span className={["block w-4 h-4 rounded-full bg-white transition-transform", on ? "translate-x-[18px]" : "translate-x-0"].join(" ")} />
    </button>
  );
}

/* ---------------- Buddy Match ---------------- */
function BuddyMatch() {
  return (
    <div className="glass rounded-3xl p-5 relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#7B61FF]/15 blur-3xl" />
      <div className="text-sm font-semibold mb-1">Buddy Match</div>
      <div className="text-[11px] text-muted-foreground mb-3">Travel together. Verified by SafeWalk.</div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#4DA3FF] grid place-items-center font-bold text-sm">P</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B0F1A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Priya S.</div>
          <div className="text-[11px] text-muted-foreground">47 safe journeys · Heading to Punjagutta</div>
        </div>
      </div>
      <button className="mt-3 w-full text-xs font-semibold py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        Send Buddy Request
      </button>
    </div>
  );
}

/* ---------------- Journey History ---------------- */
function JourneyHistory() {
  const badges = [
    { label: "Night Traveler", icon: Moon, from: "#7B61FF", to: "#4DA3FF" },
    { label: "Solo Explorer", icon: Sparkles, from: "#FF4D9D", to: "#7B61FF" },
    { label: "Community Reporter", icon: MapPin, from: "#4DA3FF", to: "#2ED2A8" },
    { label: "Guardian Angel", icon: Shield, from: "#FFB547", to: "#FF4D9D" },
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow-pink">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">47 Safe Journeys Completed</div>
            <div className="text-xs text-muted-foreground">3 journeys to your next badge — keep going!</div>
          </div>
        </div>
        <label className="text-[11px] flex items-center gap-2 text-foreground/70">
          <Toggle on={true} />
          Share safety profile with employer
        </label>
      </div>

      {/* progress */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
        <div className="h-full bg-gradient-primary" style={{ width: "78%" }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map((b) => (
          <div key={b.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center gap-2 hover:bg-white/[0.06] transition">
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center"
              style={{ background: `linear-gradient(135deg, ${b.from}33, ${b.to}22)`, boxShadow: `0 10px 30px -12px ${b.from}88` }}
            >
              <b.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-[11px] font-semibold text-center">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Bottom Banner ---------------- */
function BottomBanner() {
  return (
    <div className="relative rounded-3xl overflow-hidden p-6 flex items-center justify-between gap-6"
      style={{ background: "linear-gradient(135deg, #FF4D9D 0%, #7B61FF 100%)" }}>
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px 200px at 80% 50%, rgba(255,255,255,0.4), transparent)" }} />
      <div className="relative">
        <div className="font-display text-2xl font-bold leading-tight">You're not alone.<br />We've got your back.</div>
        <div className="text-sm text-white/80 mt-1">Join 240K+ women walking safer with SafeWalk.</div>
      </div>
      <div className="relative hidden md:flex items-end gap-2">
        {["#FFD7E5", "#E5DAFF", "#D7E9FF"].map((c, i) => (
          <div key={i} className="rounded-t-full" style={{ width: 40, height: 60 + i * 8, background: `linear-gradient(180deg, ${c}, transparent)` }} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Threat banner ---------------- */
function ThreatBanner({ onClose, onSOS }: { onClose: () => void; onSOS: () => void }) {
  const [count, setCount] = useState(5);
  useEffect(() => {
    if (count <= 0) { onSOS(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onSOS]);
  return (
    <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-400/15 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse-dot" />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-amber-100">Threat detected</span>
        <span className="text-amber-200/80"> — SOS in {count} seconds</span>
      </div>
      <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">Cancel</button>
    </div>
  );
}

/* ---------------- Incident FAB ---------------- */
function IncidentFAB({ onDrop }: { onDrop: (c: IncidentPin["category"]) => void }) {
  const [open, setOpen] = useState(false);
  const cats: { key: IncidentPin["category"]; label: string; color: string }[] = [
    { key: "harassment", label: "Harassment", color: "#EF4444" },
    { key: "stalking", label: "Stalking", color: "#F59E0B" },
    { key: "robbery", label: "Robbery", color: "#EC4899" },
    { key: "road", label: "Road Danger", color: "#06B6D4" },
    { key: "suspicious", label: "Suspicious Person", color: "#8B5CF6" },
  ];
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-2xl bg-gradient-sos shadow-glow-pink grid place-items-center hover:scale-105 transition"
        aria-label="Report incident"
      >
        <Target className="w-6 h-6 text-white" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-display text-lg font-bold">Report Incident</div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 grid place-items-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-xs text-muted-foreground mb-4">Help your community stay safe. Pin drops on your current location.</div>
            <div className="grid grid-cols-2 gap-2">
              {cats.map(c => (
                <button
                  key={c.key}
                  onClick={() => { onDrop(c.key); setOpen(false); }}
                  className="px-3 py-3 text-xs rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] transition font-medium flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 12px ${c.color}` }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- SOS Modal ---------------- */
function SOSModal({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(5);
  const [members, setMembers] = useState([
    { name: "Akshay Sharma", rel: "Brother", color: "#4DA3FF" },
    { name: "Priya Reddy", rel: "Friend", color: "#7B61FF" },
    { name: "Mom", rel: "Family", color: "#FF4D9D" },
  ]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", rel: "Family" });

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-7 max-w-2xl w-full my-8 border border-[#FF4D9D]/30 shadow-glow-pink" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-sos grid place-items-center animate-pulse-glow">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">SOS Dispatching</div>
              <div className="text-sm text-foreground/70">Auto-alerting your contacts in <span className="text-[#FF4D9D] font-bold font-mono">{Math.max(count, 0)}s</span></div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/10 grid place-items-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-4 flex items-center gap-3">
          <Mic className="w-4 h-4 text-[#FF4D9D] animate-pulse-dot" />
          <div className="text-sm">🎙️ Recording ambient audio — will be sent to contacts</div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Emergency Contacts</div>
            <button onClick={() => setAdding(a => !a)} className="text-xs flex items-center gap-1 text-[#FF4D9D] hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>
          <ul className="space-y-2">
            {members.map(m => (
              <li key={m.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold" style={{ background: m.color }}>{m.name[0]}</div>
                <div className="flex-1 text-sm">{m.name} <span className="text-muted-foreground text-xs">· {m.rel}</span></div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-300">Notified</span>
              </li>
            ))}
          </ul>

          {adding && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#FF4D9D]/50" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#FF4D9D]/50" />
              <select value={form.rel} onChange={e => setForm({ ...form, rel: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#FF4D9D]/50">
                {["Family", "Friend", "Colleague", "Guardian"].map(r => <option key={r}>{r}</option>)}
              </select>
              <button
                onClick={() => {
                  if (!form.name) return;
                  setMembers([...members, { name: form.name, rel: form.rel, color: "#7B61FF" }]);
                  setForm({ name: "", phone: "", rel: "Family" });
                  setAdding(false);
                }}
                className="md:col-span-3 py-2 rounded-lg bg-gradient-primary text-white text-xs font-semibold"
              >
                Add to dispatch
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold mb-2">Nearby Help Resources</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { name: "Nearest Police Outpost", dist: "0.4 km", color: "#FF3366", type: "Authority" },
              { name: "NIMS Emergency Room", dist: "1.1 km", color: "#FF3366", type: "Authority" },
              { name: "McDonald's (24/7)", dist: "0.2 km", color: "#2ED2A8", type: "Safe Space" },
              { name: "Apollo Pharmacy 24/7", dist: "0.5 km", color: "#2ED2A8", type: "Safe Space" },
              { name: "Akshay — Brother", dist: "2.3 km", color: "#4DA3FF", type: "Contact" },
              { name: "Priya — Friend", dist: "3.8 km", color: "#4DA3FF", type: "Contact" },
            ].map(r => (
              <div key={r.name} className="rounded-xl p-3 border" style={{ background: `${r.color}10`, borderColor: `${r.color}40` }}>
                <div className="text-[10px] uppercase tracking-wider opacity-70" style={{ color: r.color }}>{r.type}</div>
                <div className="text-xs font-semibold mt-1 leading-tight">{r.name}</div>
                <div className="text-[11px] text-foreground/70 mt-1 font-mono">{r.dist}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 hover:bg-white/10 text-sm font-medium transition">Cancel</button>
          <button className="flex-1 py-3 rounded-xl bg-gradient-sos text-white text-sm font-bold shadow-glow-pink hover:opacity-90 transition">Send SOS Now</button>
        </div>
      </div>
    </div>
  );
}
