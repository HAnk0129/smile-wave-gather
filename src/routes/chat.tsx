import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Smile, ImageIcon, Mic, Phone, Video, Sparkles, Heart, MoreHorizontal, Check, CheckCheck, Trash2, Loader2, Gift as GiftIcon, Coins } from "lucide-react";
import { getConversation, sendMessage as sendMessageFn, markConversationRead, sendImageMessage, deleteConversation } from "@/lib/chat.functions";
import { blockUser, reportContent } from "@/lib/moderation.functions";
import { sendGift, getMyWallet } from "@/lib/wallet.functions";
import { GIFT_CATALOG } from "@/lib/wallet";
import { track, Events } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type ChatSearch = {
  conv?: string;
  name?: string;
  avatar?: string;
  from?: "voice" | "video" | "match" | "radar";
  age?: number;
  city?: string;
};

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "聊天 · Pulse" }] }),
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    conv: typeof s.conv === "string" ? s.conv : undefined,
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

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

const EMOJI_PACKS: { key: string; label: string; emojis: string[] }[] = [
  { key: "smile", label: "表情", emojis: ["😄","😂","🥹","🥰","😘","😍","🤩","😎","🤔","😴","😭","🥺","😳","😅","🙃","😇","🤗","🤤","😋","🤭","🙄","😏","😬","😤","🥳","🤯","😮","😱","🥶","🥵","😜","🤪","😈","🤡","🥱","😪","🤐","😶","🫠","🫡","🫢","🫣","🤫","🤥","😷","🤧"] },
  { key: "heart", label: "心情", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💖","💕","💞","💓","💗","💘","💝","💔","❣️","💋","🌹","🌷","🌸","🌺","🌻","💐","✨","💫","⭐️","🌟","🔥","💥","🌈"] },
  { key: "hand", label: "手势", emojis: ["👍","👎","👏","🙌","🙏","🤝","👀","💪","🫶","🤟","✌️","🤘","👌","🤌","🤏","👋","🤚","🖐️","✋","🖖","🤙","👆","👇","👉","👈","☝️","🫵","🫰","🙆","🙅","💁","🙋","🙇","🤷","🤦"] },
  { key: "life", label: "生活", emojis: ["☕️","🍻","🍺","🍷","🥂","🍰","🧁","🍔","🍕","🍣","🍜","🍱","🍙","🍑","🍓","🍉","🍇","🍊","🍎","🥑","🍪","🍫","🍩","🎉","🎁","🎈","🎂","🎵","🎶","💃","🕺","🏝️","🌴","✈️","🚗","🚕","📷","📱","💻","🎮","⚽️","🏀","🎯","🎨","🎬","📚"] },
];

const STICKER_PACK: string[] = [
  "🥰💕","😂👍","🤣🤣","😭💔","😍😍","🥺👉👈","✨🎉","🔥🔥","🙏🙏","💯💯",
  "🌹💝","☕️🥐","🎁🎈","🥳🎉","😘💋","🤗💖","💪😤","🙄🙄","😴💤","☀️🌈",
];

function isEmojiOnly(s: string): boolean {
  if (!s || s.length > 24) return false;
  try {
    return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\uFE0F|\u200D|\s)+$/u.test(s);
  } catch {
    return false;
  }
}

function ChatPage() {
  const search = Route.useSearch();
  if (search.conv) return <RealChat convId={search.conv} fallbackName={search.name} from={search.from} />;
  return <MockChat />;
}

