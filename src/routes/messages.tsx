import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Search, MessageSquare, Home, Compass, Trophy, User as UserIcon,
  Flame, Mic, Video as VideoIcon, Ghost, Heart, Sparkles,
} from "lucide-react";
import { listConversations } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "消息 · Pulse" },
      { name: "description", content: "你的 Pulse 对话列表：和匹配的人、语音/视频破冰的人继续聊。" },
    ],
  }),
  component: MessagesPage,
});

const SOURCE_META: Record<string, { label: string; icon: any; color: string }> = {
  match: { label: "匹配", icon: Heart, color: "text-coral" },
  voice: { label: "语音破冰", icon: Mic, color: "text-mint" },
  video: { label: "视频破冰", icon: VideoIcon, color: "text-sun" },
  treehole: { label: "树洞", icon: Ghost, color: "text-brand" },
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString();
}

function MessagesPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const fetchList = useServerFn(listConversations);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchList(),
    enabled: authed === true,
    refetchOnWindowFocus: true,
  });

  // realtime: refresh on new message in any of my conversations
  useEffect(() => {
    if (authed !== true) return;
    const channel = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authed, refetch]);

  const list = (data?.conversations ?? []).filter((c) =>
    keyword ? (c.partnerName + (c.lastMessage ?? "")).toLowerCase().includes(keyword.toLowerCase()) : true,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* header */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-coral to-sun text-background">
              <Flame className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">消息</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            <span className="text-xs">{list.length} 个对话</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md px-5 pb-3">
          <label className="flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索昵称或聊天内容"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
            />
          </label>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-3 pb-28 pt-2">
        {authed === false && (
          <div className="mx-2 mt-8 rounded-2xl border border-border bg-surface/70 p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-coral/15 text-coral">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">登录后查看你的消息</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/auth" search={{ mode: "login" }} className="rounded-[10px] border border-brand/40 px-4 py-2.5 text-sm text-brand">登录</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-[10px] bg-coral px-4 py-2.5 text-sm font-semibold text-background">注册</Link>
            </div>
          </div>
        )}

        {authed === true && isLoading && (
          <div className="space-y-2 px-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface/50" />
            ))}
          </div>
        )}

        {authed === true && !isLoading && list.length === 0 && (
          <div className="mx-2 mt-8 rounded-3xl border border-dashed border-border bg-surface/40 p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-coral/30 to-sun/30 text-background">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">还没有对话</h3>
            <p className="mt-1 text-sm text-muted-foreground">去滑卡、语音破冰，遇见同频的人</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/discover" className="rounded-[10px] bg-coral px-4 py-2 text-sm font-semibold text-background">开始滑卡</Link>
              <Link to="/explore" className="rounded-[10px] border border-border px-4 py-2 text-sm text-foreground">去发现</Link>
            </div>
          </div>
        )}

        {authed === true && list.length > 0 && (
          <ul className="space-y-1">
            {list.map((c) => {
              const meta = SOURCE_META[c.source] || SOURCE_META.match;
              const Icon = meta.icon;
              return (
                <li key={c.id}>
                  <Link
                    to="/chat"
                    search={{ conv: c.id, name: c.partnerName, from: c.source }}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-surface/60"
                  >
                    {c.partnerAvatar ? (
                      <img src={c.partnerAvatar} alt={c.partnerName} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-coral to-sun font-display text-lg text-background">
                        {c.partnerName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-base font-semibold">{c.partnerName}</span>
                        <span className={`inline-flex items-center gap-0.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] ${meta.color}`}>
                          <Icon className="h-2.5 w-2.5" /> {meta.label}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.lastMessage || "开始你们的第一句话…"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const items = [
    { to: "/", icon: Home, label: "首页" },
    { to: "/explore", icon: Compass, label: "发现" },
    { to: "/messages", icon: MessageSquare, label: "消息", active: true },
    { to: "/games", icon: Trophy, label: "破冰" },
    { to: "/me", icon: UserIcon, label: "我的" },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-background/85 border-t border-border">
      <div className="mx-auto max-w-3xl grid grid-cols-5 h-16">
        {items.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              it.active ? "text-coral" : "text-muted-foreground"
            }`}
          >
            <it.icon className="size-5" />
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}