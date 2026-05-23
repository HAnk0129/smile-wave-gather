import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Dices, Flame, Heart, MessagesSquare, Sparkles, Users, Wand2, Zap } from "lucide-react";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "破冰游戏 · Pulse — 让聊天不再尬聊" },
      { name: "description", content: "Pulse 精选社交破冰小游戏：真心话大冒险、心动盲盒、灵魂问答、双人节奏。让每一次相遇都更有趣。" },
      { property: "og:title", content: "破冰游戏 · Pulse" },
      { property: "og:description", content: "和心动的人一起玩，从一次心跳开始的社交小游戏合集。" },
    ],
  }),
  component: GamesPage,
});

type Game = {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  players: string;
  duration: string;
  hotness: number;
  color: "coral" | "sun" | "mint";
  icon: typeof Heart;
  badge?: string;
};

const GAMES: Game[] = [
  {
    id: "truth",
    title: "真心话 · 心动版",
    tagline: "100 道走心问题，从浅聊到深聊。",
    desc: "覆盖日常、回忆、爱情、未来四大主题。系统会根据你们的聊天进度逐步解锁更深入的问题。",
    players: "2 人",
    duration: "5-15 分钟",
    hotness: 92,
    color: "coral",
    icon: Heart,
    badge: "最受欢迎",
  },
  {
    id: "blindbox",
    title: "心动盲盒",
    tagline: "随机抽取，缘分由系统决定。",
    desc: "每天 3 次机会，盲抽一位附近同频的人，限时 24 小时聊天窗口。聊得来就解锁完整资料。",
    players: "1v1",
    duration: "24 小时",
    hotness: 88,
    color: "sun",
    icon: Dices,
  },
  {
    id: "soul",
    title: "灵魂 36 问",
    tagline: "心理学经典：让任何两个人爱上彼此。",
    desc: "源自著名社会心理学实验，由浅入深的 36 个问题，据说能在 45 分钟内让陌生人产生强烈连接。",
    players: "2 人",
    duration: "30-45 分钟",
    hotness: 95,
    color: "mint",
    icon: Sparkles,
    badge: "高浓度",
  },
  {
    id: "wouldyou",
    title: "你会怎么选",
    tagline: "二选一，秒懂三观契合度。",
    desc: "山或海？早 C 晚 A？50 道犀利二选一，实时比对你们的契合度。",
    players: "2 人",
    duration: "3-5 分钟",
    hotness: 80,
    color: "coral",
    icon: Zap,
  },
  {
    id: "story",
    title: "接龙故事",
    tagline: "一人一句，写出只属于你们的剧本。",
    desc: "AI 给开头，你们轮流续写。结束时生成一张专属漫画封面，可保存收藏。",
    players: "2-4 人",
    duration: "10 分钟",
    hotness: 76,
    color: "mint",
    icon: Wand2,
  },
  {
    id: "vibe",
    title: "今日情绪同步",
    tagline: "用一个 emoji 描述此刻的你。",
    desc: "每日轻量打卡，匹配情绪相近的人。失眠的、高兴的、想被抱抱的，都能找到此刻的同类。",
    players: "开放匹配",
    duration: "随时",
    hotness: 84,
    color: "sun",
    icon: MessagesSquare,
  },
];

function GamesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <DemoPlayground />
      <GameGrid />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-br from-coral via-sun to-mint flex items-center justify-center glow-coral">
            <Heart className="size-4 text-background fill-background" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Pulse</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/games" className="text-foreground transition">游戏</Link>
          <Link to="/radar" className="hover:text-foreground transition">社交雷达</Link>
          <Link to="/discover" className="hover:text-foreground transition">发现</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 px-4 rounded-full border border-border bg-surface/60 text-sm hover:bg-surface transition">登录</button>
          <button className="inline-flex h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">注册</button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute top-10 -left-20 size-[420px] rounded-full bg-sun/25 blur-[120px]" />
      <div className="absolute top-32 right-0 size-[380px] rounded-full bg-coral/25 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-12 md:pt-28 md:pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-coral" />
          <span>本周新增 3 款破冰游戏</span>
        </div>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight leading-[0.95]">
          <span className="font-serif-display italic text-gradient-hero">玩</span>着玩着，<br />
          就熟了。
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
          告别"在吗 / 吃了吗"。Pulse 游戏中心精选 20+ 款轻量社交小游戏，
          让你们的第一句话就有意思。
        </p>
      </div>
    </section>
  );
}