function MockChat() {
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

function GiftButton({
  convId,
  partnerId,
  partnerName,
}: {
  convId: string;
  partnerId: string | null;
  partnerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const send = useServerFn(sendGift);
  const wallet = useServerFn(getMyWallet);
  const w = useQuery({ queryKey: ["wallet"], queryFn: () => wallet(), enabled: open });
  const coins = w.data?.coins ?? 0;

  const navigate = useNavigate();
  const handleSend = async () => {
    if (!partnerId || !picked) return;
    const gift = GIFT_CATALOG.find((g) => g.code === picked);
    if (!gift) return;
    setSending(true);
    try {
      await send({ data: { receiverId: partnerId, giftCode: picked, message: msg, conversationId: convId } });
      toast.success(`已送出 ${gift.emoji} ${gift.name}`);
      setOpen(false);
      setPicked(null);
      setMsg("");
    } catch (e: any) {
      const m = e?.message ?? "送礼失败";
      if (m.includes("不足")) {
        toast.error("心动币不足，去钱包充值吧");
      } else {
        toast.error(m);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!partnerId}
          aria-label="送礼物"
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-coral hover:bg-surface disabled:opacity-50"
        >
          <GiftIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-[320px] p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">给 {partnerName} 送礼</span>
          <span className="inline-flex items-center gap-1 text-coral">
            <Coins className="h-3 w-3" /> {coins}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {GIFT_CATALOG.map((g) => {
            const active = picked === g.code;
            return (
              <button
                key={g.code}
                onClick={() => setPicked(g.code)}
                className={`rounded-xl border p-2 text-center transition ${active ? "border-coral bg-coral/10" : "border-border hover:border-coral/50"}`}
              >
                <div className="text-2xl">{g.emoji}</div>
                <div className="text-[10px] mt-0.5 truncate">{g.name}</div>
                <div className="text-[10px] text-coral">{g.coins}</div>
              </button>
            );
          })}
        </div>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="附一句话（可选）"
          maxLength={50}
          className="mt-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => navigate({ to: "/wallet" })}
            className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted-foreground hover:bg-surface"
          >
            去充值
          </button>
          <button
            onClick={handleSend}
            disabled={!picked || sending || !partnerId}
            className="flex-1 rounded-lg bg-gradient-to-r from-coral to-sun py-1.5 text-xs font-semibold text-background disabled:opacity-50"
          >
            {sending ? "送出中…" : "送出"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RealChat({
  convId, fallbackName, from,
}: { convId: string; fallbackName?: string; from?: ChatSearch["from"] }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchConv = useServerFn(getConversation);
  const sendFn = useServerFn(sendMessageFn);
  const markReadFn = useServerFn(markConversationRead);
  const blockFn = useServerFn(blockUser);
  const reportFn = useServerFn(reportContent);
  const sendImageFn = useServerFn(sendImageMessage);
  const deleteConvFn = useServerFn(deleteConversation);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<"spam" | "harassment" | "nudity" | "hate" | "scam" | "other">("harassment");
  const [reportDetail, setReportDetail] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const queryKey = ["conversation", convId] as const;
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchConv({ data: { id: convId } }),
    refetchOnWindowFocus: false,
  });

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // realtime: append new messages for this conversation
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as { id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
          // image messages need attachment lookup + signed URL — refetch instead of cache patching
          if (m.content === "[图片]") {
            qc.invalidateQueries({ queryKey });
          } else {
            qc.setQueryData(queryKey, (prev: any) => {
              if (!prev) return prev;
              if (prev.messages.some((x: any) => x.id === m.id)) return prev;
              return {
                ...prev,
                messages: [
                  ...prev.messages,
                  { id: m.id, senderId: m.sender_id, content: m.content, createdAt: m.created_at, readAt: m.read_at, attachment: null },
                ],
              };
            });
          }
          // if message came from partner, mark as read immediately
          const meId = (qc.getQueryData(queryKey) as any)?.me;
          if (meId && m.sender_id !== meId) {
            markReadFn({ data: { conversationId: convId } }).then(() => {
              qc.invalidateQueries({ queryKey: ["conversations"] });
            }).catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as { id: string; read_at: string | null };
          qc.setQueryData(queryKey, (prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((x: any) =>
                x.id === m.id ? { ...x, readAt: m.read_at } : x,
              ),
            };
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convId, qc, markReadFn]);

  // mark conversation as read when opened / when data loads
  useEffect(() => {
    if (!data?.me) return;
    const hasUnread = data.messages.some((m) => m.senderId !== data.me && !m.readAt);
    if (!hasUnread) return;
    markReadFn({ data: { conversationId: convId } })
      .then(() => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .catch(() => {});
  }, [convId, data?.me, data?.messages, markReadFn, qc]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages?.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendFn({ data: { conversationId: convId, content: text } });
      track(Events.ChatMessageSent, { conversation_id: convId, kind: "text" });
      // realtime will update; also optimistic-refresh as fallback
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const partnerName = data?.partner.name || fallbackName || "Pulse 用户";
  const partnerCity = data?.partner.city || "";
  const me = data?.me;
  const source = data?.source || from || "match";
  const partnerId = data?.partner.id;

  const handleBlock = async () => {
    if (!partnerId) return;
    if (!confirm(`确定要拉黑 ${partnerName} 吗？对方将不会出现在你的消息和发现里。`)) return;
    try {
      await blockFn({ data: { targetId: partnerId } });
      toast.success("已拉黑");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/messages" });
    } catch (e: any) {
      toast.error(e?.message || "拉黑失败");
    }
  };

  const handleSubmitReport = async () => {
    if (!partnerId) return;
    try {
      await reportFn({ data: { targetType: "user", targetId: partnerId, reason: reportReason, detail: reportDetail || undefined } });
      toast.success("举报已提交，我们会尽快处理");
      setReportOpen(false);
      setReportDetail("");
    } catch (e: any) {
      toast.error(e?.message || "举报失败");
    }
  };

  const handleDeleteConv = async () => {
    if (!confirm("确定要删除该会话吗？所有聊天记录将被永久删除且无法恢复。")) return;
    try {
      await deleteConvFn({ data: { conversationId: convId } });
      toast.success("会话已删除");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/messages" });
    } catch (e: any) {
      toast.error(e?.message || "删除失败");
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !me) return;
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("图片最大 8MB");
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${me}/chat/${convId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      // try to read dimensions for nicer rendering
      const dims = await readImageDimensions(file);
      await sendImageFn({ data: { conversationId: convId, storagePath: path, width: dims?.width, height: dims?.height } });
      qc.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.error(err?.message || "图片发送失败");
    } finally {
      setUploadingImage(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput((v) => v + emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => navigate({ to: "/messages" })} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          {data?.partner.avatar ? (
            <img src={data.partner.avatar} alt={partnerName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-coral to-sun font-display text-base text-background">
              {partnerName.slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-display text-base font-semibold">
              {partnerName}
              <span className="grid h-4 w-4 place-items-center rounded-full bg-mint/20 text-mint"><Sparkles className="h-2.5 w-2.5" /></span>
            </div>
            <div className="text-[11px] text-muted-foreground">{partnerCity ? `${partnerCity} · ` : ""}在线</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><Phone className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground"><Video className="h-4 w-4" /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground" aria-label="更多操作">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">会话操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setReportOpen(true)} disabled={!partnerId}>
                举报该用户
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} disabled={!partnerId} className="text-destructive focus:text-destructive">
                拉黑该用户
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteConv} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> 删除会话
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>举报 {partnerName}</DialogTitle>
            <DialogDescription>请选择原因，我们会人工复核。恶意举报将影响你的账号信用。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {([
              ["harassment", "骚扰 / 辱骂"],
              ["spam", "广告 / 营销"],
              ["nudity", "色情内容"],
              ["hate", "仇恨 / 歧视"],
              ["scam", "诈骗 / 引流"],
              ["other", "其他"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm has-[:checked]:border-coral has-[:checked]:bg-coral/10">
                <input type="radio" name="reason" checked={reportReason === k} onChange={() => setReportReason(k)} />
                {label}
              </label>
            ))}
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="补充说明（可选，最多 500 字）"
              maxLength={500}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-surface/60 p-3 text-sm outline-none placeholder:text-muted-foreground/60"
              rows={3}
            />
          </div>
          <DialogFooter>
            <button onClick={() => setReportOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm">取消</button>
            <button onClick={handleSubmitReport} className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-background">提交举报</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto w-full max-w-md px-4 pt-3">
        <div className="rounded-2xl border border-coral/30 bg-gradient-to-r from-coral/15 via-sun/10 to-mint/15 p-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-coral/20 text-coral"><Heart className="h-3.5 w-3.5 fill-current" /></div>
            <div className="font-display text-sm font-semibold">
              {source === "match" ? "你们互相喜欢" : source === "voice" ? "想继续聊聊" : source === "video" ? "彼此心动" : "在 Pulse 相遇"} · 已开启对话
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="mx-auto w-full max-w-md flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            会话加载失败：{(error as Error).message}
            <div className="mt-2"><Link to="/messages" className="underline">返回消息列表</Link></div>
          </div>
        )}
        {isLoading && (
          <>
            <div className="ml-9 h-10 w-2/3 animate-pulse rounded-2xl bg-surface/60" />
            <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-surface/60" />
          </>
        )}
        <AnimatePresence initial={false}>
          {(data?.messages ?? []).map((m) => {
            const mine = m.senderId === me;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={mine ? "flex justify-end" : "flex items-end gap-2"}
              >
                {!mine && (
                  data?.partner.avatar ? (
                    <img src={data.partner.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-coral to-sun text-[11px] text-background">
                      {partnerName.slice(0, 1)}
                    </div>
                  )
                )}
                <div
                  className={
                    mine
                      ? `max-w-[78%] rounded-2xl rounded-br-md shadow-md ${m.attachment?.kind === "image" ? "overflow-hidden bg-surface/40 p-0" : "bg-gradient-to-br from-coral to-sun px-3.5 py-2 text-sm text-background"}`
                      : `max-w-[78%] rounded-2xl rounded-bl-md border border-border ${m.attachment?.kind === "image" ? "overflow-hidden bg-surface/40 p-0" : "bg-surface/80 px-3.5 py-2 text-sm"}`
                  }
                >
                  {m.attachment?.kind === "image" ? (
                    <a href={m.attachment.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={m.attachment.url}
                        alt="图片"
                        loading="lazy"
                        className="max-h-72 w-full object-cover"
                        style={m.attachment.width && m.attachment.height ? { aspectRatio: `${m.attachment.width} / ${m.attachment.height}` } : undefined}
                      />
                    </a>
                  ) : (
                    m.content
                  )}
                  <div className={`flex items-center justify-end gap-1 text-[10px] ${m.attachment?.kind === "image" ? "px-2 py-1 bg-background/40 text-foreground/70" : `mt-1 ${mine ? "text-background/80" : "text-muted-foreground"}`}`}>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && (m.readAt
                      ? <CheckCheck className="h-3 w-3" />
                      : <Check className="h-3 w-3 opacity-70" />)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground hover:text-foreground" aria-label="表情">
                <Smile className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-72 p-2">
              <div className="grid grid-cols-8 gap-1 text-xl">
                {EMOJI_LIST.map((e) => (
                  <button key={e} onClick={() => insertEmoji(e)} className="rounded-md p-1 hover:bg-surface" aria-label={e}>
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={handlePickImage}
            disabled={uploadingImage}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="发送图片"
          >
            {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </button>
          <GiftButton convId={convId} partnerId={partnerId ?? null} partnerName={data?.partner.name ?? fallbackName ?? "Ta"} />
          <div className="flex flex-1 items-center rounded-full border border-border bg-surface/70 px-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="说点什么..."
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button className="text-muted-foreground"><Mic className="h-4 w-4" /></button>
          </div>
          <button onClick={send} disabled={!input.trim() || sending} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-coral to-sun text-background shadow-lg disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
