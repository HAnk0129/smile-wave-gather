import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Crown,
  Flame,
  Heart,
  Medal,
  Sparkles,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/games/leaderboard")({
  head: () => ({
    meta: [
      { title: "战绩排行榜 · Pulse 游戏" },
      {
        name: "description",
        content: "查看 Pulse 破冰游戏全服玩家排行榜：心动分数、胜率、连胜与高光时刻一目了然。",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Player = {
  rank: number;
  name: string;
  avatar: string;
  level: string;
  score: number;
  winRate: number;
  matches: number;
  streak: number;
  favorite: string;
  badge?: "champ" | "rising" | "hot";
};

type Period = "daily" | "weekly" | "season";
type Mode = "all" | "truth" | "soul" | "blindbox" | "palm";

const SEED: Record<Period, Player[]> = {
  daily: [
    { rank: 1, name: "夜航星", avatar: "🌙", level: "心动 LV.32", score: 4820, winRate: 0.87, matches: 23, streak: 11, favorite: "灵魂 36 问", badge: "champ" },
    { rank: 2, name: "苏打水气泡", avatar: "🫧", level: "心动 LV.28", score: 4612, winRate: 0.82, matches: 19, streak: 7, favorite: "真心话 · 心动版", badge: "hot" },
    { rank: 3, name: "Lumi", avatar: "🪐", level: "心动 LV.26", score: 4501, winRate: 0.79, matches: 21, streak: 5, favorite: "AI 看手相" },
    { rank: 4, name: "鹿不食人间", avatar: "🦌", level: "心动 LV.24", score: 4188, winRate: 0.74, matches: 17, streak: 3, favorite: "心动盲盒", badge: "rising" },
    { rank: 5, name: "周柒柒", avatar: "🍑", level: "心动 LV.22", score: 3950, winRate: 0.71, matches: 14, streak: 2, favorite: "真心话 · 心动版" },
    { rank: 6, name: "Echo_22", avatar: "🎧", level: "心动 LV.21", score: 3820, winRate: 0.69, matches: 16, streak: 2, favorite: "接龙故事" },
    { rank: 7, name: "梅子味雪糕", avatar: "🍧", level: "心动 LV.20", score: 3702, winRate: 0.66, matches: 12, streak: 1, favorite: "灵魂 36 问" },
    { rank: 8, name: "K.", avatar: "🖤", level: "心动 LV.19", score: 3590, winRate: 0.64, matches: 15, streak: 1, favorite: "你会怎么选" },
    { rank: 9, name: "南野", avatar: "🌿", level: "心动 LV.18", score: 3422, winRate: 0.62, matches: 13, streak: 0, favorite: "AI 看手相" },
    { rank: 10, name: "0.5 倍速", avatar: "🐢", level: "心动 LV.17", score: 3290, winRate: 0.59, matches: 11, streak: 0, favorite: "今日情绪同步" },
  ],
  weekly: [
    { rank: 1, name: "苏打水气泡", avatar: "🫧", level: "心动 LV.28", score: 21850, winRate: 0.84, matches: 142, streak: 18, favorite: "灵魂 36 问", badge: "champ" },
    { rank: 2, name: "夜航星", avatar: "🌙", level: "心动 LV.32", score: 20902, winRate: 0.81, matches: 137, streak: 14, favorite: "真心话 · 心动版", badge: "hot" },
    { rank: 3, name: "盐汽水_", avatar: "🧂", level: "心动 LV.27", score: 19770, winRate: 0.78, matches: 129, streak: 9, favorite: "AI 看手相" },
    { rank: 4, name: "Lumi", avatar: "🪐", level: "心动 LV.26", score: 19014, winRate: 0.76, matches: 124, streak: 6, favorite: "心动盲盒", badge: "rising" },
    { rank: 5, name: "鹿不食人间", avatar: "🦌", level: "心动 LV.24", score: 17880, winRate: 0.72, matches: 118, streak: 5, favorite: "接龙故事" },
    { rank: 6, name: "Echo_22", avatar: "🎧", level: "心动 LV.21", score: 16420, winRate: 0.69, matches: 110, streak: 4, favorite: "灵魂 36 问" },
    { rank: 7, name: "周柒柒", avatar: "🍑", level: "心动 LV.22", score: 15990, winRate: 0.67, matches: 104, streak: 3, favorite: "真心话 · 心动版" },
    { rank: 8, name: "K.", avatar: "🖤", level: "心动 LV.19", score: 15012, winRate: 0.64, matches: 98, streak: 2, favorite: "你会怎么选" },
    { rank: 9, name: "梅子味雪糕", avatar: "🍧", level: "心动 LV.20", score: 14488, winRate: 0.61, matches: 92, streak: 1, favorite: "AI 看手相" },
    { rank: 10, name: "南野", avatar: "🌿", level: "心动 LV.18", score: 13750, winRate: 0.58, matches: 88, streak: 0, favorite: "今日情绪同步" },
  ],
  season: [
    { rank: 1, name: "夜航星", avatar: "🌙", level: "心动 LV.32", score: 98220, winRate: 0.83, matches: 612, streak: 22, favorite: "灵魂 36 问", badge: "champ" },
    { rank: 2, name: "苏打水气泡", avatar: "🫧", level: "心动 LV.28", score: 94110, winRate: 0.8, matches: 588, streak: 16, favorite: "真心话 · 心动版", badge: "hot" },
    { rank: 3, name: "Lumi", avatar: "🪐", level: "心动 LV.26", score: 89030, winRate: 0.77, matches: 560, streak: 11, favorite: "AI 看手相" },
    { rank: 4, name: "盐汽水_", avatar: "🧂", level: "心动 LV.27", score: 86402, winRate: 0.75, matches: 542, streak: 9, favorite: "心动盲盒" },
    { rank: 5, name: "鹿不食人间", avatar: "🦌", level: "心动 LV.24", score: 81005, winRate: 0.71, matches: 514, streak: 6, favorite: "接龙故事", badge: "rising" },
    { rank: 6, name: "Echo_22", avatar: "🎧", level: "心动 LV.21", score: 76120, winRate: 0.67, matches: 490, streak: 4, favorite: "灵魂 36 问" },
    { rank: 7, name: "周柒柒", avatar: "🍑", level: "心动 LV.22", score: 72018, winRate: 0.64, matches: 472, streak: 3, favorite: "真心话 · 心动版" },
    { rank: 8, name: "K.", avatar: "🖤", level: "心动 LV.19", score: 68433, winRate: 0.61, matches: 450, streak: 2, favorite: "你会怎么选" },
    { rank: 9, name: "梅子味雪糕", avatar: "🍧", level: "心动 LV.20", score: 64220, winRate: 0.58, matches: 422, streak: 1, favorite: "AI 看手相" },
    { rank: 10, name: "南野", avatar: "🌿", level: "心动 LV.18", score: 60110, winRate: 0.54, matches: 398, streak: 0, favorite: "今日情绪同步" },
  ],
};

const ME = {
  name: "你",
  avatar: "✨",
  level: "心动 LV.14",
  score: 2480,
  winRate: 0.61,
  matches: 38,
  streak: 4,
  rank: 1287,
  favorite: "真心话 · 心动版",
  delta: 18,
};

function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [mode, setMode] = useState<Mode>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const list = useMemo(() => {
    const base = SEED[period];
    if (mode === "all") return base;
    const factor: Record<Mode, number> = { all: 1, truth: 0.95, soul: 1.05, blindbox: 0.88, palm: 0.92 };
    return base.map((p) => ({
      ...p,
      score: Math.round(p.score * (factor[mode] ?? 1)),
      winRate: Math.max(0.3, Math.min(0.95, p.winRate * (factor[mode] ?? 1))),
    }));
  }, [period, mode]);

  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <Hero period={period} setPeriod={setPeriod} />
      <main className="mx-auto max-w-5xl px-4 md:px-6 pb-24">
        <MyStats />
        <ModeTabs mode={mode} setMode={setMode} />
        <Podium players={podium} />
        <RankList players={rest} />
        <SeasonInfo />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 md:px-6 h-14 flex items-center justify-between">
        <Link to="/games" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="size-4" />
          返回游戏
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-sun" />
          <span className="font-display font-bold tracking-tight">战绩榜</span>
        </div>
        <Link to="/discover" className="text-sm text-muted-foreground hover:text-foreground transition">发现</Link>
      </div>
    </header>
  );
}

function Hero({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  const real: { id: Period; label: string }[] = [
    { id: "daily", label: "今日" },
    { id: "weekly", label: "本周" },
    { id: "season", label: "本赛季" },
  ];

  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-10 left-1/4 size-[320px] rounded-full bg-coral/25 blur-[120px]" />
      <div className="absolute -top-10 right-1/4 size-[320px] rounded-full bg-sun/25 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 md:px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-sun" />
          <span>S2 赛季 · 距结算还有 12 天</span>
        </div>
        <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight leading-[0.95]">
          <span className="font-serif-display italic text-gradient-hero">心动</span>战绩榜
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground">
          胜率、连胜、高光时刻 — 看看谁正在 Pulse 撩动人心。
        </p>

        <div className="mt-6 inline-flex p-1 rounded-full border border-border bg-surface/60 backdrop-blur">
          {real.map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
              className={`h-9 px-5 rounded-full text-sm font-medium transition ${
                period === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MyStats() {
  return (
    <div className="relative mt-2 mb-8 overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur p-5 md:p-6">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-coral/20 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-coral via-sun to-mint flex items-center justify-center text-2xl">
          {ME.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-lg">{ME.name}</span>
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-mint/15 text-mint px-2 py-0.5 font-bold">
              {ME.level}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            最爱：{ME.favorite}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">当前排名</div>
          <div className="font-display text-2xl font-bold">#{ME.rank}</div>
          <div className="text-[11px] text-mint inline-flex items-center gap-0.5">
            <TrendingUp className="size-3" /> +{ME.delta}
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-4 gap-2 md:gap-4">
        <Stat label="心动分" value={ME.score.toLocaleString()} color="coral" />
        <Stat label="胜率" value={`${Math.round(ME.winRate * 100)}%`} color="mint" />
        <Stat label="场次" value={ME.matches} color="sun" />
        <Stat label="连胜" value={`${ME.streak} 连`} color="coral" icon={Flame} />
      </div>

      <div className="relative mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>距下一段位</span>
          <span>{ME.score} / 3000</span>
        </div>
        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-coral via-sun to-mint"
            style={{ width: `${Math.min(100, (ME.score / 3000) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: "coral" | "sun" | "mint";
  icon?: typeof Flame;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-3 text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-display text-lg md:text-xl font-bold inline-flex items-center gap-1" style={{ color: `var(--${color})` }}>
        {Icon ? <Icon className="size-3.5" /> : null}
        {value}
      </div>
    </div>
  );
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tabs: { id: Mode; label: string }[] = [
    { id: "all", label: "全部游戏" },
    { id: "truth", label: "真心话" },
    { id: "soul", label: "灵魂 36 问" },
    { id: "blindbox", label: "心动盲盒" },
    { id: "palm", label: "AI 看手相" },
  ];
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setMode(t.id)}
          className={`shrink-0 h-9 px-4 rounded-full text-sm border transition ${
            mode === t.id
              ? "bg-foreground text-background border-foreground"
              : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Podium({ players }: { players: Player[] }) {
  const order = [players[1], players[0], players[2]].filter(Boolean);
  const heights = ["h-28", "h-36", "h-24"];
  const accents = ["mint", "coral", "sun"] as const;
  return (
    <section className="mb-6">
      <div className="grid grid-cols-3 gap-3 items-end">
        {order.map((p, idx) => {
          const color = accents[idx];
          const isFirst = idx === 1;
          return (
            <div key={p.rank} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div
                  className={`relative size-14 md:size-16 rounded-2xl flex items-center justify-center text-2xl border-2`}
                  style={{
                    background: `color-mix(in oklab, var(--${color}) 18%, transparent)`,
                    borderColor: `var(--${color})`,
                  }}
                >
                  {p.avatar}
                  {isFirst && (
                    <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 size-5 text-sun fill-sun" />
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold truncate max-w-full">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">{Math.round(p.winRate * 100)}% 胜率</div>
              <div
                className={`${heights[idx]} w-full mt-2 rounded-t-2xl border border-b-0 border-border flex flex-col items-center justify-center p-2`}
                style={{
                  background: `linear-gradient(180deg, color-mix(in oklab, var(--${color}) 22%, transparent), transparent)`,
                }}
              >
                <div className="font-display text-2xl md:text-3xl font-bold" style={{ color: `var(--${color})` }}>
                  {p.score.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {p.rank === 1 ? "冠军" : p.rank === 2 ? "亚军" : "季军"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RankList({ players }: { players: Player[] }) {
  return (
    <section className="rounded-3xl border border-border bg-surface/40 backdrop-blur overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-border text-xs text-muted-foreground">
        <span>排名 · 玩家</span>
        <span className="flex items-center gap-6">
          <span className="w-14 text-right">胜率</span>
          <span className="w-16 text-right">心动分</span>
        </span>
      </div>
      <ul>
        {players.map((p) => (
          <li
            key={p.rank}
            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface/60 transition"
          >
            <span className="w-6 text-center font-display font-bold text-muted-foreground">{p.rank}</span>
            <div className="size-10 rounded-xl bg-background/60 border border-border flex items-center justify-center text-lg shrink-0">
              {p.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold truncate">{p.name}</span>
                {p.badge === "champ" && <Medal className="size-3.5 text-sun" />}
                {p.badge === "rising" && <TrendingUp className="size-3.5 text-mint" />}
                {p.badge === "hot" && <Flame className="size-3.5 text-coral" />}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {p.level} · {p.matches} 场 · {p.streak > 0 && <span className="text-coral">{p.streak} 连胜</span>}
                {p.streak === 0 && <span>最爱 {p.favorite}</span>}
              </div>
            </div>
            <WinBar rate={p.winRate} />
            <span className="w-16 text-right font-display font-bold tabular-nums">
              {p.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WinBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 75 ? "mint" : pct >= 60 ? "sun" : "coral";
  return (
    <div className="w-14 hidden sm:flex flex-col items-end gap-1">
      <span className="text-[11px] font-semibold tabular-nums" style={{ color: `var(--${color})` }}>
        {pct}%
      </span>
      <div className="w-full h-1 rounded-full bg-border/60 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `var(--${color})` }} />
      </div>
    </div>
  );
}

function SeasonInfo() {
  return (
    <section className="mt-8 grid sm:grid-cols-3 gap-3">
      <Card icon={Trophy} color="sun" title="冠军奖励" desc="赛季 TOP 10 解锁专属头像框与限定昵称称号" />
      <Card icon={Heart} color="coral" title="心动加成" desc="连胜 5 场以上获得 1.5× 心动分加倍" />
      <Card icon={Zap} color="mint" title="每日任务" desc="完成 3 局任意游戏，额外获得 200 心动分" />
    </section>
  );
}

function Card({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: typeof Trophy;
  color: "coral" | "sun" | "mint";
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div
        className="size-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `color-mix(in oklab, var(--${color}) 18%, transparent)` }}
      >
        <Icon className="size-4" style={{ color: `var(--${color})` }} />
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
    </div>
  );
}
