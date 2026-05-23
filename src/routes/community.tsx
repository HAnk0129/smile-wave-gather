import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, MapPin, ChevronDown, Plus,
  Flame, TrendingUp, Search, Home, Compass, Trophy, User, X, Image as ImageIcon,
  Tag, ShoppingBag, MessageSquare, HelpCircle,
} from "lucide-react";

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

type Post = {
  id: string;
  author: string;
  avatar: string;
  category: Exclude<Category, "all">;
  title: string;
  content: string;
  cover: string;
  tags: string[];
  likes: number;
  comments: number;
  hot: number;
  height: "tall" | "mid" | "short";
};

const POSTS: Post[] = [
  { id: "1", author: "海岛小鹿", avatar: "🦌", category: "second", title: "宿舍搬家急出：宜家小书桌 + 落地灯", content: "毕业搬走，原价 ¥899，现 ¥250 打包带走，可自取。", cover: "from-mint/40 via-mint/10 to-transparent", tags: ["#宿舍好物", "#自取"], likes: 328, comments: 42, hot: 9821, height: "tall" },
  { id: "2", author: "K酱不熬夜", avatar: "🌙", category: "vent", title: "试验区的食堂阿姨手抖到底是什么超能力", content: "排队 20 分钟，到我这里突然只剩半勺……是不是我打开方式错了😭", cover: "from-coral/40 via-coral/10 to-transparent", tags: ["#食堂日记"], likes: 1203, comments: 286, hot: 18420, height: "mid" },
  { id: "3", author: "Lina", avatar: "🌊", category: "ask", title: "有人一起拼车去三亚机场吗 周五下午 3 点", content: "黎安出发，可均摊车费，最好带行李箱大件多的同学～", cover: "from-sun/40 via-sun/10 to-transparent", tags: ["#拼车", "#周五"], likes: 86, comments: 53, hot: 6701, height: "short" },
  { id: "4", author: "Coco", avatar: "🐚", category: "second", title: "九成新 iPad Air 5 + 妙控键盘", content: "今年三月买的，配件齐全，¥3680。课程结束用不上了。", cover: "from-mint/40 via-mint/10 to-transparent", tags: ["#数码", "#可小刀"], likes: 564, comments: 91, hot: 12033, height: "mid" },
  { id: "5", author: "雨果不下雨", avatar: "☔", category: "vent", title: "为什么海南的雨都是定点开始定点结束", content: "刚出门，云直接给我表演了一个开关水龙头。", cover: "from-coral/40 via-coral/10 to-transparent", tags: ["#天气", "#今日份吐槽"], likes: 712, comments: 168, hot: 9420, height: "short" },
  { id: "6", author: "可乐no冰", avatar: "🥤", category: "ask", title: "试验区附近有靠谱的牙科诊所吗", content: "智齿肿了……求大佬推荐，最好能预约周末。", cover: "from-sun/40 via-sun/10 to-transparent", tags: ["#求推荐"], likes: 42, comments: 37, hot: 4302, height: "tall" },
  { id: "7", author: "Sunny", avatar: "🌞", category: "second", title: "出一张 周杰伦三亚演唱会内场票", content: "原价转，临时有事去不了，认证后转。", cover: "from-mint/40 via-mint/10 to-transparent", tags: ["#演唱会", "#急出"], likes: 2189, comments: 412, hot: 23890, height: "tall" },
  { id: "8", author: "Mochi", avatar: "🍡", category: "vent", title: "图书馆的空调真的会冻醒人", content: "穿短袖进去，三十分钟后开始怀疑人生。", cover: "from-coral/40 via-coral/10 to-transparent", tags: ["#图书馆"], likes: 488, comments: 102, hot: 7210, height: "mid" },
];

const HOT_RANK = [...POSTS].sort((a, b) => b.hot - a.hot).slice(0, 5);

function CommunityPage() {
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [locOpen, setLocOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const filtered = useMemo(
    () => (activeCat === "all" ? POSTS : POSTS.filter((p) => p.category === activeCat)),
    [activeCat]
  );

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
            {HOT_RANK.map((p, i) => {
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
          <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
            <AnimatePresence>
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} />
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
        {composeOpen && <ComposeSheet onClose={() => setComposeOpen(false)} location={location} />}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const meta = CATEGORY_META[post.category];
  const heightClass =
    post.height === "tall" ? "h-56" : post.height === "mid" ? "h-44" : "h-32";
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
            <span className="size-5 rounded-full bg-surface flex items-center justify-center text-[11px]">{post.avatar}</span>
            <span className="truncate max-w-[80px]">{post.author}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5"><Heart className="size-3" />{post.likes}</span>
            <span className="inline-flex items-center gap-0.5"><MessageCircle className="size-3" />{post.comments}</span>
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
    { to: "/onboarding", icon: User, label: "我的" },
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

function ComposeSheet({ onClose, location }: { onClose: () => void; location: string }) {
  const [cat, setCat] = useState<Exclude<Category, "all">>("second");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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

        <div className="rounded-xl border border-dashed border-border h-32 flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-xs">
          <ImageIcon className="size-6" />
          点击上传图片 / 视频
        </div>

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
          onClick={onClose}
          disabled={!title.trim()}
          className="w-full h-11 rounded-full bg-gradient-to-r from-coral to-sun text-background font-semibold disabled:opacity-40"
        >
          发布到社区
        </button>
      </div>
    </Modal>
  );
}