function DemoPlayground() {
  const questions = useMemo(
    () => [
      "如果今晚可以瞬移到任何地方，你想去哪里？",
      "上一次让你嘴角不自觉上扬的瞬间是什么？",
      "你手机里循环最多的一首歌？为什么？",
      "如果只能再吃一种食物过一辈子，选什么？",
      "你最近一次脸红是因为？",
      "童年里最想再回去一次的场景是？",
      "如果可以删除一段记忆，你会删掉哪段？",
      "你觉得自己最性感的瞬间是什么时候？",
    ],
    [],
  );
  const [i, setI] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    let step = 0;
    const id = setInterval(() => {
      setI((p) => (p + 1) % questions.length);
      step++;
      if (step > 10) {
        clearInterval(id);
        setSpinning(false);
      }
    }, 80);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-coral font-semibold">现在就试试</span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight">
            真心话 · 心动版
            <br />
            <span className="font-serif-display italic text-mint">点一下，立刻破冰。</span>
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
            最受欢迎的破冰游戏。我们从 100 道走心问题中随机抽一道——
            你也可以在 Pulse App 中和心动的他/她一起玩。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Pill icon={Users} label="2 人对战" />
            <Pill icon={Flame} label="热度 92°" color="coral" />
            <Pill icon={Sparkles} label="走心指数 ★★★★" color="sun" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-coral/20 via-sun/10 to-mint/20 blur-3xl rounded-[40px]" />
          <div className="relative rounded-[32px] border border-border bg-surface/70 backdrop-blur p-8 md:p-10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-display tracking-wider">QUESTION #{String(i + 1).padStart(3, "0")}</span>
              <span className="text-xs rounded-full bg-coral/15 text-coral px-2 py-1 font-semibold">心动 LV.1</span>
            </div>

            <div className="mt-6 min-h-[140px] flex items-center">
              <p
                key={i}
                className="font-display text-2xl md:text-3xl font-bold leading-snug animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                "{questions[i]}"
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={spin}
                disabled={spinning}
                className="group flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold glow-coral hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-70"
              >
                <Dices className={`size-4 ${spinning ? "animate-spin" : "group-hover:rotate-12 transition"}`} />
                {spinning ? "正在抽卡…" : "换一题"}
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-border bg-surface hover:bg-surface-2 transition text-sm font-semibold">
                <Heart className="size-4 text-coral" />
                收藏这题
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>共 100 题</span>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, k) => (
                  <span
                    key={k}
                    className={`size-1.5 rounded-full ${k === i % 5 ? "bg-coral w-4" : "bg-border"} transition-all`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ icon: Icon, label, color = "mint" }: { icon: typeof Users; label: string; color?: "coral" | "sun" | "mint" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 bg-surface/60"
      style={{ color: `var(--${color})` }}
    >
      <Icon className="size-3.5" />
      <span className="text-foreground">{label}</span>
    </span>
  );
}

function GameGrid() {
  const [filter, setFilter] = useState<"all" | "2人" | "群聊" | "新">("all");
  const filters: Array<typeof filter> = ["all", "2人", "群聊", "新"];
  const labels: Record<string, string> = { all: "全部", "2人": "双人", 群聊: "群聊", 新: "新上线" };

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-mint font-semibold">游戏库</span>
          <h2 className="mt-3 font-display text-3xl md:text-5xl font-bold tracking-tight">
            选一款，开始 <span className="font-serif-display italic text-coral">心跳</span>。
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm border transition ${
                filter === f
                  ? "bg-foreground text-background border-foreground"
                  : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}

function GameCard({ game }: { game: Game }) {
  const Icon = game.icon;
  return (
    <div className="group relative rounded-3xl border border-border bg-surface/60 backdrop-blur p-6 hover:bg-surface transition overflow-hidden">
      <div
        className="absolute -top-16 -right-16 size-48 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition"
        style={{ background: `var(--${game.color})` }}
      />
      <div className="relative flex items-start justify-between mb-5">
        <div
          className="size-12 rounded-2xl flex items-center justify-center"
          style={{ background: `color-mix(in oklab, var(--${game.color}) 20%, transparent)` }}
        >
          <Icon className="size-5" style={{ color: `var(--${game.color})` }} />
        </div>
        {game.badge && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1"
            style={{
              background: `color-mix(in oklab, var(--${game.color}) 18%, transparent)`,
              color: `var(--${game.color})`,
            }}
          >
            {game.badge}
          </span>
        )}
      </div>

      <h3 className="relative text-xl font-bold mb-1">{game.title}</h3>
      <p className="relative text-sm text-coral/90 mb-3" style={{ color: `var(--${game.color})` }}>
        {game.tagline}
      </p>
      <p className="relative text-sm text-muted-foreground leading-relaxed mb-5 min-h-[60px]">{game.desc}</p>

      <div className="relative flex items-center justify-between text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><Users className="size-3" />{game.players}</span>
          <span>·</span>
          <span>{game.duration}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-coral">
          <Flame className="size-3" />
          {game.hotness}°
        </span>
      </div>

      <button className="relative w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-background/60 border border-border text-sm font-semibold hover:bg-foreground hover:text-background transition">
        立即开玩
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div
        className="relative overflow-hidden rounded-[40px] p-10 md:p-16 text-center"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 22), oklch(0.55 0.2 350) 60%, oklch(0.4 0.15 270))" }}
      >
        <div className="absolute -top-20 -left-20 size-80 rounded-full bg-sun/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-mint/30 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
            找到那个能<span className="font-serif-display italic">陪你玩</span>的人。
          </h2>
          <p className="mt-4 text-white/80 max-w-md mx-auto">先匹配，再开聊。让游戏成为你们故事的开场。</p>
          <Link
            to="/discover"
            className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-background text-foreground font-semibold hover:scale-[1.02] transition"
          >
            去发现页匹配
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-gradient-to-br from-coral via-sun to-mint" />
          <span className="font-display font-bold text-foreground">Pulse</span>
          <span>· 玩出来的心动</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-foreground transition">首页</Link>
          <Link to="/discover" className="hover:text-foreground transition">发现</Link>
          <Link to="/radar" className="hover:text-foreground transition">雷达</Link>
        </div>
      </div>
    </footer>
  );
}
