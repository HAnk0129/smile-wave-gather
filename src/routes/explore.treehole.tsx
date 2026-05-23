import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trees, Send, MessageCircle, Heart, Sparkles, X, Lock, Unlock } from "lucide-react";

export const Route = createFileRoute("/explore/treehole")({
  head: () => ({ meta: [{ title: "匿名树洞 · Pulse" }] }),
  component: TreeholePage,
});

type Post = {
  id: string;
  alias: string;
  emoji: string;
  time: string;
  mood: string;
  text: string;
  resonate: number;
  hugs: number;
  comments: { alias: string; emoji: string; text: string }[];
  resonated?: boolean;
  hugged?: boolean;
};

const SEED: Post[] = [
  {
    id: "p1", alias: "夜里的鲸", emoji: "🐳", time: "3 分钟前", mood: "孤独",
    text: "今天又一个人吃了火锅,服务员把小熊放在对面的位置上。我笑了出来,然后突然有点想哭。",
    resonate: 124, hugs: 88,
    comments: [
      { alias: "晚风的猫", emoji: "🐱", text: "小熊知道你今天辛苦了。" },
      { alias: "灯泡先生", emoji: "💡", text: "下次叫我,我也常一个人吃。" },
    ],
  },
  {
    id: "p2", alias: "失眠树懒", emoji: "🦥", time: "12 分钟前", mood: "焦虑",
    text: "面试挂了第 7 次。简历像石头一样砸进 HR 邮箱,然后再也没有回声。",
    resonate: 312, hugs: 201,
    comments: [
      { alias: "深夜面包", emoji: "🍞", text: "我也是。我们一起再投一次。" },
    ],
  },
  {
    id: "p3", alias: "薄荷糖", emoji: "🍬", time: "32 分钟前", mood: "暗恋",
    text: "他今天对我笑了一下,我循环了一整天。可能这就是我整周的全部能量来源了。",
    resonate: 487, hugs: 156,
    comments: [],
  },
  {
    id: "p4", alias: "云朵观察员", emoji: "☁️", time: "1 小时前", mood: "治愈",
    text: "今天发现公司楼下开了一家新的咖啡馆,老板是只胖橘猫。世界对我温柔了一秒。",
    resonate: 622, hugs: 88,
    comments: [],
  },
];

const MOODS = ["全部", "孤独", "焦虑", "暗恋", "治愈", "深夜"];

