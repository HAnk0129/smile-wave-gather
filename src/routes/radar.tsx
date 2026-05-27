import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Flame, Users, Activity, MapPin, Sparkles, ArrowLeft, Wifi, MessageCircle, Heart } from "lucide-react";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "社交雷达 · Pulse" },
      { name: "description", content: "实时感知周边在线用户的分布、活跃度与社交热度。" },
      { property: "og:title", content: "社交雷达 · Pulse" },
      { property: "og:description", content: "用雷达扫描身边的同频灵魂。" },
    ],
  }),
  component: RadarPage,
});

type Blip = {
  id: number;
  name: string;
  age: number;
  angle: number;   // degrees 0-360
  radius: number;  // 0-1 normalized within max range
  distanceM: number;
  tag: string;
  heat: "hot" | "warm" | "cool";
  status: string;
  compat: number;
};

const RING_KM = [0.5, 1, 2, 5]; // ring radii in km
const MAX_KM = RING_KM[RING_KM.length - 1];

const NAMES = [
  "苏雨桐", "陈一然", "Luna", "周野", "夏季", "阿岚", "宥宥", "小满",
  "言之", "树洞", "Echo", "野草莓", "千禾", "白噪", "Momo", "南屿",
];
const TAGS = ["独立音乐", "City Walk", "猫奴", "冲浪", "摄影", "陶艺", "诗歌", "Livehouse", "桌游", "咖啡", "滑板", "瑜伽"];
const STATUSES = ["正在听歌", "刚发了动态", "想找人喝一杯", "在线 · 想聊", "刚上线", "正在直播", "求推荐电影", "周末有空"];

function rand<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

function makeBlips(count: number): Blip[] {
  return Array.from({ length: count }).map((_, i) => {
    const r = Math.pow(Math.random(), 0.7); // bias inward a bit
    const distanceM = Math.round(r * MAX_KM * 1000);
    const heat = r < 0.35 ? "hot" : r < 0.7 ? "warm" : "cool";
    return {
      id: Date.now() + i,
      name: rand(NAMES, Math.floor(Math.random() * 9999)),
      age: 22 + Math.floor(Math.random() * 10),
      angle: Math.random() * 360,
      radius: r,
      distanceM,
      tag: rand(TAGS, Math.floor(Math.random() * 9999)),
      heat,
      status: rand(STATUSES, Math.floor(Math.random() * 9999)),
      compat: 60 + Math.floor(Math.random() * 39),
    };
  });
}

