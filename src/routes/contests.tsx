import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy, MapPin, Calendar, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listContests, createContest, type Contest } from "@/lib/contests.functions";
import { BottomNav } from "@/components/BottomNav";
import { Header, EmptyState } from "@/components/SectionChrome";

export const Route = createFileRoute("/contests")({
  head: () => ({
    meta: [
      { title: "比赛公告 · Pulse" },
      { name: "description", content: "校园比赛、活动、竞赛公告一站浏览,发布属于你的赛事召集令。" },
    ],
  }),
  component: ContestsPage,
});

const CATS = [
  { k: "all", label: "全部" },
  { k: "basketball", label: "篮球" },
  { k: "football", label: "足球" },
  { k: "badminton", label: "羽毛球" },
  { k: "tennis", label: "网球" },
  { k: "track_field", label: "田径运动会" },
  { k: "academic", label: "学术竞赛" },
];

function ContestsPage() {
  const fetchList = useServerFn(listContests);
  const createFn = useServerFn(createContest);
  const qc = useQueryClient();
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["contests"], queryFn: () => fetchList() });
  const list = (data?.contests ?? []).filter((c) => cat === "all" || c.category === cat);

  const create = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("发布成功");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["contests"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "发布失败"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Header title="比赛公告" subtitle="找到你的下一个高光时刻" icon={<Trophy className="h-5 w-5" />} />
      <div className="mx-auto max-w-3xl px-5">
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATS.map((c) => (
            <button
              key={c.k}
              onClick={() => setCat(c.k)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${cat === c.k ? "border-coral bg-coral text-background" : "border-border bg-surface/60 text-muted-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          {!isLoading && list.length === 0 && (
            <EmptyState icon={<Trophy className="h-6 w-6" />} text="还没有比赛公告,做第一个发布者吧" />
          )}
          {list.map((c) => <ContestCard key={c.id} c={c} />)}
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-20 flex items-center gap-2 rounded-full bg-gradient-to-br from-coral to-sun px-5 py-3 text-sm font-semibold text-background shadow-xl"
      >
        <Plus className="h-4 w-4" /> 发布比赛
      </button>

      {open && (
        <ComposeSheet
          onClose={() => setOpen(false)}
          onSubmit={(v: any) => create.mutate(v)}
          submitting={create.isPending}
        />
      )}
      <BottomNav active="explore" />
    </div>
  );
}

function ContestCard({ c }: { c: Contest }) {
  const vsMatch = c.title.match(/^(.+?)\s*(?:vs|VS|对|对阵)\s*(.+)$/);
  return (
    <Link
      to="/contests/$contestId"
      params={{ contestId: c.id }}
      className="block overflow-hidden rounded-2xl border border-border bg-surface/70 backdrop-blur transition hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
    >
      <div className="relative h-28 bg-gradient-to-br from-coral/40 via-sun/20 to-mint/20">
        {c.cover && <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground">{c.category}</span>
      </div>
      <div className="p-4">
        {vsMatch ? (
          <div className="flex items-stretch gap-3">
            <div className="flex-1 text-right">
              <p className="font-display text-base font-semibold leading-snug">{vsMatch[1]}</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="vs-badge rounded-xl px-3 py-1.5 text-sm">VS</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-display text-base font-semibold leading-snug">{vsMatch[2]}</p>
            </div>
          </div>
        ) : (
          <h3 className="font-display text-lg font-semibold">{c.title}</h3>
        )}
        {c.summary && !vsMatch && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
        )}
        {vsMatch && c.summary && (
          <p className="mt-2 text-center text-xs text-muted-foreground">{c.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
          {c.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />截止 {fmt(c.deadline)}</span>}
          {c.prize && <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{c.prize}</span>}
        </div>
      </div>
    </Link>
  );
}

function ComposeSheet({ onClose, onSubmit, submitting }: any) {
  const [v, setV] = useState({
    title: "", summary: "", description: "", category: "basketball",
    location: "", prize: "", organizer: "", contact: "", register_url: "", deadline: "",
  });
  const upd = (k: string) => (e: any) => setV((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5">
        <h2 className="font-display text-xl font-semibold">发布比赛公告</h2>
        <div className="mt-4 space-y-3">
          <Field label="标题"><input className={ipt} value={v.title} onChange={upd("title")} placeholder="例如:第三届校园编程马拉松" /></Field>
          <Field label="一句话简介"><input className={ipt} value={v.summary} onChange={upd("summary")} maxLength={160} /></Field>
          <Field label="详细介绍"><textarea rows={4} className={ipt} value={v.description} onChange={upd("description")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="分类">
              <select className={ipt} value={v.category} onChange={upd("category")}>
                {CATS.filter((c) => c.k !== "all").map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="地点"><input className={ipt} value={v.location} onChange={upd("location")} /></Field>
            <Field label="奖品/奖金"><input className={ipt} value={v.prize} onChange={upd("prize")} /></Field>
            <Field label="主办方"><input className={ipt} value={v.organizer} onChange={upd("organizer")} /></Field>
            <Field label="联系方式"><input className={ipt} value={v.contact} onChange={upd("contact")} /></Field>
            <Field label="截止日期"><input type="datetime-local" className={ipt} value={v.deadline} onChange={upd("deadline")} /></Field>
          </div>
          <Field label="报名链接 (可选)"><input className={ipt} value={v.register_url} onChange={upd("register_url")} placeholder="https://" /></Field>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm">取消</button>
          <button
            disabled={submitting || !v.title || !v.summary}
            onClick={() => onSubmit({
              ...v,
              deadline: v.deadline ? new Date(v.deadline).toISOString() : null,
              description: v.description || null, location: v.location || null,
              prize: v.prize || null, organizer: v.organizer || null, contact: v.contact || null,
              register_url: v.register_url || null,
            })}
            className="flex-1 rounded-xl bg-coral py-3 text-sm font-semibold text-background disabled:opacity-50"
          >
            {submitting ? "发布中…" : "发布"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ipt = "w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-coral";

function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function fmt(s: string) { try { return new Date(s).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }); } catch { return s; } }