function TreeholePage() {
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [filter, setFilter] = useState("全部");
  const [composing, setComposing] = useState(false);
  const [draftMood, setDraftMood] = useState("孤独");
  const [draftText, setDraftText] = useState("");
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [chatWith, setChatWith] = useState<Post | null>(null);
  const [chatStage, setChatStage] = useState<"requested" | "accepted" | "revealed">("requested");

  const list = useMemo(
    () => (filter === "全部" ? posts : posts.filter((p) => p.mood === filter)),
    [posts, filter],
  );

  const toggle = (id: string, key: "resonated" | "hugged") => {
    setPosts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const on = !p[key];
      const field = key === "resonated" ? "resonate" : "hugs";
      return { ...p, [key]: on, [field]: p[field] + (on ? 1 : -1) } as Post;
    }));
  };

  const publish = () => {
    if (!draftText.trim()) return;
    const aliases = [
      { a: "迷路的星星", e: "⭐" }, { a: "雨天的伞", e: "☂️" },
      { a: "走神兔", e: "🐰" }, { a: "微醺月亮", e: "🌙" },
    ];
    const pick = aliases[Math.floor(Math.random() * aliases.length)];
    const newPost: Post = {
      id: "p" + Date.now(), alias: pick.a, emoji: pick.e, time: "刚刚",
      mood: draftMood, text: draftText.trim(), resonate: 0, hugs: 0, comments: [],
    };
    setPosts((ps) => [newPost, ...ps]);
    setDraftText(""); setComposing(false);
  };

  const startChat = (p: Post) => {
    setActivePost(null);
    setChatWith(p);
    setChatStage("requested");
    window.setTimeout(() => setChatStage("accepted"), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,#a78bfa_18%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-6">
        <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 发现
        </Link>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Trees className="h-3.5 w-3.5" /> 匿名树洞
        </span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-32 pt-8">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">说出口的秘密<br />总会被人接住</h1>
          <p className="mt-3 text-sm text-muted-foreground">所有人都是匿名身份,直到你们决定揭晓彼此。</p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {MOODS.map((m) => (
            <button key={m} onClick={() => setFilter(m)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition ${filter === m ? "border-foreground bg-foreground text-background" : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {list.map((p) => (
            <motion.article key={p.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-surface/60 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-background text-xl ring-1 ring-border">{p.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.alias}</div>
                  <div className="text-[11px] text-muted-foreground">{p.time} · #{p.mood}</div>
                </div>
                <span className="rounded-full bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">匿名</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{p.text}</p>

              <div className="mt-4 flex items-center gap-1 text-xs">
                <button onClick={() => toggle(p.id, "resonated")}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${p.resonated ? "border-[#c4b5fd]/40 bg-[#a78bfa]/15 text-[#c4b5fd]" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                  <Sparkles className="h-3.5 w-3.5" /> 共鸣 {p.resonate}
                </button>
                <button onClick={() => toggle(p.id, "hugged")}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${p.hugged ? "border-coral/40 bg-coral/15 text-coral" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                  <Heart className={`h-3.5 w-3.5 ${p.hugged ? "fill-current" : ""}`} /> 抱抱 {p.hugs}
                </button>
                <button onClick={() => setActivePost(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-3 py-1.5 text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-3.5 w-3.5" /> 评论 {p.comments.length}
                </button>
                <div className="flex-1" />
                <button onClick={() => startChat(p)} className="rounded-full bg-gradient-to-r from-[#a78bfa] to-coral px-3 py-1.5 text-[11px] font-semibold text-background">
                  匿名聊聊
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </main>

      {/* Floating compose */}
      <button onClick={() => setComposing(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#a78bfa] to-coral px-5 py-3.5 text-sm font-semibold text-background shadow-2xl">
        <Trees className="h-4 w-4" /> 发布树洞
      </button>

      {/* Compose sheet */}
      <AnimatePresence>
        {composing && (
          <Sheet onClose={() => setComposing(false)} title="把心事丢进树洞">
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MOODS.filter(m => m !== "全部").map(m => (
                <button key={m} onClick={() => setDraftMood(m)}
                  className={`rounded-full border px-3 py-1 text-xs ${draftMood === m ? "border-[#c4b5fd] bg-[#a78bfa]/20 text-[#c4b5fd]" : "border-border bg-background/40 text-muted-foreground"}`}>
                  #{m}
                </button>
              ))}
            </div>
            <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} maxLength={500}
              placeholder="树洞里的话不会被你的好友看到,只会飘到陌生人的耳边…"
              className="mt-3 h-40 w-full resize-none rounded-2xl border border-border bg-background/40 p-4 text-sm outline-none focus:border-foreground/40" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{draftText.length}/500 · 匿名发布</span>
            </div>
            <button onClick={publish} disabled={!draftText.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a78bfa] to-coral py-3 text-sm font-semibold text-background disabled:opacity-50">
              <Send className="h-4 w-4" /> 让它飘出去
            </button>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Post detail / comments */}
      <AnimatePresence>
        {activePost && (
          <Sheet onClose={() => setActivePost(null)} title={`${activePost.alias} 的树洞`}>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{activePost.text}</p>
            <div className="mt-5 space-y-3">
              {activePost.comments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">还没有人评论,来当第一个接住 TA 的人。</p>
              )}
              {activePost.comments.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background text-base ring-1 ring-border">{c.emoji}</div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.alias}</div>
                    <div className="text-sm">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => startChat(activePost)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a78bfa] to-coral py-3 text-sm font-semibold text-background">
              <Lock className="h-4 w-4" /> 发起匿名聊天
            </button>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Chat overlay */}
      <AnimatePresence>
        {chatWith && (
          <Sheet onClose={() => setChatWith(null)} title="匿名聊天">
            <AnonymousChat post={chatWith} stage={chatStage} setStage={setChatStage} />
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-background p-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </>
  );
}

function AnonymousChat({ post, stage, setStage }: { post: Post; stage: "requested" | "accepted" | "revealed"; setStage: (s: "requested" | "accepted" | "revealed") => void }) {
  const [meAgree, setMeAgree] = useState(false);
  const [taAgree, setTaAgree] = useState(false);
  const [messages, setMessages] = useState<{ from: "me" | "ta"; text: string }[]>([
    { from: "ta", text: "嗨,谢谢你愿意来听我说话…" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: "me", text: input.trim() }]);
    setInput("");
    window.setTimeout(() => {
      const replies = ["嗯,我懂这种感觉。", "其实你不是一个人。", "今天的你已经很厉害了。"];
      setMessages((m) => [...m, { from: "ta", text: replies[Math.floor(Math.random() * replies.length)] }]);
    }, 1200);
  };

  const tryReveal = () => {
    setMeAgree(true);
    window.setTimeout(() => { setTaAgree(true); setStage("revealed"); }, 1500);
  };

  if (stage === "requested") {
    return (
      <div className="mt-4 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-background text-2xl ring-1 ring-border">{post.emoji}</div>
        <p className="mt-3 text-sm text-muted-foreground">已向 <b className="text-foreground">{post.alias}</b> 发送聊天邀请…</p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <motion.span className="h-2 w-2 rounded-full bg-coral" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
          等待对方接受
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface/60 px-3 py-2 text-xs">
        <Lock className="h-3.5 w-3.5 text-[#c4b5fd]" />
        <span className="text-muted-foreground">
          你正在与 <b className={stage === "revealed" ? "text-foreground" : ""}>{stage === "revealed" ? "苏雨桐" : post.alias}</b> 匿名聊天
        </span>
      </div>

      <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-2xl bg-surface/30 p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-coral text-background" : "bg-background border border-border"}`}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="说点什么…" className="flex-1 rounded-full border border-border bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-foreground/40" />
        <button onClick={send} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-[#a78bfa] to-coral text-background">
          <Send className="h-4 w-4" />
        </button>
      </div>

      {stage !== "revealed" ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/40 p-4 text-center text-xs">
          <div className="font-medium text-foreground">聊得来?可以解锁真实身份</div>
          <p className="mt-1 text-muted-foreground">双方都同意后,匿名聊天将转为正常聊天,昵称与头像会公开。</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded-xl border px-3 py-2 ${meAgree ? "border-mint/50 bg-mint/10 text-mint" : "border-border text-muted-foreground"}`}>我 {meAgree ? "同意" : "未同意"}</div>
            <div className={`rounded-xl border px-3 py-2 ${taAgree ? "border-mint/50 bg-mint/10 text-mint" : "border-border text-muted-foreground"}`}>TA {taAgree ? "同意" : "等待中"}</div>
          </div>
          <button onClick={tryReveal} disabled={meAgree}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-60">
            <Unlock className="h-4 w-4" /> {meAgree ? "已请求公开" : "我同意公开身份"}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-mint/40 bg-mint/10 p-4 text-center text-xs text-mint">
          🎉 双方已公开身份,这段对话已转为正常聊天。
        </div>
      )}
    </div>
  );
}