import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X, Star, Sparkles, MapPin, Undo2, MessageCircle, Flame } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "发现 · Pulse" },
      { name: "description", content: "在 Pulse 上滑动卡片，遇见同频的人。" },
      { property: "og:title", content: "发现 · Pulse" },
      { property: "og:description", content: "滑动卡片，遇见同频的人。" },
    ],
  }),
  component: DiscoverPage,
});

type Profile = {
  id: number;
  name: string;
  age: number;
  city: string;
  distance: string;
  bio: string;
  tags: string[];
  gradient: string;
  match: number;
};

const PROFILES: Profile[] = [
  {
    id: 1, name: "苏雨桐", age: 24, city: "上海 · 静安",
    distance: "1.2 km",
    bio: "喜欢去 livehouse 听独立乐队，周末沿着苏州河散步，找一个能一起赖在沙发上看老电影的人。",
    tags: ["独立音乐", "电影", "City Walk", "猫"],
    gradient: "from-[#ff8a7a] via-[#ff5a6e] to-[#7a4bff]",
    match: 96,
  },
  {
    id: 2, name: "陈一然", age: 27, city: "北京 · 朝阳",
    distance: "3.8 km",
    bio: "前端工程师 / 业余冲浪选手。最近在学陶艺,周末常常往海边跑。想找一个能一起做傻事的伙伴。",
    tags: ["冲浪", "陶艺", "代码", "旅行"],
    gradient: "from-[#5eead4] via-[#38bdf8] to-[#6366f1]",
    match: 92,
  },
  {
    id: 3, name: "Luna 林", age: 23, city: "成都 · 锦江",
    distance: "0.6 km",
    bio: "插画师,养了一只叫年糕的橘猫。喜欢小酒馆、爵士乐和一切毛茸茸的东西。",
    tags: ["插画", "爵士", "猫奴", "小酒馆"],
    gradient: "from-[#fde68a] via-[#fb923c] to-[#ef4444]",
    match: 89,
  },
  {
    id: 4, name: "周野", age: 29, city: "杭州 · 西湖",
    distance: "5.1 km",
    bio: "户外向导,带过 200+ 人去爬雪山。简介里写不下我去过的地方,但写得下我想和谁一起去。",
    tags: ["登山", "摄影", "露营", "滑雪"],
    gradient: "from-[#a7f3d0] via-[#34d399] to-[#0f766e]",
    match: 87,
  },
  {
    id: 5, name: "夏季限定", age: 25, city: "广州 · 天河",
    distance: "2.4 km",
    bio: "广告策划,白天写 brief,晚上写诗。最近在练习不那么用力地生活。",
    tags: ["写作", "诗歌", "美食", "瑜伽"],
    gradient: "from-[#fbcfe8] via-[#f472b6] to-[#7c3aed]",
    match: 84,
  },
];

