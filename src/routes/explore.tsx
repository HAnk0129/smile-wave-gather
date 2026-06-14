import { createFileRoute, Outlet, useLocation, Link } from "@tanstack/react-router";
import { Phone, Video, Moon, ArrowLeft, Flame, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "发现 · Pulse" },
      { name: "description", content: "选择一种方式，认识有趣的人。" },
    ],
  }),
  component: ExploreLayout,
});

const MODULES = [
  {
    href: "/games" as const,
    title: "小游戏",
    desc: "测测你的隐藏人格",
    icon: Gamepad2,
    grad: "from-coral/30 via-sun/10 to-transparent",
    accent: "text-coral",
  },
  {
    href: "/explore/voice" as const,
    title: "语音通话",
    desc: "随机匹配同频的人",
    icon: Phone,
    grad: "from-mint/30 via-mint/10 to-transparent",
    accent: "text-mint",
  },
  {
    href: "/explore/video" as const,
    title: "视频通话",
    desc: "面对面快速破冰",
    icon: Video,
    grad: "from-sun/30 via-sun/10 to-transparent",
    accent: "text-sun",
  },
  {
    href: "/explore/treehole" as const,
    title: "匿名树洞",
    desc: "匿名表达真实想法",
    icon: Moon,
    grad: "from-[#a78bfa]/30 via-[#a78bfa]/10 to-transparent",
    accent: "text-[#c4b5fd]",
  },
];

function ExploreLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/explore") return <Outlet />;

  return (
    <div className="min-h-screen bg-white text-[#331915]">
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF8A00] text-[#331915]">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[#331915]">Pulse</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1 rounded-full bg-[#FF8A00] px-3 py-1.5 text-xs text-[#331915]">
          <ArrowLeft className="h-3.5 w-3.5" /> 首页
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#331915] md:text-5xl">发现</h1>
        <p className="mt-3 max-w-xl text-[#331915]">选择一种方式，认识有趣的人</p>

        <div className="mt-10 grid grid-cols-2 gap-4">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={m.href}
                className="group relative block aspect-square overflow-hidden rounded-3xl p-5 transition"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at center, #FF8A00 0%, #FF8A00 55%, #FFFFFF 100%)",
                  backgroundColor: "#FF8A00",
                }}
              >
                <div className="relative flex items-start justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/30 text-[#331915]">
                    <m.icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs text-[#331915] opacity-0 transition group-hover:opacity-100">进入 →</span>
                </div>
                <div className="relative mt-auto pt-8">
                  <div className="font-display text-xl font-semibold tracking-tight text-[#331915]">{m.title}</div>
                  <p className="mt-1 text-xs text-[#331915]">{m.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-[#331915]">
          尊重彼此，友好交流，共同维护安全社区
        </p>
      </main>
      <BottomNav active="explore" />
    </div>
  );
}