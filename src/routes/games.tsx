import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Dices, Flame, Hand, Heart, MessagesSquare, Sparkles, Trophy, Users, Wand2, Zap, BadgeCheck } from "lucide-react";
import { NeonInner, neonButtonClass } from "@/components/AuthButtons";
import { BottomNav } from "@/components/BottomNav";

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
  href?: string;
};

const GAMES: Game[] = [
  {
    id: "sbti",
    title: "SBTI 趣味人格测试",
    tagline: "解锁你的专属人格铭牌。",
    desc: "26 种抽象人格任你选，专属铭牌 + 限定虚拟装扮，一键装备到个人主页。",
    players: "1 人",
    duration: "1-3 分钟",
    hotness: 99,
    color: "coral",
    icon: BadgeCheck,
    badge: "限定铭牌",
    href: "/games/sbti",
  },
  {
    id: "palm",
    title: "AI 看手相",
    tagline: "拍张手掌，读懂你的爱情线。",
    desc: "上传手掌照片，AI 解读感情线、生命线与事业线。生成专属手相报告，可与心动对象交换查看缘分契合度。",
    players: "1 人 / 双人对照",
    duration: "1-2 分钟",
    hotness: 96,
    color: "coral",
    icon: Hand,
    badge: "AI 新玩法",
    href: "/games/palm",
  },
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
    hotness: 78,
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
  const location = useLocation();

  if (location.pathname !== "/games") {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--coral)_22%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6">
        <Link to="/explore" className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回发现
        </Link>
        <Link to="/games/leaderboard" className={neonButtonClass("ghost")}>
          <NeonInner variant="ghost">
            <Trophy className="size-4 text-sun" />
            战绩榜
          </NeonInner>
        </Link>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
          小 <span className="font-serif-display italic text-gradient-hero">游戏</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          精选轻量社交小游戏，让你们的第一句话就有意思。
        </p>
        <div className="mt-10">
          <GameGrid />
        </div>
      </main>
      <BottomNav active="games" />
    </div>
  );
}

function GameGrid() {
  const [filter, setFilter] = useState<"all" | "2人" | "群聊" | "新">("all");
  const filters: Array<typeof filter> = ["all", "2人", "群聊", "新"];
  const labels: Record<string, string> = { all: "全部", "2人": "双人", 群聊: "群聊", 新: "新上线" };

  return (
    <section>
      <div className="flex items-center justify-end gap-2 mb-6 overflow-x-auto">
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

      {game.href ? (
        <a href={game.href} className={`${neonButtonClass("coral")} w-full justify-center`}>
          <NeonInner variant="coral">
            立即开玩
            <ArrowRight className="size-3.5" />
          </NeonInner>
        </a>
      ) : (
        <button disabled className={`${neonButtonClass("ghost")} w-full justify-center opacity-60 cursor-not-allowed`}>
          <NeonInner variant="ghost">敬请期待</NeonInner>
        </button>
      )}
    </div>
  );
}