function DiscoverPage() {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ id: number; dir: "left" | "right" | "up" }>>([]);
  const [lastAction, setLastAction] = useState<"like" | "nope" | "super" | null>(null);
  const [matched, setMatched] = useState<Profile | null>(null);

  const current = PROFILES[index % PROFILES.length];
  const next = PROFILES[(index + 1) % PROFILES.length];
  const after = PROFILES[(index + 2) % PROFILES.length];

  const swipe = (dir: "left" | "right" | "up") => {
    setHistory((h) => [...h, { id: current.id, dir }]);
    setLastAction(dir === "right" ? "like" : dir === "left" ? "nope" : "super");
    if (dir === "right" || dir === "up") {
      // simulate ~50% chance of mutual match, super-like always matches
      if (dir === "up" || Math.random() < 0.5) {
        const matchedProfile = current;
        window.setTimeout(() => setMatched(matchedProfile), 600);
      }
    }
    setIndex((i) => i + 1);
    window.setTimeout(() => setLastAction(null), 700);
  };

  const undo = () => {
    if (!history.length) return;
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--coral)_25%,transparent),transparent)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-coral to-sun text-background">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Pulse</span>
        </Link>
        <button className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          附近 · 5km 内
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-28 pt-6">
        <div className="mb-4 flex w-full items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">今天为你推荐</h1>
            <p className="text-sm text-muted-foreground">基于你的兴趣 · 实时更新</p>
          </div>
          <div className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
            {Math.min(index + 1, PROFILES.length)} / {PROFILES.length}
          </div>
        </div>

        {/* Card stack */}
        <div className="relative h-[560px] w-full">
          {/* back-2 */}
          <StaticCard profile={after} offset={2} />
          {/* back-1 */}
          <StaticCard profile={next} offset={1} />
          {/* front */}
          <AnimatePresence mode="popLayout">
            <SwipeCard key={current.id + "-" + index} profile={current} onSwipe={swipe} />
          </AnimatePresence>

          {/* action flash */}
          <AnimatePresence>
            {lastAction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
              >
                <div className={
                  "rounded-full px-6 py-3 text-lg font-bold backdrop-blur " +
                  (lastAction === "like"
                    ? "bg-mint/20 text-mint border border-mint/40"
                    : lastAction === "super"
                    ? "bg-sun/20 text-sun border border-sun/40"
                    : "bg-destructive/20 text-destructive border border-destructive/40")
                }>
                  {lastAction === "like" ? "LIKE" : lastAction === "super" ? "SUPER" : "NOPE"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action bar */}
        <div className="mt-8 flex items-center gap-4">
          <ActionBtn label="撤回" onClick={undo} className="h-12 w-12 border-border bg-surface text-muted-foreground hover:text-foreground">
            <Undo2 className="h-5 w-5" />
          </ActionBtn>
          <ActionBtn label="跳过" onClick={() => swipe("left")} className="h-16 w-16 border-destructive/40 bg-surface text-destructive hover:bg-destructive/10">
            <X className="h-7 w-7" />
          </ActionBtn>
          <ActionBtn label="超级喜欢" onClick={() => swipe("up")} className="h-14 w-14 border-sun/40 bg-surface text-sun hover:bg-sun/10">
            <Star className="h-6 w-6" />
          </ActionBtn>
          <ActionBtn label="喜欢" onClick={() => swipe("right")} className="h-16 w-16 border-mint/40 bg-gradient-to-br from-mint/20 to-coral/20 text-coral hover:from-mint/30 hover:to-coral/30">
            <Heart className="h-7 w-7 fill-current" />
          </ActionBtn>
          <ActionBtn label="打招呼" onClick={() => swipe("right")} className="h-12 w-12 border-border bg-surface text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-5 w-5" />
          </ActionBtn>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          左右滑动卡片 · 向上滑动表示超级喜欢
        </p>
      </main>

      <AnimatePresence>
        {matched && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-5 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 18 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-coral/40 bg-surface p-6 text-center shadow-2xl"
            >
              <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${matched.gradient} opacity-50`} />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.3em] text-coral">It's a Match</div>
                <h2 className="mt-2 font-display text-3xl font-semibold">你们互相喜欢 💞</h2>
                <p className="mt-1 text-sm text-muted-foreground">和 {matched.name} 同频度 {matched.match}%</p>

                <div className="relative mx-auto mt-6 flex items-center justify-center">
                  <div className="grid h-24 w-24 -mr-4 place-items-center rounded-full border-4 border-background bg-gradient-to-br from-coral to-sun font-display text-2xl text-background shadow-lg">我</div>
                  <div className={`grid h-24 w-24 -ml-4 place-items-center rounded-full border-4 border-background bg-gradient-to-br ${matched.gradient} font-display text-2xl text-background shadow-lg`}>
                    {matched.name.slice(0, 1)}
                  </div>
                  <motion.div
                    className="absolute grid h-10 w-10 place-items-center rounded-full bg-coral text-background shadow-xl"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </motion.div>
                </div>

                <Link
                  to="/chat"
                  search={{ name: matched.name, avatar: matched.gradient, from: "match", city: matched.city }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-sun px-4 py-3 text-sm font-semibold text-background shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" /> 发送第一条消息
                </Link>
                <button onClick={() => setMatched(null)} className="mt-3 w-full text-xs text-muted-foreground">继续滑卡</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StaticCard({ profile, offset }: { profile: Profile; offset: number }) {
  const scale = 1 - offset * 0.05;
  const y = offset * 14;
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
      style={{ transform: `translateY(${y}px) scale(${scale})`, opacity: 1 - offset * 0.25, zIndex: 10 - offset }}
    >
      <div className={`h-full w-full bg-gradient-to-br ${profile.gradient}`} />
    </div>
  );
}

function SwipeCard({ profile, onSwipe }: { profile: Profile; onSwipe: (d: "left" | "right" | "up") => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const nopeOpacity = useTransform(x, [-160, -40], [1, 0]);
  const superOpacity = useTransform(y, [-160, -40], [1, 0]);

  const handleEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.y < -120 || velocity.y < -600) return onSwipe("up");
    if (offset.x > 140 || velocity.x > 600) return onSwipe("right");
    if (offset.x < -140 || velocity.x < -600) return onSwipe("left");
  };

  return (
    <motion.div
      className="absolute inset-0 z-20 cursor-grab overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl active:cursor-grabbing"
      style={{ x, y, rotate }}
      drag
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleEnd}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 600 : x.get() < 0 ? -600 : 0,
        y: y.get() < 0 ? -600 : 0,
        opacity: 0,
        transition: { duration: 0.35 },
      }}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className={`relative h-full w-full bg-gradient-to-br ${profile.gradient}`}>
        {/* avatar mark */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="font-serif-display text-[14rem] leading-none text-white/15 select-none">
            {profile.name.slice(0, 1)}
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-sun" />
            匹配度 {profile.match}%
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            {profile.distance}
          </div>
        </div>

        {/* Swipe labels */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-6 top-16 rotate-[-12deg] rounded-xl border-4 border-mint bg-mint/20 px-4 py-2 text-2xl font-extrabold text-mint backdrop-blur"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute right-6 top-16 rotate-[12deg] rounded-xl border-4 border-destructive bg-destructive/20 px-4 py-2 text-2xl font-extrabold text-destructive backdrop-blur"
        >
          NOPE
        </motion.div>
        <motion.div
          style={{ opacity: superOpacity }}
          className="absolute left-1/2 top-10 -translate-x-1/2 rounded-xl border-4 border-sun bg-sun/20 px-4 py-2 text-2xl font-extrabold text-sun backdrop-blur"
        >
          SUPER
        </motion.div>

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-5 pt-16">
          <div className="flex items-baseline gap-2 text-white">
            <h2 className="font-display text-3xl font-semibold tracking-tight">{profile.name}</h2>
            <span className="text-2xl font-light opacity-90">{profile.age}</span>
            <span className="ml-auto text-xs opacity-70">{profile.city}</span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/85">{profile.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.tags.map((t) => (
              <span key={t} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  children, label, onClick, className,
}: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full border shadow-lg transition-transform active:scale-90 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}