function RadarPage() {
  const [sweep, setSweep] = useState(0);
  const [blips, setBlips] = useState<Blip[]>(() => makeBlips(28));
  const [selected, setSelected] = useState<Blip | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // sweep animation
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      setSweep((s) => (s + dt * 0.12) % 360);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // reveal blips as sweep passes
  useEffect(() => {
    setRevealed((prev) => {
      const next = new Set(prev);
      for (const b of blips) {
        const diff = ((sweep - b.angle + 360) % 360);
        if (diff < 6) next.add(b.id);
      }
      return next;
    });
  }, [sweep, blips]);

  // periodically refresh population
  useEffect(() => {
    const id = window.setInterval(() => {
      setBlips((prev) => {
        const keep = prev.slice(2);
        return [...keep, ...makeBlips(2)];
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const inRing = (max: number) => blips.filter((b) => b.distanceM <= max * 1000).length;
    return RING_KM.map((km) => ({ km, count: inRing(km) }));
  }, [blips]);

  const hot = blips.filter((b) => b.heat === "hot").length;
  const active = blips.filter((b) => b.heat !== "cool").length;
  const heatScore = Math.min(100, Math.round((hot * 6 + active * 2 + blips.length) * 0.9));

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--mint)_22%,transparent),transparent)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">返回</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mint to-coral text-background">
            <Radar className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">社交雷达</span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-mint/40 bg-mint/10 px-2.5 py-1 text-[11px] text-mint">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
          </span>
          LIVE
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-20 pt-4">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight">你周围有 {blips.length} 个同频灵魂</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> 上海 · 静安区 · 实时定位
          </p>
        </div>

        {/* Radar */}
        <div className="relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-full border border-mint/20 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--mint)_8%,transparent),transparent_70%)] shadow-[inset_0_0_60px_color-mix(in_oklab,var(--mint)_15%,transparent)]">
          {/* rings */}
          {RING_KM.map((km, i) => {
            const pct = (km / MAX_KM) * 100;
            return (
              <div
                key={km}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/25"
                style={{ width: `${pct}%`, height: `${pct}%` }}
              >
                <span className="absolute right-1 top-1 text-[9px] text-mint/60">{km}km</span>
              </div>
            );
          })}
          {/* crosshair */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-mint/15" />
          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-mint/15" />

          {/* sweep — narrow 8° wedge from center with full scan radius */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              transform: `rotate(${sweep}deg)`,
              background:
                "conic-gradient(from -4deg, color-mix(in oklab, var(--mint) 70%, transparent) 0deg, color-mix(in oklab, var(--mint) 35%, transparent) 4deg, transparent 8deg, transparent 360deg)",
            }}
          />

          {/* center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-coral to-sun text-background shadow-lg">
              <Heart className="h-4 w-4 fill-current" />
              <span className="absolute inset-0 -z-0 animate-ping rounded-full bg-coral/40" />
            </div>
          </div>

          {/* blips */}
          {blips.map((b) => {
            const isRevealed = revealed.has(b.id);
            const x = 50 + Math.cos((b.angle * Math.PI) / 180) * b.radius * 48;
            const y = 50 + Math.sin((b.angle * Math.PI) / 180) * b.radius * 48;
            const color = b.heat === "hot" ? "var(--coral)" : b.heat === "warm" ? "var(--sun)" : "var(--mint)";
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  opacity: isRevealed ? 1 : 0,
                }}
                aria-label={`${b.name} ${b.distanceM}m`}
              >
                <span
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 12px ${color}, 0 0 4px ${color}` }}
                />
                <span
                  className="absolute left-1/2 top-1/2 -z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full"
                  style={{ background: color, opacity: 0.5 }}
                />
              </button>
            );
          })}
        </div>

        {/* Ring stats */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {stats.map((s, i) => (
            <div key={s.km} className="rounded-xl border border-border bg-surface/70 p-2.5 text-center backdrop-blur">
              <div className="text-[10px] text-muted-foreground">≤ {s.km}km</div>
              <div className="font-display text-lg font-semibold text-foreground">{s.count}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (s.count / Math.max(1, blips.length)) * 100)}%`,
                    background: i === 0 ? "var(--coral)" : i === 1 ? "var(--sun)" : i === 2 ? "var(--mint)" : "color-mix(in oklab, var(--mint) 60%, var(--foreground))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Heat panel */}
        <div className="mt-4 rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-coral/15 text-coral">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">附近社交热度</div>
                <div className="font-display text-xl font-semibold">{heatScore}<span className="ml-1 text-xs text-muted-foreground">/ 100</span></div>
              </div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1 justify-end"><Wifi className="h-3 w-3 text-mint" />实时</div>
              <div className="mt-0.5">每 5s 刷新</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${heatScore}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-mint via-sun to-coral"
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <Legend color="var(--coral)" label="高活跃" value={hot} />
            <Legend color="var(--sun)" label="活跃中" value={blips.filter(b=>b.heat==='warm').length} />
            <Legend color="var(--mint)" label="潜水" value={blips.filter(b=>b.heat==='cool').length} />
          </div>
        </div>

        {/* Nearby list */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">最近上线</h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" />刚刚扫描到</span>
          </div>
          <ul className="space-y-2">
            {[...blips].sort((a, b) => a.distanceM - b.distanceM).slice(0, 5).map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setSelected(b)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface/70 p-3 text-left transition hover:border-mint/40 hover:bg-mint/90 active:bg-mint focus:bg-mint/90 dark:bg-[#f4f5f7] dark:border-[#d4d6dc] dark:hover:bg-white dark:active:bg-white dark:focus:bg-white"
                >
                  <div className="relative grid h-10 w-10 place-items-center rounded-full font-display font-semibold text-background dark:text-white"
                    style={{ background: b.heat==='hot' ? 'var(--coral)' : b.heat==='warm' ? 'var(--sun)' : 'var(--mint)' }}>
                    {b.name.slice(0,1)}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-mint dark:border-[#f4f5f7] group-hover:dark:border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium truncate group-hover:text-background dark:text-black dark:group-hover:text-black">{b.name}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-background/80 dark:text-black/70 dark:group-hover:text-black/80">{b.age}</span>
                      <span className="ml-auto text-xs text-muted-foreground group-hover:text-background/80 dark:text-black/70 dark:group-hover:text-black/80">{b.distanceM < 1000 ? `${b.distanceM}m` : `${(b.distanceM/1000).toFixed(1)}km`}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate group-hover:text-background/80 dark:text-black/70 dark:group-hover:text-black/80">#{b.tag} · {b.status}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Detail sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-black/50 backdrop-blur-sm sm:place-items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted sm:hidden" />
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-semibold text-background"
                  style={{ background: selected.heat==='hot' ? 'var(--coral)' : selected.heat==='warm' ? 'var(--sun)' : 'var(--mint)' }}>
                  {selected.name.slice(0,1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-display text-xl font-semibold">{selected.name}</h3>
                    <span className="text-muted-foreground">{selected.age}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {selected.distanceM < 1000 ? `${selected.distanceM}m` : `${(selected.distanceM/1000).toFixed(1)}km`} · {selected.status}
                  </div>
                </div>
                <Sparkles className="h-5 w-5 text-sun" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-border bg-background/40 px-2.5 py-1 text-[11px]">#{selected.tag}</span>
                <span className="rounded-full border border-mint/40 bg-mint/10 px-2.5 py-1 text-[11px] text-mint">同频度 {selected.compat}%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 py-3 text-sm hover:bg-background/70">
                  <MessageCircle className="h-4 w-4" /> 打招呼
                </button>
                <Link to="/discover" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-sun py-3 text-sm font-semibold text-background">
                  <Heart className="h-4 w-4 fill-current" /> 查看资料
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold text-foreground">{value}</span>
    </div>
  );
}