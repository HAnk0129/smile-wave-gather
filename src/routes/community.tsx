import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, MapPin, ChevronDown, Plus,
  Flame, TrendingUp, X, Image as ImageIcon,
  Tag, ShoppingBag, MessageSquare, HelpCircle, KeyRound, Copy, Check, School,
  Search, Send, UserPlus, Loader2, Flag,
} from "lucide-react";
import { BottomNav as AppBottomNav } from "@/components/BottomNav";
import { ReportSheet, type ReportTargetType } from "@/components/ReportSheet";
import { z } from "zod";
import { track, Events } from "@/lib/analytics";
import {
  listCommunityPosts,
  createCommunityPost,
  toggleCommunityLike,
  type CommunityPost,
} from "@/lib/community.functions";
import {
  listCommunityComments,
  addCommunityComment,
  deleteCommunityComment,
  type CommunityComment,
} from "@/lib/community.functions";
import {
  listMyCampuses,
  listAllCampuses,
  redeemCampusInvite,
  createCampusInvite,
  searchInviteCandidates,
  inviteUsersToCampus,
  type Campus,
} from "@/lib/campus.functions";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "社区广场 · Pulse" },
      { name: "description", content: "陵水黎安国际教育创新试验区的同频社区：二手闲置、生活吐槽、发帖求助。" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ compose: z.coerce.number().int().min(0).max(1).optional() }).parse(s),
  component: CommunityPage,
});

type Category = "all" | "second" | "vent" | "ask";

const CATEGORY_META: Record<Exclude<Category, "all">, { label: string; color: string; icon: typeof ShoppingBag }> = {
  second: { label: "二手闲置", color: "bg-mint/20 text-mint border-mint/30", icon: ShoppingBag },
  vent: { label: "吐槽日常", color: "bg-coral/20 text-coral border-coral/30", icon: MessageSquare },
  ask: { label: "发帖求助", color: "bg-sun/20 text-sun border-sun/30", icon: HelpCircle },
};

const TAB_META: Record<Category, { label: string; icon: typeof ShoppingBag }> = {
  all: { label: "全部", icon: Tag },
  second: { label: "二手闲置", icon: ShoppingBag },
  vent: { label: "吐槽日常", icon: MessageSquare },
  ask: { label: "发帖求助", icon: HelpCircle },
};

function heightFor(id: string): "tall" | "mid" | "short" {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return n % 3 === 0 ? "tall" : n % 3 === 1 ? "mid" : "short";
}

function CommunityPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const authRunRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const syncAuth = async (uid: string | undefined) => {
      const runId = ++authRunRef.current;
      if (!mounted) return;
      setAuthed(!!uid);
      setUserId(uid ?? null);
      setIsAdmin(false);

      if (!uid) {
        setRoleReady(true);
        return;
      }

      setRoleReady(false);
      try {
        const { data, error } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", uid).eq("role", "admin").maybeSingle();
        if (error) throw error;
        if (mounted && runId === authRunRef.current) setIsAdmin(!!data);
      } catch (error) {
        console.warn("检查社区权限失败，已按普通用户继续加载", error);
        if (mounted && runId === authRunRef.current) setIsAdmin(false);
      } finally {
        if (mounted && runId === authRunRef.current) setRoleReady(true);
      }
    };
    supabase.auth.getSession()
      .then(({ data }) => syncAuth(data.session?.user.id))
      .catch(() => syncAuth(undefined));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      window.setTimeout(() => void syncAuth(s?.user.id), 0);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const myCampusesFn = useServerFn(listMyCampuses);
  const allCampusesFn = useServerFn(listAllCampuses);
  const { data: campusData, isPending: campusPending, isError: campusIsError, error: campusError, refetch: refetchCampuses } = useQuery({
    queryKey: ["my-campuses", userId, isAdmin],
    queryFn: () => (isAdmin ? allCampusesFn() : myCampusesFn()),
    enabled: authed === true && roleReady,
    placeholderData: (previousData) => previousData,
    retry: 2,
  });
  const myCampuses = campusData?.campuses ?? [];

  if (authed === false) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <School className="size-12 mx-auto text-coral" />
          <h1 className="font-display text-xl font-bold">登录后加入校园社区</h1>
          <p className="text-sm text-muted-foreground">每个学校/园区都是一个独立的同频圈子，登录后用邀请码加入。</p>
          <Link to="/auth" className="inline-block h-11 px-6 rounded-full bg-coral text-background font-semibold leading-[44px]">
            去登录
          </Link>
        </div>
      </div>
    );
  }
  if (authed === null || (authed === true && (!roleReady || campusPending))) {
    return <CommunityBootSkeleton />;
  }
  if (campusIsError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <School className="size-12 mx-auto text-coral" />
          <h1 className="font-display text-xl font-bold">社区加载失败</h1>
          <p className="text-sm text-muted-foreground">{campusError?.message || "网络开小差了，请重试。"}</p>
          <button onClick={() => refetchCampuses()} className="inline-block h-11 px-6 rounded-full bg-coral text-background font-semibold">
            重新加载
          </button>
        </div>
      </div>
    );
  }
  if (myCampuses.length === 0) {
    return <JoinCampusGate onJoined={() => refetchCampuses()} />;
  }
  return <CampusFeed campuses={myCampuses} />;
}

