import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Bell, Heart, MessageSquare, Sparkles, UserPlus, ThumbsUp, MessageCircle, CheckCheck } from "lucide-react";
import { listMyNotifications, markAllRead, markRead, type NotificationItem } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "通知 · Pulse" },
      { name: "description", content: "你的 Pulse 站内通知：消息、点赞、配对、评论、关注。" },
    ],
  }),
  component: NotificationsPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  message: { icon: MessageSquare, color: "text-mint", label: "新消息" },
  like: { icon: Heart, color: "text-coral", label: "新喜欢" },
  match: { icon: Sparkles, color: "text-sun", label: "成功配对" },
  comment: { icon: MessageCircle, color: "text-brand", label: "新评论" },
  post_like: { icon: ThumbsUp, color: "text-coral", label: "动态被赞" },
  follow: { icon: UserPlus, color: "text-mint", label: "新粉丝" },
};

function describe(n: NotificationItem): { title: string; body: string; to?: any } {
  const p = n.payload || {};
  switch (n.type) {
    case "message":
      return { title: `${p.sender_name ?? "有人"} 给你发了消息`, body: p.preview ?? "", to: { to: "/chat", search: { id: p.conversation_id } } };
    case "like":
      return { title: `${p.swiper_name ?? "有人"} 喜欢了你`, body: "去发现页看看吧", to: { to: "/discover" } };
    case "match":
      return { title: `你和 ${p.other_name ?? "Ta"} 互相喜欢！`, body: "现在可以开始聊天了", to: { to: "/messages" } };
    case "comment":
      return { title: `${p.commenter_name ?? "有人"} 评论了你的动态`, body: p.preview ?? "", to: { to: "/community" } };
    case "post_like":
      return { title: `${p.liker_name ?? "有人"} 赞了你的动态`, body: p.post_title ?? "", to: { to: "/community" } };
    case "follow":
      return { title: `${p.follower_name ?? "有人"} 关注了你`, body: "", to: { to: "/me" } };
    default:
      return { title: n.type, body: "" };
  }
}

function NotificationsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMyNotifications);
  const markAll = useServerFn(markAllRead);
  const markOne = useServerFn(markRead);
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => list() });

  useEffect(() => {
    const ch = supabase
      .channel("notif-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);

  const items = q.data?.notifications ?? [];

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/85 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <button onClick={() => nav({ to: "/me" })} className="size-9 rounded-full hover:bg-muted/40 flex items-center justify-center">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-base font-semibold flex items-center gap-2">
            <Bell className="size-4" /> 通知
          </h1>
          <button
            onClick={async () => {
              await markAll();
              qc.invalidateQueries({ queryKey: ["notifications"] });
              qc.invalidateQueries({ queryKey: ["notifications-unread"] });
            }}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <CheckCheck className="size-3.5" /> 全部已读
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-2">
        {q.isLoading && <div className="text-sm text-muted-foreground py-8 text-center">加载中…</div>}
        {!q.isLoading && items.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            <Bell className="size-10 mx-auto mb-3 opacity-30" />
            还没有通知
          </div>
        )}
        {items.map((n) => {
          const meta = TYPE_META[n.type] ?? { icon: Bell, color: "text-muted-foreground", label: n.type };
          const Icon = meta.icon;
          const d = describe(n);
          const unread = !n.read_at;
          const handleClick = async () => {
            if (unread) await markOne({ data: { id: n.id } });
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["notifications-unread"] });
            if (d.to) nav(d.to);
          };
          return (
            <button
              key={n.id}
              onClick={handleClick}
              className={`w-full text-left flex gap-3 p-3 rounded-2xl border ${unread ? "bg-card border-coral/30" : "bg-card/40 border-border"} hover:bg-card transition`}
            >
              <span className={`size-10 rounded-full bg-muted/40 flex items-center justify-center ${meta.color} shrink-0`}>
                <Icon className="size-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{d.title}</span>
                  {unread && <span className="size-1.5 rounded-full bg-coral shrink-0" />}
                </span>
                {d.body && <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.body}</span>}
                <span className="block text-[10px] text-muted-foreground/70 mt-1">{meta.label} · {timeAgo(n.created_at)}</span>
              </span>
            </button>
          );
        })}
      </main>
    </div>
  );
}