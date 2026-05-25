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
} from "lucide-react";
import { BottomNav as AppBottomNav } from "@/components/BottomNav";
import { z } from "zod";
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

function heightFor(id: string): "tall" | "mid" | "short" {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return n % 3 === 0 ? "tall" : n % 3 === 1 ? "mid" : "short";
}

function CommunityPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const check = async (uid: string | undefined) => {
      if (!uid) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", uid).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      check(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      check(s?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const myCampusesFn = useServerFn(listMyCampuses);
  const allCampusesFn = useServerFn(listAllCampuses);
  const { data: campusData, isLoading: campusLoading, refetch: refetchCampuses } = useQuery({
    queryKey: ["my-campuses", isAdmin],
    queryFn: () => (isAdmin ? allCampusesFn() : myCampusesFn()),
    enabled: authed === true,
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
  if (authed === null || campusLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">加载中…</div>;
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
    mutationFn: (post_id: string) => likeFn({ data: { post_id } }),
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
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setCampusOpen(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface/80 border border-border text-sm font-medium max-w-[55%]"
          >
            <School className="size-3.5 text-coral shrink-0" />
            <span className="truncate">{campus.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="ml-auto h-9 px-3 rounded-full bg-surface/80 border border-border text-xs inline-flex items-center gap-1.5 hover:border-coral/40"
            title="生成邀请码"
          >
            <KeyRound className="size-3.5 text-coral" /> 邀请
          </button>
        </div>

        {/* Category tabs */}
        <div className="mx-auto max-w-3xl px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(["all", "second", "vent", "ask"] as Category[]).map((c) => {
            const label = c === "all" ? "全部" : CATEGORY_META[c].label;
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 h-8 px-4 rounded-full text-sm font-medium transition ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface/60 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4 space-y-6">
        {/* Hot ranking - 仅在「全部」分类下显示 */}
        {activeCat === "all" && (
        <section className="rounded-3xl border border-border bg-gradient-to-br from-coral/10 via-surface/40 to-mint/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-coral/20 flex items-center justify-center">
                <Flame className="size-4 text-coral" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">热点排行榜</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-mint">
              <TrendingUp className="size-3" /> 实时
            </span>
          </div>
          <ol className="space-y-2.5">
            {hotRank.length === 0 && (
              <li className="text-xs text-muted-foreground">暂时还没有热门内容～</li>
            )}
            {hotRank.map((p, i) => {
              const Icon = CATEGORY_META[p.category].icon;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <span
                    className={`size-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-coral text-background" :
                      i === 1 ? "bg-sun text-background" :
                      i === 2 ? "bg-mint text-background" :
                      "bg-surface text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm truncate">{p.title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{(p.hot / 1000).toFixed(1)}k</span>
                </li>
              );
            })}
          </ol>
        </section>
        )}

        {/* Posts feed - Xiaohongshu masonry */}
        <section>
          {isLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">加载中…</div>
          )}
          {!isLoading && posts.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              这个分类还没有动态，点击右下角发布第一条吧～
            </div>
          )}
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
  const [maxUses, setMaxUses] = useState(5);
  const [hours, setHours] = useState(168);
  const [latest, setLatest] = useState<{ code: string; max_uses: number; expires_at: string | null } | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const createFn = useServerFn(createCampusInvite);

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
    h === "tall" ? "h-56" : h === "mid" ? "h-44" : "h-32";
  const displayName = post.author_nickname ?? `同学 ${post.author_id.slice(0, 2).toUpperCase()}`;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onOpen}
      className="mb-3 break-inside-avoid rounded-2xl overflow-hidden bg-surface/60 border border-border hover:border-coral/40 transition cursor-pointer active:scale-[0.99]"
    >
      <div className={`relative ${heightClass} bg-gradient-to-br ${post.cover} overflow-hidden`}>
        {post.media && post.media[0] ? (
          post.media[0].type === "image" ? (
            <img src={post.media[0].url} alt={post.title} className="absolute inset-0 size-full object-cover" loading="lazy" />
          ) : (
            <video src={post.media[0].url} className="absolute inset-0 size-full object-cover" muted playsInline />
          )
        ) : (
          <div className="absolute inset-0 bg-grid opacity-30" />
        )}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-md ${meta.color}`}>
          <meta.icon className="size-3" />
          {meta.label}
        </span>
        {post.media && post.media.length > 1 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-background/60 text-[10px] text-foreground/80 backdrop-blur-md">
            +{post.media.length - 1}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium leading-snug line-clamp-2">{post.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.content}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <span key={t} className="text-[10px] text-mint">{t}</span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AuthorBadge nickname={post.author_nickname} avatar={post.author_avatar} fallback={post.author_id} />
            <span className="truncate max-w-[80px]">{displayName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={`inline-flex items-center gap-0.5 transition ${post.liked_by_me ? "text-coral" : "hover:text-coral"}`}
            >
              <Heart className={`size-3 ${post.liked_by_me ? "fill-coral" : ""}`} />
              {post.likes_count}
            </button>
            <span className="inline-flex items-center gap-0.5"><MessageCircle className="size-3" />{post.comments_count}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function PostDetail({ post, onClose, onLike }: { post: CommunityPost; onClose: () => void; onLike: () => void }) {
  const meta = CATEGORY_META[post.category];
  const displayName = post.author_nickname ?? `同学 ${post.author_id.slice(0, 2).toUpperCase()}`;
  const media = post.media ?? [];
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
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
      await createFn({
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
      toast.success("发布成功");
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