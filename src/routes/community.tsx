import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, MapPin, ChevronDown, Plus,
  Flame, TrendingUp, Search, Home, Compass, Trophy, User, X, Image as ImageIcon,
  Tag, ShoppingBag, MessageSquare, HelpCircle,
} from "lucide-react";
import {
  listCommunityPosts,
  createCommunityPost,
  toggleCommunityLike,
  type CommunityPost,
} from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "社区广场 · Pulse" },
      { name: "description", content: "陵水黎安国际教育创新试验区的同频社区：二手闲置、生活吐槽、发帖求助。" },
    ],
  }),
  component: CommunityPage,
});

type Category = "all" | "second" | "vent" | "ask";

const CATEGORY_META: Record<Exclude<Category, "all">, { label: string; color: string; icon: typeof ShoppingBag }> = {
  second: { label: "二手闲置", color: "bg-mint/20 text-mint border-mint/30", icon: ShoppingBag },
  vent: { label: "吐槽日常", color: "bg-coral/20 text-coral border-coral/30", icon: MessageSquare },
  ask: { label: "发帖求助", color: "bg-sun/20 text-sun border-sun/30", icon: HelpCircle },
};

const LOCATIONS = [
  "陵水黎安国际教育创新试验区",
  "三亚 · 海棠湾",
  "海口 · 江东新区",
  "陵水 · 清水湾",
];

function heightFor(id: string): "tall" | "mid" | "short" {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return n % 3 === 0 ? "tall" : n % 3 === 1 ? "mid" : "short";
}

function CommunityPage() {
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [locOpen, setLocOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const listFn = useServerFn(listCommunityPosts);
  const likeFn = useServerFn(toggleCommunityLike);
  const qc = useQueryClient();

  const queryKey = ["community-posts", activeCat, location] as const;
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: { category: activeCat, location } }),
  });

  const posts = data?.posts ?? [];
  const hotRank = useMemo(() => [...posts].sort((a, b) => b.hot - a.hot).slice(0, 5), [posts]);

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
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocOpen(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface/80 border border-border text-sm font-medium max-w-[55%]"
          >
            <MapPin className="size-3.5 text-coral shrink-0" />
            <span className="truncate">{location}</span>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          </button>
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full bg-surface/60 border border-border text-sm text-muted-foreground">
            <Search className="size-4" />
            <span className="truncate">搜索同学、话题、好物…</span>
          </div>
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
        {/* Hot ranking */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-coral/10 via-surface/40 to-mint/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-coral/20 flex items-center justify-center">
                <Flame className="size-4 text-coral" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">热点排行榜</h2>
                <p className="text-xs text-muted-foreground">每 30 分钟更新 · 基于互动热度</p>
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
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Floating compose button */}
      <button
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-24 right-5 z-40 size-14 rounded-full bg-gradient-to-br from-coral to-sun text-background shadow-2xl glow-coral flex items-center justify-center active:scale-95 transition"
        aria-label="发布内容"
      >
        <Plus className="size-7" />
      </button>

      {/* Bottom nav */}
      <BottomNav />

      {/* Location picker */}
      <AnimatePresence>
        {locOpen && (
          <Modal onClose={() => setLocOpen(false)} title="选择地区">
            <ul className="space-y-1">
              {LOCATIONS.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => { setLocation(l); setLocOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                      l === location ? "bg-coral/15 text-coral" : "hover:bg-surface/60"
                    }`}
                  >
                    <MapPin className="size-4" />
                    <span className="text-sm">{l}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Modal>
        )}
      </AnimatePresence>

      {/* Compose */}
      <AnimatePresence>
        {composeOpen && (
          <ComposeSheet
            onClose={() => setComposeOpen(false)}
            location={location}
            onPublished={() => qc.invalidateQueries({ queryKey: ["community-posts"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ post, onLike }: { post: CommunityPost; onLike: () => void }) {
  const meta = CATEGORY_META[post.category];
  const h = heightFor(post.id);
  const heightClass =
    h === "tall" ? "h-56" : h === "mid" ? "h-44" : "h-32";
  const avatar = post.author_id.slice(0, 2).toUpperCase();
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-3 break-inside-avoid rounded-2xl overflow-hidden bg-surface/60 border border-border hover:border-coral/40 transition"
    >
      <div className={`relative ${heightClass} bg-gradient-to-br ${post.cover}`}>
        <div className="absolute inset-0 bg-grid opacity-30" />
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.color}`}>
          <meta.icon className="size-3" />
          {meta.label}
        </span>
        <ImageIcon className="absolute bottom-2 right-2 size-4 text-foreground/30" />
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
            <span className="size-5 rounded-full bg-surface flex items-center justify-center text-[10px]">{avatar}</span>
            <span className="truncate max-w-[80px]">同学 {avatar}</span>
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

function BottomNav() {
  const items = [
    { to: "/", icon: Home, label: "首页" },
    { to: "/explore", icon: Compass, label: "发现" },
    { to: "/community", icon: MessageSquare, label: "社区", active: true },
    { to: "/games", icon: Trophy, label: "游戏" },
    { to: "/me", icon: User, label: "我的" },
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
  location,
  onPublished,
}: {
  onClose: () => void;
  location: string;
  onPublished: () => void;
}) {
  const [cat, setCat] = useState<Exclude<Category, "all">>("second");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await createFn({
        data: {
          category: cat,
          title: title.trim(),
          content: content.trim(),
          location,
          tags: [],
          media: media.map(({ url, type }) => ({ url, type })),
        },
      });
      toast.success("发布成功");
      onPublished();
      onClose();
    } catch (e: any) {
      toast.error(e?.message?.includes("Unauthorized") ? "请先登录" : "发布失败，请稍后再试");
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

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 text-coral" /> {location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Tag className="size-3" /> 添加话题
          </span>
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