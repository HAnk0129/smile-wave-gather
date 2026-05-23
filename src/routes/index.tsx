import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Sparkles, Zap, Globe2, ArrowRight, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <PhonePreview />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display font-bold text-lg tracking-tight">Pulse</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/games" className="hover:text-foreground transition">游戏</Link>
          <Link to="/radar" className="hover:text-foreground transition">社交雷达</Link>
          <a href="#community" className="hover:text-foreground transition">社区</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 px-4 rounded-full border border-border bg-surface/60 text-sm text-foreground hover:bg-surface transition">登录</button>
          <button className="inline-flex h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">注册</button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="size-8 rounded-xl bg-gradient-to-br from-coral via-sun to-mint flex items-center justify-center glow-coral">
      <Heart className="size-4 text-background fill-background" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute top-20 -left-20 size-[420px] rounded-full bg-coral/30 blur-[120px]" />
      <div className="absolute top-40 right-0 size-[380px] rounded-full bg-mint/25 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] max-w-5xl">
            遇见<span className="font-serif-display italic text-gradient-hero">同频</span>的人，<br />
            从一次<span className="text-coral">心跳</span>开始。
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Pulse 是为 Z 世代打造的综合社交平台。滑卡匹配、动态广场、实时聊天——
            在这里，每一次相遇都不是巧合。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link to="/discover" className="group inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-semibold glow-coral hover:scale-[1.02] active:scale-[0.98] transition">
              免费开始匹配
              <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["coral", "sun", "mint", "coral"].map((c, i) => (
                <div
                  key={i}
                  className="size-8 rounded-full border-2 border-background"
                  style={{ background: `linear-gradient(135deg, var(--${c}), var(--${["sun","mint","coral","sun"][i]}))` }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-foreground">
              <Star className="size-3.5 fill-sun text-sun" />
              <Star className="size-3.5 fill-sun text-sun" />
              <Star className="size-3.5 fill-sun text-sun" />
              <Star className="size-3.5 fill-sun text-sun" />
              <Star className="size-3.5 fill-sun text-sun" />
            </div>
            <span>4.9 · 来自 12,580 条真实评价</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const tags = [
    "📷 摄影爱好者", "🎵 独立音乐", "☕ 周末咖啡馆", "🏃 跑步搭子",
    "🎮 双人游戏", "📚 共读一本书", "🌃 City Walk", "🍜 探店饭搭",
    "🎬 一起看电影", "🧗 户外攀岩", "✈️ 旅行同行", "🎨 看展览",
  ];
  return (
    <section className="relative border-y border-border bg-surface/40 py-6 overflow-hidden">
      <div className="flex gap-3 w-max animate-marquee">
        {[...tags, ...tags].map((t, i) => (
          <span key={i} className="shrink-0 rounded-full border border-border bg-background/60 px-4 py-2 text-sm whitespace-nowrap">
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Zap,
      color: "coral",
      title: "AI 同频匹配",
      desc: "根据兴趣、生活方式与表达风格，每天为你挑选 10 个最有可能擦出火花的人。",
    },
    {
      icon: MessageCircle,
      color: "mint",
      title: "聊得来才重要",
      desc: "破冰话题卡 + 即时聊天，再也不用纠结开场白。语音、表情、贴纸一应俱全。",
    },
    {
      icon: Globe2,
      color: "sun",
      title: "动态广场",
      desc: "分享此刻的心情，加入兴趣圈子，从一条动态认识真实的彼此。",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.2em] text-coral font-semibold">为什么是 Pulse</span>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">
          不只是配对，<br />
          是 <span className="font-serif-display italic text-mint">真正的连接</span>。
        </h2>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div
            key={i}
            className="group relative rounded-3xl border border-border bg-surface/60 backdrop-blur p-7 hover:bg-surface transition overflow-hidden"
          >
            <div
              className="absolute -top-12 -right-12 size-40 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition"
              style={{ background: `var(--${it.color})` }}
            />
            <div
              className="relative size-12 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: `color-mix(in oklab, var(--${it.color}) 20%, transparent)` }}
            >
              <it.icon className="size-5" style={{ color: `var(--${it.color})` }} />
            </div>
            <h3 className="relative text-xl font-bold mb-2">{it.title}</h3>
            <p className="relative text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PhonePreview() {
  return (
    <section id="preview" className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-mint font-semibold">应用预览</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">
            一次<span className="text-coral">右滑</span>，<br />
            可能就是一辈子。
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
            清晰的资料卡片，沉浸式的滑动体验。看到喜欢的人，向右滑；当对方也喜欢你，立即开启专属聊天。
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { c: "coral", t: "实名认证 + 真人头像审核，告别假号" },
              { c: "sun", t: "兴趣标签精准筛选，告别尬聊" },
              { c: "mint", t: "本地 + 全国双模式，灵活选择" },
            ].map((x, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 size-5 rounded-full flex items-center justify-center" style={{ background: `var(--${x.c})` }}>
                  <svg className="size-3 text-background" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" /></svg>
                </div>
                <span className="text-sm md:text-base">{x.t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-coral/20 via-transparent to-mint/20 blur-3xl" />
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative animate-float">
      <div className="w-[320px] h-[640px] rounded-[44px] bg-surface-2 border border-border p-3 shadow-2xl">
        <div className="relative w-full h-full rounded-[34px] bg-gradient-to-b from-background to-surface overflow-hidden">
          {/* notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-background/80 z-20" />

          <div className="p-5 pt-10 h-full flex flex-col">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-display font-bold text-sm text-foreground">发现</span>
              <span>今日 8/10</span>
            </div>

            {/* Profile card */}
            <div className="mt-4 flex-1 rounded-3xl relative overflow-hidden" style={{ background: "linear-gradient(160deg, oklch(0.72 0.18 22), oklch(0.5 0.15 350))" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* abstract pattern */}
              <div className="absolute top-6 right-6 size-20 rounded-full bg-sun/40 blur-2xl" />
              <div className="absolute bottom-32 left-4 size-24 rounded-full bg-mint/30 blur-2xl" />

              <div className="relative h-full flex flex-col justify-end p-4 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded-full bg-mint/90 text-background text-[10px] font-bold px-2 py-0.5">在线</span>
                  <span className="text-[10px] opacity-80">距你 1.2km</span>
                </div>
                <h3 className="font-display text-2xl font-bold">林夕, 24</h3>
                <p className="text-xs opacity-90 mt-1">咖啡、独立电影、晚风、City Walk</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["📷 摄影", "🎵 民谣", "☕ 咖啡"].map((t) => (
                    <span key={t} className="text-[10px] rounded-full bg-white/15 backdrop-blur px-2 py-1 border border-white/20">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button className="size-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground">
                ✕
              </button>
              <button className="size-16 rounded-full bg-gradient-to-br from-coral to-sun flex items-center justify-center glow-coral">
                <Heart className="size-7 text-background fill-background" />
              </button>
              <button className="size-12 rounded-full bg-surface border border-border flex items-center justify-center text-mint">
                <Sparkles className="size-5" />
              </button>
            </div>

            {/* bottom nav */}
            <div className="mt-4 flex items-center justify-around text-[10px] text-muted-foreground">
              <span className="text-coral font-semibold">发现</span>
              <span>动态</span>
              <span>消息</span>
              <span>我的</span>
            </div>
          </div>
        </div>
      </div>

      {/* floating chat bubble */}
      <div className="absolute -left-12 top-32 hidden md:flex items-center gap-2 rounded-2xl bg-surface border border-border px-4 py-3 shadow-xl animate-float" style={{ animationDelay: "1.5s" }}>
        <div className="size-8 rounded-full bg-gradient-to-br from-mint to-sun" />
        <div className="text-xs">
          <div className="font-semibold">小野 发来消息</div>
          <div className="text-muted-foreground">周末一起去看展吗？🎨</div>
        </div>
      </div>

      {/* match toast */}
      <div className="absolute -right-6 top-16 hidden md:flex items-center gap-2 rounded-full bg-coral text-primary-foreground px-4 py-2 shadow-xl glow-coral animate-float" style={{ animationDelay: "0.8s" }}>
        <Heart className="size-4 fill-current" />
        <span className="text-sm font-bold">新的心动!</span>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { n: "120万+", l: "活跃用户", c: "coral" },
    { n: "8500万", l: "成功配对", c: "sun" },
    { n: "32万", l: "情侣诞生", c: "mint" },
    { n: "98%", l: "次日留存", c: "coral" },
  ];
  return (
    <section id="community" className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-3xl border border-border bg-surface/60 backdrop-blur p-10 md:p-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-display text-4xl md:text-5xl font-bold" style={{ color: `var(--${s.c})` }}>{s.n}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-[40px] p-12 md:p-20 text-center"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 22), oklch(0.55 0.2 350) 60%, oklch(0.4 0.15 270))" }}>
        <div className="absolute -top-20 -left-20 size-80 rounded-full bg-sun/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-mint/30 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white">
            今晚，<span className="font-serif-display italic">就开始</span>。
          </h2>
          <p className="mt-4 text-white/80 max-w-md mx-auto">下载 Pulse，让下一个让你心跳加速的人，离你只有一次右滑的距离。</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button className="h-12 px-7 rounded-full bg-background text-foreground font-semibold hover:scale-[1.02] transition">立即下载 iOS</button>
            <button className="h-12 px-7 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition">Android 版本</button>
          </div>
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
          <Logo />
          <span className="font-display font-bold text-foreground">Pulse</span>
          <span>· 遇见同频的人</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground transition">隐私</a>
          <a href="#" className="hover:text-foreground transition">条款</a>
          <a href="#" className="hover:text-foreground transition">联系</a>
        </div>
      </div>
    </footer>
  );
}