function CampusFeed({ campuses }: { campuses: Campus[] }) {
  const [campus, setCampus] = useState<Campus>(campuses[0]);
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [campusOpen, setCampusOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // auto-open compose when arriving with ?compose=1 from the global "+" button
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  useEffect(() => {
    if (search.compose === 1) {
      setComposeOpen(true);
      nav({ search: {} as never, replace: true });
    }
  }, [search.compose, nav]);

  const listFn = useServerFn(listCommunityPosts);
  const likeFn = useServerFn(toggleCommunityLike);
  const qc = useQueryClient();

  const queryKey = ["community-posts", campus.id, activeCat] as const;
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: { category: activeCat, campus_id: campus.id } }),
  });

  const posts = data?.posts ?? [];

  // 排行榜只在「全部」分类显示，直接复用 posts，无需二次请求
  const hotRank = useMemo(
    () => [...posts].sort((a, b) => b.hot - a.hot).slice(0, 5),
    [posts],
  );

  // 详情页使用 posts 中的最新数据，保证点赞 / 评论数实时同步
  const activePost = useMemo(
    () => (activePostId ? posts.find((p) => p.id === activePostId) ?? null : null),
    [activePostId, posts],
  );

  const likeMut = useMutation({
    mutationFn: (post_id: string) => {
      track(Events.PostLiked, { post_id });
      return likeFn({ data: { post_id } });
    },
    onMutate: async (post_id) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<{ posts: CommunityPost[] }>(queryKey);
      if (prev) {
        qc.setQueryData(queryKey, {
          posts: prev.posts.map((p) =>
            p.id === post_id
              ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
              : p,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(queryKey, ctx.prev),
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setCampusOpen(true)}
            className="group flex items-center gap-2.5 min-w-0 pr-3 pl-1.5 py-1.5 rounded-2xl bg-gradient-to-r from-surface/80 to-surface/30 border border-border/70 hover:border-coral/40 transition"
            title="切换校园 / 园区"
          >
            <span className="size-8 rounded-xl bg-gradient-to-br from-coral via-sun to-mint grid place-items-center shadow-sm text-background">
              <School className="size-4" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 leading-none">校园社区</span>
              <span className="block text-sm font-display font-semibold truncate max-w-[160px] leading-tight mt-0.5">{campus.name}</span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-coral transition" />
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="ml-auto h-9 px-3.5 rounded-full bg-gradient-to-r from-coral to-sun text-background text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-coral/30 transition"
            title="生成邀请码"
          >
            <KeyRound className="size-3.5" /> 邀请
          </button>
        </div>

        {/* Category tabs */}
        <div className="mx-auto max-w-3xl px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(["all", "second", "vent", "ask"] as Category[]).map((c) => {
            const { label, icon: Icon } = TAB_META[c];
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 h-9 pl-3 pr-4 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-all duration-200 ${
                  active
                    ? "text-white shadow-sm scale-[1.03]"
                    : "border border-border/70 text-muted-foreground hover:text-foreground"
                }`}
                style={
                  active
                    ? { backgroundColor: "#8AA832" }
                    : { backgroundColor: "#8AA832", color: "#fff" }
                }
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4 space-y-6">
        {/* Hot ranking - 仅在「全部」分类下显示 */}
        {activeCat === "all" && (
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-coral/15 via-sun/10 to-mint/15 p-5 shadow-sm">
          <div className="absolute -top-12 -right-12 size-40 rounded-full bg-coral/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 size-40 rounded-full bg-mint/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-coral to-sun grid place-items-center text-background shadow-md shadow-coral/30 animate-float">
                <Flame className="size-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base leading-tight">热点排行榜</h2>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">最近大家都在聊的事</p>
              </div>
            </div>
            <TrendingUp className="size-4 text-coral/70" />
          </div>
          <ol className="space-y-2.5">
            {hotRank.length === 0 && (
              <li className="text-xs text-muted-foreground">暂时还没有热门内容～</li>
            )}
            {hotRank.map((p, i) => {
              const Icon = CATEGORY_META[p.category].icon;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActivePostId(p.id)}
                    className="group/rank w-full flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 text-left transition hover:bg-background/40 active:scale-[0.99]"
                  >
                    <span
                      className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                        i === 0 ? "bg-gradient-to-br from-coral to-rose-500 text-background" :
                        i === 1 ? "bg-gradient-to-br from-sun to-amber-500 text-background" :
                        i === 2 ? "bg-gradient-to-br from-mint to-emerald-500 text-background" :
                        "bg-surface/80 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm truncate group-hover/rank:text-coral transition">{p.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {p.hot >= 1000 ? `${(p.hot / 1000).toFixed(1)}k` : p.hot}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
        )}

        {/* Posts feed - Xiaohongshu masonry */}
        <section>
          {isLoading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
              <AnimatePresence>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => likeMut.mutate(post.id)}
                    onOpen={() => setActivePostId(post.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Bottom nav */}
      <AppBottomNav active="community" onCompose={() => setComposeOpen(true)} />

      {/* Campus picker */}
      <AnimatePresence>
        {campusOpen && (
          <Modal onClose={() => setCampusOpen(false)} title="切换校园 / 园区">
            <ul className="space-y-1">
              {campuses.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { setCampus(c); setCampusOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                      c.id === campus.id ? "bg-coral/15 text-coral" : "hover:bg-surface/60"
                    }`}
                  >
                    <School className="size-4" />
                    <div className="flex-1">
                      <div className="text-sm">{c.name}</div>
                      {c.location && <div className="text-[11px] text-muted-foreground">{c.location}</div>}
                    </div>
                  </button>
                </li>
              ))}
              <li className="pt-2 mt-2 border-t border-border">
                <button
                  onClick={() => { setCampusOpen(false); setJoinOpen(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-surface/60 text-muted-foreground"
                >
                  <KeyRound className="size-4" />
                  <span className="text-sm">用邀请码加入新园区</span>
                </button>
              </li>
            </ul>
          </Modal>
        )}
      </AnimatePresence>

      {/* Invite generator */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteSheet campus={campus} onClose={() => setInviteOpen(false)} />
        )}
      </AnimatePresence>

      {/* Join another campus via invite code */}
      <AnimatePresence>
        {joinOpen && (
          <Modal onClose={() => setJoinOpen(false)} title="加入新园区">
            <InlineJoinForm
              onJoined={() => {
                setJoinOpen(false);
                qc.invalidateQueries({ queryKey: ["my-campuses"] });
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Compose */}
      <AnimatePresence>
        {composeOpen && (
          <ComposeSheet
            onClose={() => setComposeOpen(false)}
            campus={campus}
            onPublished={() => qc.invalidateQueries({ queryKey: ["community-posts"] })}
          />
        )}
      </AnimatePresence>

      {/* Post detail */}
      <AnimatePresence>
        {activePost && (
          <PostDetail
            post={activePost}
            onClose={() => setActivePostId(null)}
            onLike={() => likeMut.mutate(activePost.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineJoinForm({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const redeemFn = useServerFn(redeemCampusInvite);
  const submit = async () => {
    const v = code.trim();
    if (v.length < 4) return;
    setSubmitting(true);
    try {
      await redeemFn({ data: { code: v } });
      toast.success("成功加入校园社区");
      onJoined();
    } catch (e: any) {
      toast.error(e?.message ?? "加入失败");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        每个学校/园区都是独立的同频圈子。向圈内同学要一个邀请码即可加入。
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={16}
        placeholder="例如 K7QZ4M2A"
        className="w-full h-12 px-4 rounded-2xl bg-background/40 border border-border text-center font-mono tracking-[0.3em] text-lg uppercase outline-none focus:border-coral/60"
      />
      <button
        onClick={submit}
        disabled={!code.trim() || submitting}
        className="w-full h-11 rounded-full bg-coral text-background font-semibold disabled:opacity-40"
      >
        {submitting ? "验证中…" : "加入社区"}
      </button>
    </div>
  );
}

function JoinCampusGate({ onJoined }: { onJoined: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-5">
        <div className="size-16 mx-auto rounded-2xl bg-coral/15 grid place-items-center">
          <KeyRound className="size-7 text-coral" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">输入邀请码加入社区</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            每个学校/园区都是独立的同频圈子。<br/>向圈内同学要一个邀请码即可加入。
          </p>
        </div>
        <InlineJoinForm onJoined={onJoined} />
        <Link to="/me" className="block text-xs text-muted-foreground hover:text-foreground text-center">前往个人主页 →</Link>
      </div>
    </div>
  );
}

function InviteSheet({ campus, onClose }: { campus: Campus; onClose: () => void }) {
  const [tab, setTab] = useState<"users" | "code">("users");
  const [maxUses, setMaxUses] = useState(5);
  const [hours, setHours] = useState(168);
  const [latest, setLatest] = useState<{ code: string; max_uses: number; expires_at: string | null } | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const createFn = useServerFn(createCampusInvite);
  const searchFn = useServerFn(searchInviteCandidates);
  const inviteUsersFn = useServerFn(inviteUsersToCampus);

  const [q, setQ] = useState("");
  const [users, setUsers] = useState<{ id: string; nickname: string | null; city: string | null; avatar: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { users: rows } = await searchFn({ data: { campus_id: campus.id, q } });
        if (!cancelled) setUsers(rows);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "搜索失败");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, campus.id, searchFn]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 20) next.add(id);
      else toast.message("一次最多邀请 20 人");
      return next;
    });
  };

  const sendInvites = async () => {
    if (selected.size === 0) {
      toast.error("请先选择至少一位用户");
      return;
    }
    setSending(true);
    try {
      const { sent, failed } = await inviteUsersFn({
        data: {
          campus_id: campus.id,
          recipient_ids: Array.from(selected),
          expires_in_hours: 168,
          note: note.trim() || undefined,
        },
      });
      if (sent > 0) toast.success(`已发送 ${sent} 条邀请${failed ? `，${failed} 条失败` : ""}`);
      else toast.error("邀请发送失败");
      setSelected(new Set());
      setNote("");
    } catch (e: any) {
      toast.error(e?.message ?? "发送失败");
    } finally {
      setSending(false);
    }
  };

  const generate = async () => {
    setCreating(true);
    try {
      const { invite } = await createFn({
        data: { campus_id: campus.id, max_uses: maxUses, expires_in_hours: hours },
      });
      setLatest({ code: invite.code, max_uses: invite.max_uses, expires_at: invite.expires_at });
    } catch (e: any) {
      toast.error(e?.message ?? "生成失败");
    } finally {
      setCreating(false);
    }
  };
  const copy = async () => {
    if (!latest) return;
    await navigator.clipboard.writeText(latest.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal onClose={onClose} title={`邀请好友加入 ${campus.name}`}>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full bg-background/40 border border-border">
          {([
            { k: "users" as const, label: "选用户发送", icon: UserPlus },
            { k: "code" as const, label: "生成邀请码", icon: KeyRound },
          ]).map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex-1 h-9 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 transition ${
                  active ? "bg-coral text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "users" ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="按昵称搜索用户"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-background/40 border border-border text-sm outline-none focus:border-coral/50"
              />
            </div>

            {selected.size > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>已选 {selected.size} 人</span>
                <button onClick={() => setSelected(new Set())} className="text-coral">清空</button>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-1.5">
              {searching ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground text-xs">
                  <Loader2 className="size-4 animate-spin mr-2" /> 搜索中…
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {q ? "没找到匹配的用户" : "没有可邀请的用户"}
                </div>
              ) : (
                users.map((u) => {
                  const checked = selected.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        checked ? "border-coral/60 bg-coral/10" : "border-border bg-background/30 hover:border-coral/30"
                      }`}
                    >
                      <AuthorBadge
                        nickname={u.nickname}
                        avatar={u.avatar}
                        fallback={u.id.slice(0, 2)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{u.nickname || "未命名"}</div>
                        {u.city && <div className="text-[11px] text-muted-foreground truncate">{u.city}</div>}
                      </div>
                      <div
                        className={`size-5 rounded-md border flex items-center justify-center ${
                          checked ? "bg-coral border-coral text-background" : "border-border"
                        }`}
                      >
                        {checked && <Check className="size-3.5" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="附言（可选，≤ 200 字）"
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-background/40 border border-border text-sm outline-none focus:border-coral/50 resize-none"
            />

            <button
              onClick={sendInvites}
              disabled={sending || selected.size === 0}
              className="w-full h-11 rounded-full bg-coral text-background font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {sending ? "发送中…" : `发送邀请${selected.size ? ` (${selected.size})` : ""}`}
            </button>
          </div>
        ) : (
          <>
        <p className="text-xs text-muted-foreground">
          仅本园区成员可见的同频社区。生成邀请码发给同学，他们输入即可加入。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            可使用次数
            <input
              type="number" min={1} max={500} value={maxUses}
              onChange={(e) => setMaxUses(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              className="w-full h-10 px-3 rounded-xl bg-background/40 border border-border text-sm text-foreground outline-none focus:border-coral/50"
            />
          </label>
          <label className="text-xs text-muted-foreground space-y-1">
            有效期 (小时)
            <input
              type="number" min={1} max={1440} value={hours}
              onChange={(e) => setHours(Math.max(1, Math.min(1440, Number(e.target.value) || 1)))}
              className="w-full h-10 px-3 rounded-xl bg-background/40 border border-border text-sm text-foreground outline-none focus:border-coral/50"
            />
          </label>
        </div>
        <button
          onClick={generate}
          disabled={creating}
          className="w-full h-11 rounded-full bg-coral text-background font-semibold disabled:opacity-50"
        >
          {creating ? "生成中…" : "生成邀请码"}
        </button>
        {latest && (
          <div className="rounded-2xl border border-border bg-background/40 p-4 text-center space-y-2">
            <div className="font-mono text-2xl tracking-[0.3em]">{latest.code}</div>
            <div className="text-[11px] text-muted-foreground">
              可邀请 {latest.max_uses} 人 ·{" "}
              {latest.expires_at ? `${new Date(latest.expires_at).toLocaleString("zh-CN")} 前有效` : "长期有效"}
            </div>
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs text-coral">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "已复制" : "复制邀请码"}
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </Modal>
  );
}

function AuthorBadge({
  nickname,
  avatar,
  fallback,
  size = "sm",
}: {
  nickname: string | null;
  avatar: string | null;
  fallback: string;
  size?: "sm" | "md";
}) {
  const ini = (nickname ?? fallback).slice(0, 2).toUpperCase();
  const cls = size === "md" ? "size-9 text-sm" : "size-5 text-[10px]";
  if (avatar) {
    return <img src={avatar} alt={nickname ?? ini} className={`${cls} rounded-full object-cover shrink-0`} loading="lazy" />;
  }
  return (
    <span className={`${cls} rounded-full bg-gradient-to-br from-coral/50 to-mint/40 flex items-center justify-center font-bold shrink-0`}>
      {ini}
    </span>
  );
}

function PostCard({ post, onLike, onOpen }: { post: CommunityPost; onLike: () => void; onOpen: () => void }) {
  const meta = CATEGORY_META[post.category];
  const h = heightFor(post.id);
  const heightClass =
    h === "tall" ? "h-60" : h === "mid" ? "h-48" : "h-36";
  const displayName = post.author_nickname ?? `同学 ${post.author_id.slice(0, 2).toUpperCase()}`;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onOpen}
      className="group mb-3 break-inside-avoid rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm border border-border/70 hover:border-coral/50 hover:shadow-xl hover:shadow-coral/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98]"
    >
      <div className={`relative ${heightClass} bg-gradient-to-br ${post.cover} overflow-hidden`}>
        {post.media && post.media[0] ? (
          post.media[0].type === "image" ? (
            <img src={post.media[0].url} alt={post.title} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <video src={post.media[0].url} className="absolute inset-0 size-full object-cover" muted playsInline />
          )
        ) : (
          <div className="absolute inset-0 bg-grid opacity-30" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-md ${meta.color}`}>
          <meta.icon className="size-3" />
          {meta.label}
        </span>
        {post.media && post.media.length > 1 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-background/70 text-[10px] text-foreground/90 backdrop-blur-md">
            +{post.media.length - 1}
          </span>
        )}
        {post.status && post.status !== "approved" && (
          <span
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border ${
              post.status === "pending"
                ? "bg-amber-500/30 text-amber-50 border-amber-400/40"
                : post.status === "rejected"
                  ? "bg-rose-500/40 text-rose-50 border-rose-400/40"
                  : "bg-zinc-700/60 text-zinc-100 border-zinc-500/40"
            }`}
          >
            {post.status === "pending" ? "审核中" : post.status === "rejected" ? "已驳回" : "已移除"}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">{post.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.content}</p>
        {post.status && post.status !== "approved" && (post.review_note || post.auto_flag_reason) && (
          <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-400/20 rounded-md px-2 py-1">
            {post.status === "rejected" || post.status === "removed" ? "审核备注: " : "提示: "}
            {post.review_note || post.auto_flag_reason}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] text-mint bg-mint/10 px-1.5 py-0.5 rounded-md border border-mint/20"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="pt-1 flex items-center justify-between border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 pt-2">
            <AuthorBadge nickname={post.author_nickname} avatar={post.author_avatar} fallback={post.author_id} />
            <span className="truncate max-w-[90px]">{displayName}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-2 tabular-nums">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={`inline-flex items-center gap-0.5 transition active:scale-90 ${post.liked_by_me ? "text-coral" : "hover:text-coral"}`}
              aria-label="点赞"
            >
              <Heart className={`size-3.5 ${post.liked_by_me ? "fill-coral" : ""}`} />
              {post.likes_count}
            </button>
            <span className="inline-flex items-center gap-0.5"><MessageCircle className="size-3.5" />{post.comments_count}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/** Masonry-shaped skeletons that mimic the real feed for a smoother loading transition. */
function FeedSkeleton() {
  const heights = ["h-56", "h-44", "h-60", "h-40", "h-52", "h-44", "h-56", "h-48"];
  return (
    <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]" aria-busy="true" aria-label="正在加载">
      {heights.map((h, i) => (
        <div
          key={i}
          className="mb-3 break-inside-avoid rounded-2xl overflow-hidden bg-surface/60 border border-border"
        >
          <div className={`${h} bg-gradient-to-br from-surface to-background animate-pulse`} />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-5/6 rounded-md bg-surface animate-pulse" />
            <div className="h-3 w-4/6 rounded-md bg-surface/80 animate-pulse" />
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-surface animate-pulse" />
                <div className="h-2.5 w-14 rounded bg-surface/80 animate-pulse" />
              </div>
              <div className="h-2.5 w-10 rounded bg-surface/80 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="py-16 px-6 text-center rounded-3xl border border-dashed border-border bg-surface/30">
      <div className="size-14 mx-auto rounded-2xl bg-coral/10 grid place-items-center">
        <MessageSquare className="size-6 text-coral" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">这里还很安静</h3>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
        这个分类还没有动态<br />点击下方「+」发布第一条吧
      </p>
    </div>
  );
}

/** Full-screen skeleton shown while auth/role/campus hydration is in flight. */
function CommunityBootSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <div className="h-7 w-32 rounded-full bg-surface animate-pulse" />
          <div className="ml-auto h-9 w-16 rounded-full bg-surface animate-pulse" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3 flex items-center gap-2 overflow-hidden">
          {[60, 80, 70, 64].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-surface animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-4 space-y-6">
        <div className="h-40 rounded-3xl bg-surface/50 animate-pulse" />
        <FeedSkeleton />
      </main>
    </div>
  );
}

function PostDetail({ post, onClose, onLike }: { post: CommunityPost; onClose: () => void; onLike: () => void }) {
  const meta = CATEGORY_META[post.category];
  const displayName = post.author_nickname ?? `同学 ${post.author_id.slice(0, 2).toUpperCase()}`;
  const media = post.media ?? [];
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const [report, setReport] = useState<{ type: ReportTargetType; id: string; authorId?: string | null } | null>(null);
  const qc = useQueryClient();
  const listFn = useServerFn(listCommunityComments);
  const addFn = useServerFn(addCommunityComment);
  const delFn = useServerFn(deleteCommunityComment);

  const commentsKey = ["community-comments", post.id] as const;
  const { data: cData } = useQuery({
    queryKey: commentsKey,
    queryFn: () => listFn({ data: { post_id: post.id } }),
  });
  const comments = cData?.comments ?? [];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const addMut = useMutation({
    mutationFn: (content: string) => addFn({ data: { post_id: post.id, content } }),
    onSuccess: ({ comment }) => {
      qc.setQueryData<{ comments: CommunityComment[] }>(commentsKey, (prev) => ({
        comments: [...(prev?.comments ?? []), comment],
      }));
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      setDraft("");
    },
    onError: (e: any) => toast.error(e?.message ?? "评论失败"),
  });

  const delMut = useMutation({
    mutationFn: (comment_id: string) => delFn({ data: { comment_id } }),
    onSuccess: (_r, comment_id) => {
      qc.setQueryData<{ comments: CommunityComment[] }>(commentsKey, (prev) => ({
        comments: (prev?.comments ?? []).filter((c) => c.id !== comment_id),
      }));
      qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "删除失败"),
  });

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    if (text.length > 500) {
      toast.error("评论最多 500 字");
      return;
    }
    addMut.mutate(text);
  };

  const commentCount = comments.length || post.comments_count;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-end md:items-center justify-center md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full md:max-w-5xl max-h-[95vh] md:h-[88vh] rounded-t-3xl md:rounded-3xl bg-surface border border-border overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: media */}
        <div className={`relative bg-black md:w-[58%] md:h-full shrink-0 ${media.length > 0 ? "aspect-square md:aspect-auto" : "h-40 md:h-full"} bg-gradient-to-br ${post.cover}`}>
          {media.length > 0 ? (
            media[idx].type === "image" ? (
              <img src={media[idx].url} alt={post.title} className="absolute inset-0 size-full object-contain" />
            ) : (
              <video src={media[idx].url} controls className="absolute inset-0 size-full object-contain" />
            )
          ) : (
            <div className="absolute inset-0 bg-grid opacity-30" />
          )}
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${meta.color}`}>
            <meta.icon className="size-3" /> {meta.label}
          </span>
          {media.length > 1 && (
            <>
              <button
                onClick={() => setIdx((idx - 1 + media.length) % media.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80"
                aria-label="上一张"
              >‹</button>
              <button
                onClick={() => setIdx((idx + 1) % media.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80"
                aria-label="下一张"
              >›</button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-background/70 text-xs backdrop-blur-md">
                {idx + 1} / {media.length}
              </span>
            </>
          )}
        </div>

        {/* Right: author + content + comments + actions */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Author header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
            <AuthorBadge nickname={post.author_nickname} avatar={post.author_avatar} fallback={post.author_id} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-[11px] text-muted-foreground">Pulse 用户</div>
            </div>
          {meId && meId !== post.author_id && (
            <button
              onClick={() => setReport({ type: "post", id: post.id, authorId: post.author_id })}
              className="size-8 rounded-full bg-surface/70 flex items-center justify-center text-muted-foreground hover:text-coral"
              aria-label="举报"
            >
              <Flag className="size-4" />
            </button>
          )}
            <button onClick={onClose} className="size-8 rounded-full bg-surface/70 flex items-center justify-center md:bg-transparent">
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable content + comments */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <h2 className="text-lg font-display font-bold leading-snug">{post.title}</h2>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.content}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs text-mint">#{t}</span>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
              <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{post.location}</span>
            </div>

            <div className="pt-4 mt-2 border-t border-border text-xs text-muted-foreground">
              共 {commentCount} 条评论
            </div>
            {comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                还没有评论，来抢沙发吧～
              </div>
            ) : (
              <ul className="space-y-3 pt-1">
                {comments.map((c) => {
                  const name = c.author_nickname || `同学 ${c.author_id.slice(0, 2).toUpperCase()}`;
                  return (
                    <li key={c.id} className="flex gap-2.5">
                      <AuthorBadge nickname={c.author_nickname} avatar={c.author_avatar} fallback={c.author_id} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium text-foreground/90 truncate">{name}</span>
                          <span>·</span>
                          <span>{new Date(c.created_at).toLocaleDateString("zh-CN")}</span>
                          {meId === c.author_id && (
                            <button
                              onClick={() => delMut.mutate(c.id)}
                              className="ml-auto text-[11px] text-muted-foreground hover:text-coral"
                            >
                              删除
                            </button>
                          )}
                          {meId && meId !== c.author_id && (
                            <button
                              onClick={() => setReport({ type: "comment", id: c.id, authorId: c.author_id })}
                              className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-coral"
                            >
                              <Flag className="size-3" /> 举报
                            </button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-border bg-background/85 backdrop-blur-xl px-4 py-2.5 flex items-center gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              maxLength={500}
              placeholder="说点什么…"
              className="flex-1 h-9 px-4 rounded-full bg-surface/80 border border-border text-sm placeholder:text-muted-foreground outline-none focus:border-coral/50"
            />
            {draft.trim() ? (
              <button
                onClick={handleSubmit}
                disabled={addMut.isPending}
                className="h-9 px-4 rounded-full bg-coral text-background text-xs font-medium disabled:opacity-60"
              >
                {addMut.isPending ? "发送中" : "发送"}
              </button>
            ) : null}
            <button onClick={onLike} className={`inline-flex items-center gap-1 text-xs ${post.liked_by_me ? "text-coral" : "text-muted-foreground"}`}>
              <Heart className={`size-5 ${post.liked_by_me ? "fill-coral" : ""}`} />
              {post.likes_count}
            </button>
            <button className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="size-5" />
              {commentCount}
            </button>
          </div>
        </div>
      </motion.div>
      {report && (
        <ReportSheet
          open
          onClose={() => setReport(null)}
          targetType={report.type}
          targetId={report.id}
          authorId={report.authorId ?? undefined}
        />
      )}
    </motion.div>
  );
}

// BottomNav lives in src/components/BottomNav.tsx

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-surface border border-border p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">{title}</h3>
          <button onClick={onClose} className="size-8 rounded-full bg-background/60 flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ComposeSheet({
  onClose,
  campus,
  onPublished,
}: {
  onClose: () => void;
  campus: Campus;
  onPublished: () => void;
}) {
  const [cat, setCat] = useState<Exclude<Category, "all">>("second");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const createFn = useServerFn(createCommunityPost);
  const [submitting, setSubmitting] = useState(false);
  const [media, setMedia] = useState<{ url: string; type: "image" | "video"; path: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      toast.error("请先登录后再上传");
      return;
    }
    setUploading(true);
    try {
      const next = [...media];
      for (const file of Array.from(files).slice(0, 9 - next.length)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} 超过 25MB，已跳过`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("community-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`上传失败：${error.message}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("community-media").getPublicUrl(path);
        next.push({
          url: pub.publicUrl,
          type: file.type.startsWith("video") ? "video" : "image",
          path,
        });
      }
      setMedia(next);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeMedia = async (idx: number) => {
    const item = media[idx];
    setMedia((m) => m.filter((_, i) => i !== idx));
    await supabase.storage.from("community-media").remove([item.path]).catch(() => {});
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, "").slice(0, 20);
    if (!t) return;
    if (tags.includes(t)) { setTagDraft(""); return; }
    if (tags.length >= 6) { toast.error("最多 6 个话题"); return; }
    setTags([...tags, t]);
    setTagDraft("");
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await createFn({
        data: {
          campus_id: campus.id,
          category: cat,
          title: title.trim(),
          content: content.trim(),
          location: campus.name,
          tags,
          media: media.map(({ url, type }) => ({ url, type })),
        },
      });
      track(Events.PostCreated, { category: cat, has_media: media.length > 0, tags_count: tags.length });
      if ((res as any)?.pending) {
        toast.success("已提交,内容含敏感词,需管理员审核通过后才会公开展示");
      } else {
        toast.success("发布成功");
      }
      onPublished();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("Unauthorized")) toast.error("请先登录");
      else if (msg.includes("row-level security")) toast.error("你还不是该园区的成员");
      else toast.error("发布失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="发布新动态">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_META) as Array<Exclude<Category, "all">>).map((c) => {
            const meta = CATEGORY_META[c];
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition ${
                  active ? meta.color : "bg-background/40 border-border text-muted-foreground"
                }`}
              >
                <meta.icon className="size-4" />
                <span className="text-xs font-medium">{meta.label}</span>
              </button>
            );
          })}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />
        {media.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border border-dashed border-border h-32 flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-xs hover:border-coral/50 hover:text-coral transition disabled:opacity-50"
          >
            <ImageIcon className="size-6" />
            {uploading ? "上传中…" : "点击上传图片 / 视频"}
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {media.map((m, i) => (
              <div key={m.path} className="relative aspect-square rounded-xl overflow-hidden bg-background/40 border border-border">
                {m.type === "image" ? (
                  <img src={m.url} alt="" className="size-full object-cover" />
                ) : (
                  <video src={m.url} className="size-full object-cover" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-background/80 flex items-center justify-center"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {media.length < 9 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-coral hover:border-coral/50 transition disabled:opacity-50"
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给你的笔记起一个标题..."
          className="w-full h-10 px-3 rounded-xl bg-background/40 border border-border text-sm focus:outline-none focus:border-coral/50"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的故事、好物、求助..."
          rows={4}
          className="w-full p-3 rounded-xl bg-background/40 border border-border text-sm resize-none focus:outline-none focus:border-coral/50"
        />

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/15 text-mint text-xs">
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="opacity-70 hover:opacity-100">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground shrink-0" />
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
              }}
              maxLength={20}
              placeholder="添加话题，回车确认（最多 6 个）"
              className="flex-1 h-8 px-2 rounded-lg bg-background/40 border border-border text-xs focus:outline-none focus:border-coral/50"
            />
          </div>
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <School className="size-3 text-coral" /> 发布到 {campus.name}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!title.trim() || !content.trim() || submitting}
          className="w-full h-11 rounded-full bg-gradient-to-r from-coral to-sun text-background font-semibold disabled:opacity-40"
        >
          {submitting ? "发布中…" : "发布到社区"}
        </button>
      </div>
    </Modal>
  );
}