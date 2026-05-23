import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, Heart, UserPlus, Star, RotateCcw, Sparkles, Shuffle } from "lucide-react";

export const Route = createFileRoute("/explore/video")({
  head: () => ({ meta: [{ title: "视频聊天 · Pulse" }] }),
  component: VideoChatPage,
});

type Stage = "idle" | "preview" | "matching" | "confirm" | "in_call" | "ended";

const PROPS = [
  { id: "none", name: "原貌", emoji: "🙂" },
  { id: "mask", name: "口罩", emoji: "😷" },
  { id: "panda", name: "熊猫头套", emoji: "🐼" },
  { id: "cat", name: "猫猫头套", emoji: "🐱" },
  { id: "alien", name: "外星人", emoji: "👽" },
  { id: "shades", name: "墨镜", emoji: "🕶️" },
];

const MATCH_POOL = [
  { name: "可乐", age: 23, city: "杭州", avatar: "from-coral to-sun", emoji: "🐱" },
  { name: "雾岛", age: 27, city: "重庆", avatar: "from-mint to-[#38bdf8]", emoji: "🐼" },
  { name: "Nova", age: 25, city: "上海", avatar: "from-sun to-coral", emoji: "👽" },
];

const CALL_SECONDS = 5 * 60;

function VideoChatPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [myProp, setMyProp] = useState(PROPS[2]);
  const [meReady, setMeReady] = useState(false);
  const [taReady, setTaReady] = useState(false);
  const [match, setMatch] = useState(MATCH_POOL[0]);
  const [seconds, setSeconds] = useState(CALL_SECONDS);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [rating, setRating] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const goPreview = () => setStage("preview");
  const startMatch = () => {
    setStage("matching"); setMeReady(false); setTaReady(false);
    window.setTimeout(() => {
      setMatch(MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)]);
      setStage("confirm");
      window.setTimeout(() => setTaReady(true), 1500 + Math.random() * 1500);
    }, 1800);
  };

  useEffect(() => {
    if (stage === "confirm" && meReady && taReady) {
      setStage("in_call");
      setSeconds(CALL_SECONDS);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { if (timerRef.current) window.clearInterval(timerRef.current); setStage("ended"); return 0; }
          return s - 1;
        });
      }, 1000);
    }
  }, [stage, meReady, taReady]);

  const hangUp = () => { if (timerRef.current) window.clearInterval(timerRef.current); setStage("ended"); };
  const reset = () => { setStage("idle"); setMeReady(false); setTaReady(false); setRating(0); setSeconds(CALL_SECONDS); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--sun)_18%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 发现
        </Link>
        <span className="text-xs text-muted-foreground">视频聊天 · 5min</span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-5 pb-20 pt-10">
        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full text-center">
              <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br from-sun to-coral text-background shadow-2xl">
                <Video className="h-14 w-14" />
              </div>
              <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">戴上头套,5 分钟视频</h1>
              <p className="mt-2 text-sm text-muted-foreground">害羞没关系——你可以选择喜欢的虚拟形象先出场。</p>
              <button onClick={goPreview} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-sun to-coral px-7 font-semibold text-background shadow-lg hover:scale-[1.02]">
                <Sparkles className="h-4 w-4" /> 进入视频预览
              </button>
            </motion.div>
          )}

          {stage === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-surface to-background">
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-[160px] leading-none">{myProp.emoji}</div>
                </div>
                <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">预览 · 镜像</div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">当前形象:{myProp.name}</div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-muted-foreground">选择道具</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PROPS.map((p) => (
                    <button key={p.id} onClick={() => setMyProp(p)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs transition ${myProp.id === p.id ? "border-sun bg-sun/10 text-foreground" : "border-border bg-surface/40 text-muted-foreground"}`}>
                      <span className="text-2xl">{p.emoji}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startMatch} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sun to-coral font-semibold text-background">
                <Shuffle className="h-4 w-4" /> 开始匹配
              </button>
            </motion.div>
          )}

          {stage === "matching" && (
            <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full text-center">
              <div className="relative mx-auto h-56 w-56">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-sun/40"
                    animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }} />
                ))}
                <div className="absolute inset-12 grid place-items-center rounded-full bg-surface text-5xl ring-1 ring-border">
                  {myProp.emoji}
                </div>
              </div>
              <p className="mt-8 font-display text-xl">正在寻找对面的头套…</p>
              <button onClick={reset} className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline">取消</button>
            </motion.div>
          )}

          {stage === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
              <div className="grid grid-cols-2 gap-3">
                <PreviewTile label="我" emoji={myProp.emoji} ready={meReady} grad="from-sun/30 to-coral/30" />
                <PreviewTile label="TA" emoji={match.emoji} ready={taReady} grad="from-mint/30 to-[#38bdf8]/30" />
              </div>
              <div className="mt-5 rounded-3xl border border-border bg-surface/70 p-5 text-center">
                <div className="font-display text-xl">{match.name} · {match.age}</div>
                <div className="text-xs text-muted-foreground">{match.city} · 双方都确认后开始</div>
                {!meReady ? (
                  <div className="mt-4 flex gap-2">
                    <button onClick={reset} className="flex-1 rounded-full border border-border py-2.5 text-sm">跳过</button>
                    <button onClick={() => setMeReady(true)} className="flex-1 rounded-full bg-gradient-to-r from-sun to-coral py-2.5 text-sm font-semibold text-background">确认接通</button>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">{taReady ? "正在接通…" : "等待对方确认…"}</p>
                )}
              </div>
            </motion.div>
          )}

          {stage === "in_call" && (
            <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-mint/20 via-background to-[#38bdf8]/20">
                {/* TA video */}
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-[180px] leading-none">{match.emoji}</div>
                </div>
                <div className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">{match.name} · {match.city}</div>
                <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white tabular-nums backdrop-blur">{mm}:{ss}</div>

                {/* My PIP */}
                <div className="absolute bottom-3 right-3 h-32 w-24 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-sun/30 to-coral/30 backdrop-blur">
                  <div className="grid h-full place-items-center text-5xl">{camOff ? "📷" : myProp.emoji}</div>
                  <div className="absolute bottom-1 left-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">我</div>
                </div>
              </div>

              {/* prop switcher */}
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">切换道具</div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {PROPS.map((p) => (
                    <button key={p.id} onClick={() => setMyProp(p)}
                      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-1.5 text-[10px] ${myProp.id === p.id ? "border-sun bg-sun/10 text-foreground" : "border-border bg-surface/40 text-muted-foreground"}`}>
                      <span className="text-xl">{p.emoji}</span>{p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-4">
                <button onClick={() => setMuted(m => !m)} className={`grid h-12 w-12 place-items-center rounded-full border ${muted ? "border-sun/50 bg-sun/10 text-sun" : "border-border bg-background/40 text-muted-foreground"}`}>
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button onClick={hangUp} className="grid h-16 w-16 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-lg active:scale-95">
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button onClick={() => setCamOff(c => !c)} className={`grid h-12 w-12 place-items-center rounded-full border ${camOff ? "border-sun/50 bg-sun/10 text-sun" : "border-border bg-background/40 text-muted-foreground"}`}>
                  {camOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {stage === "ended" && (
            <motion.div key="ended" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="rounded-3xl border border-border bg-surface/70 p-6 text-center backdrop-blur">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-mint/30 to-[#38bdf8]/30 text-4xl">{match.emoji}</div>
                <h2 className="mt-4 font-display text-2xl font-semibold">与 {match.name} 的视频结束</h2>
                <p className="mt-1 text-sm text-muted-foreground">通话时长 {String(Math.floor((CALL_SECONDS - seconds) / 60)).padStart(2, "0")}:{String((CALL_SECONDS - seconds) % 60).padStart(2, "0")}</p>
                <div className="mt-6 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-sun text-sun" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-4 py-2.5 text-sm text-coral">
                    <Heart className="h-4 w-4" /> 关注 TA
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-mint/40 bg-mint/10 px-4 py-2.5 text-sm text-mint">
                    <UserPlus className="h-4 w-4" /> 加为好友
                  </button>
                </div>
                <button onClick={startMatch} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sun to-coral px-4 py-3 text-sm font-semibold text-background">
                  <RotateCcw className="h-4 w-4" /> 重新匹配
                </button>
                <button onClick={reset} className="mt-3 w-full text-xs text-muted-foreground">返回</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function PreviewTile({ label, emoji, ready, grad }: { label: string; emoji: string; ready: boolean; grad: string }) {
  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-3xl border ${ready ? "border-mint" : "border-border"} bg-gradient-to-br ${grad}`}>
      <div className="absolute inset-0 grid place-items-center text-[110px]">{emoji}</div>
      <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">{label}</div>
      <div className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] ${ready ? "bg-mint text-background" : "bg-black/40 text-white"}`}>
        {ready ? "已确认" : "待确认"}
      </div>
    </div>
  );
}