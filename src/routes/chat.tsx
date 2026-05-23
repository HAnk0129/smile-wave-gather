import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Smile, ImageIcon, Mic, Phone, Video, Sparkles, Heart, MoreHorizontal } from "lucide-react";

type ChatSearch = {
  name?: string;
  avatar?: string;
  from?: "voice" | "video" | "match" | "radar";
  age?: number;
  city?: string;
};

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "聊天 · Pulse" }] }),
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    name: typeof s.name === "string" ? s.name : undefined,
    avatar: typeof s.avatar === "string" ? s.avatar : undefined,
    from: (["voice", "video", "match", "radar"] as const).includes(s.from as never)
      ? (s.from as ChatSearch["from"])
      : undefined,
    age: typeof s.age === "number" ? s.age : s.age ? Number(s.age) : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
  }),
  component: ChatPage,
});

type Msg = {
  id: string;
  from: "me" | "ta" | "system";
  text?: string;
  kind?: "text" | "sticker" | "card";
  time: string;
};

const QUICK_REPLIES = ["哈哈刚刚太好笑了", "周末有空吗？", "你那边在下雨吗", "给我看看你家猫🐱", "下次再聊"];

const SOURCE_LABEL: Record<NonNullable<ChatSearch["from"]>, string> = {
  voice: "你们在 10 分钟语音里聊得很投缘",
  video: "你们在 5 分钟视频里彼此心动",
  match: "你们互相喜欢，成功匹配",
  radar: "你们在社交雷达上相遇",
};

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ChatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const name = search.name || "晚风";
  const avatar = search.avatar || "from-coral to-sun";
  const city = search.city || "上海";
  const from: NonNullable<ChatSearch["from"]> = search.from ?? "match";

  const opener = useMemo<Msg[]>(() => {
    const base: Msg[] = [
      { id: "sys-1", from: "system", text: SOURCE_LABEL[from], time: now() },
    ];
    if (from === "voice") {
      base.push({ id: "ta-1", from: "ta", text: `刚刚的声音真的很好听～`, time: now() });
      base.push({ id: "ta-2", from: "ta", text: "下次想约你视频，或者直接出来喝杯咖啡？☕️", time: now() });
    } else if (from === "video") {
      base.push({ id: "ta-1", from: "ta", text: "嘿嘿摘掉道具的样子也想见见 👀", time: now() });
    } else if (from === "match") {
      base.push({ id: "ta-1", from: "ta", text: `Hi ${name === "我" ? "你" : ""}～我们匹配啦 ✨`, time: now() });
      base.push({ id: "ta-2", from: "ta", text: "你的主页里那张照片是哪里拍的呀？", time: now() });
    } else {
      base.push({ id: "ta-1", from: "ta", text: "你也在附近呀，缘分耶 😄", time: now() });
    }
    return base;
  }, [from, name]);

  const [messages, setMessages] = useState<Msg[]>(opener);
  const [input, setInput] = useState("");
  const [taTyping, setTaTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, taTyping]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: `me-${Date.now()}`, from: "me", text: t, time: now() }]);
    setInput("");
    setTaTyping(true);
    const replies = [
      "哈哈哈对的就是这种感觉",
      "那你这周末有空吗？",
      "你说话好可爱 🥺",
      "好呀好呀，听你的安排！",
      "这就给你发一张～📷",
    ];
    const delay = 900 + Math.random() * 1200;
    window.setTimeout(() => {
      setTaTyping(false);
      setMessages((m) => [
        ...m,
        { id: `ta-${Date.now()}`, from: "ta", text: replies[Math.floor(Math.random() * replies.length)], time: now() },
      ]);
    }, delay);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => navigate({ to: "/" })} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${avatar} font-display text-base text-background`}>
            {name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-display text-base font-semibold">
              {name}
              <span className="grid h-4 w-4 place-items-center rounded-full bg-mint/20 text-mint"><Sparkles className="h-2.5 w-2.5" /></span>
            </div>
            <div className="text-[11px] text-muted-foreground">{city} · 在线</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><Phone className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><Video className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
      </header>

      {/* match banner */}
      {(from === "match" || from === "voice" || from === "video") && (
        <div className="mx-auto w-full max-w-md px-4 pt-3">
          <div className="overflow-hidden rounded-2xl border border-coral/30 bg-gradient-to-r from-coral/15 via-sun/10 to-mint/15 p-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-coral/20 text-coral"><Heart className="h-3.5 w-3.5 fill-current" /></div>
              <div className="flex-1">
                <div className="font-display text-sm font-semibold">
                  {from === "match" ? "你们互相喜欢" : from === "voice" ? "想继续聊聊" : "彼此心动"} · 现在可以发消息啦
                </div>
                <div className="text-[11px] text-muted-foreground">前 3 条消息免费 · 互相回复后可解锁更多互动</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* messages */}
      <div ref={scrollerRef} className="mx-auto w-full max-w-md flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.from === "system" ? "flex justify-center" : m.from === "me" ? "flex justify-end" : "flex items-end gap-2"}
            >
              {m.from === "system" ? (
                <div className="rounded-full bg-surface/70 px-3 py-1 text-[11px] text-muted-foreground">{m.text}</div>
              ) : m.from === "ta" ? (
                <>
                  <div className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${avatar} text-[11px] text-background`}>
                    {name.slice(0, 1)}
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-border bg-surface/80 px-3.5 py-2 text-sm">
                    {m.text}
                    <div className="mt-1 text-right text-[10px] text-muted-foreground">{m.time}</div>
                  </div>
                </>
              ) : (
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-gradient-to-br from-coral to-sun px-3.5 py-2 text-sm text-background shadow-md">
                  {m.text}
                  <div className="mt-1 text-right text-[10px] text-background/70">{m.time}</div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {taTyping && (
          <div className="flex items-end gap-2">
            <div className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${avatar} text-[11px] text-background`}>
              {name.slice(0, 1)}
            </div>
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface/80 px-3.5 py-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* quick replies */}
      <div className="mx-auto w-full max-w-md overflow-x-auto px-4 pb-2">
        <div className="flex gap-2">
          {QUICK_REPLIES.map((q) => (
            <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* input */}
      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><Smile className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><ImageIcon className="h-4 w-4" /></button>
          <div className="flex flex-1 items-center rounded-full border border-border bg-surface/70 px-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder="说点什么..."
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button className="text-muted-foreground"><Mic className="h-4 w-4" /></button>
          </div>
          <button onClick={() => send(input)} disabled={!input.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-coral to-sun text-background shadow-lg disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { Link as _Link };