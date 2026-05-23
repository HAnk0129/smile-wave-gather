import { createFileRoute, Outlet, useLocation, Link } from "@tanstack/react-router";
import { Radar, Mic, Video, Trees, ArrowLeft, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "发现 · Pulse" },
      { name: "description", content: "社交雷达、语音、视频、匿名树洞——在 Pulse 发现更多可能。" },
    ],
  }),
  component: ExploreLayout,
});

const MODULES = [
  {
    href: "/radar" as const,
    title: "社交雷达",
    desc: "扫描附近，遇见同频的人",
    icon: Radar,
    grad: "from-mint/30 via-mint/10 to-transparent",
    accent: "text-mint",
    tags: ["附近", "扫描", "在线"],
  },
  {
    href: "/explore/voice" as const,
    title: "语音聊天",
    desc: "10 分钟随机连线,只用声音认识彼此",
    icon: Mic,
    grad: "from-coral/30 via-coral/10 to-transparent",
    accent: "text-coral",
    tags: ["随机", "10min", "匿名"],
  },
  {
    href: "/explore/video" as const,
    title: "视频聊天",
    desc: "不用露脸,5 分钟轻松视频",
    icon: Video,
    grad: "from-sun/30 via-sun/10 to-transparent",
    accent: "text-sun",
    tags: ["道具", "5min", "趣味"],
  },
  {
    href: "/explore/treehole" as const,
    title: "匿名树洞",
    desc: "说出口的秘密,总会被人接住",
    icon: Trees,
    grad: "from-[#a78bfa]/30 via-[#a78bfa]/10 to-transparent",
    accent: "text-[#c4b5fd]",
    tags: ["匿名", "倾诉", "共鸣"],
  },
];

function ExploreLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/explore") return <Outlet />;

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--coral)_22%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-coral to-sun text-background">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Pulse</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> 首页
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-24 pt-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          发现 <span className="text-gradient-hero font-serif-display italic">同频</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          四种方式打破社恐——附近的人、随机的声音、藏在头像后的视频,或者一个只属于陌生人的树洞。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={m.href}
                className="group relative block overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur transition hover:border-foreground/30"
              >
                <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${m.grad} blur-2xl`} />
                <div className="relative flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-surface ${m.accent} ring-1 ring-border`}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">进入 →</span>
                </div>
                <div className="relative mt-5">
                  <div className="font-display text-2xl font-semibold tracking-tight">{m.title}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{m.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}