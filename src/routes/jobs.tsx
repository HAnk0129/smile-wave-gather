import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, MapPin, Coins, Plus, Phone } from "lucide-react";
import { toast } from "sonner";
import { listJobs, createJob, getJobContact, type Job } from "@/lib/jobs.functions";
import { BottomNav } from "@/components/BottomNav";
import { Header, EmptyState } from "@/components/SectionChrome";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "实习与工作 · Pulse" },
      { name: "description", content: "校园兼职、实习、项目合作需求集合,快速找到搭子或人才。" },
    ],
  }),
  component: JobsPage,
});

const CATS = [
  { k: "all", label: "全部" },
  { k: "parttime", label: "兼职" },
  { k: "intern", label: "实习" },
  { k: "fulltime", label: "全职" },
  { k: "freelance", label: "私活" },
  { k: "collab", label: "合作" },
];

function JobsPage() {
  const fetchList = useServerFn(listJobs);
  const createFn = useServerFn(createJob);
  const qc = useQueryClient();
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", cat],
    queryFn: () => fetchList({ data: { category: cat } }),
  });

  const create = useMutation({
    mutationFn: (p: any) => createFn({ data: p }),
    onSuccess: () => { toast.success("发布成功"); setOpen(false); qc.invalidateQueries({ queryKey: ["jobs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "发布失败"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Header title="实习与工作" subtitle="兼职/实习/合作 一站搞定" icon={<Briefcase className="h-5 w-5" />} />
      <div className="mx-auto max-w-3xl px-5">
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATS.map((c) => (
            <button key={c.k} onClick={() => setCat(c.k)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${cat === c.k ? "border-mint bg-mint text-background" : "border-border bg-surface/60 text-muted-foreground"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          {!isLoading && (data?.jobs ?? []).length === 0 && (
            <EmptyState icon={<Briefcase className="h-6 w-6" />} text="还没有发布需求,做第一个发布者吧" />
          )}
          {(data?.jobs ?? []).map((j) => <JobCard key={j.id} j={j} />)}
        </div>
      </div>

      <button onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-20 flex items-center gap-2 rounded-full bg-gradient-to-br from-mint to-brand px-5 py-3 text-sm font-semibold text-background shadow-xl">
        <Plus className="h-4 w-4" /> 发布需求
      </button>

      {open && <Compose onClose={() => setOpen(false)} onSubmit={(v: any) => create.mutate(v)} submitting={create.isPending} />}
      <BottomNav active="explore" />
    </div>
  );
}

function JobCard({ j }: { j: Omit<Job, "contact"> }) {
  const fetchContact = useServerFn(getJobContact);
  const [contact, setContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reveal = async () => {
    if (contact || loading) return;
    setLoading(true);
    try {
      const r = await fetchContact({ data: { id: j.id } });
      setContact(r.contact);
    } catch (e: any) {
      toast.error(e?.message ?? "获取联系方式失败");
    } finally {
      setLoading(false);
    }
  };
  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold">{j.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{j.summary}</p>
        </div>
        <span className="shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] text-mint">{j.category}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
        {j.salary && <span className="inline-flex items-center gap-1 text-coral"><Coins className="h-3 w-3" />{j.salary}</span>}
        {contact ? (
          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{contact}</span>
        ) : (
          <button onClick={reveal} disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-mint hover:bg-mint/10 disabled:opacity-60">
            <Phone className="h-3 w-3" />{loading ? "加载中…" : "查看联系方式"}
          </button>
        )}
      </div>
      {Array.isArray(j.tags) && j.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {j.tags.map((t) => <span key={t} className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
        </div>
      )}
    </article>
  );
}

const ipt = "w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-mint";
function Field({ label, children }: any) {
  return <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>;
}

function Compose({ onClose, onSubmit, submitting }: any) {
  const [v, setV] = useState({
    title: "", summary: "", description: "", category: "parttime",
    location: "", salary: "", contact: "", tagsText: "",
  });
  const upd = (k: string) => (e: any) => setV((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5">
        <h2 className="font-display text-xl font-semibold">发布实习/工作</h2>
        <div className="mt-4 space-y-3">
          <Field label="标题"><input className={ipt} value={v.title} onChange={upd("title")} placeholder="例如:周末活动摄影助理" /></Field>
          <Field label="一句话摘要"><input className={ipt} value={v.summary} onChange={upd("summary")} maxLength={160} /></Field>
          <Field label="详细描述"><textarea rows={4} className={ipt} value={v.description} onChange={upd("description")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="类型">
              <select className={ipt} value={v.category} onChange={upd("category")}>
                {CATS.filter((c) => c.k !== "all").map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="地点/远程"><input className={ipt} value={v.location} onChange={upd("location")} /></Field>
            <Field label="薪资"><input className={ipt} value={v.salary} onChange={upd("salary")} placeholder="如 150元/天" /></Field>
            <Field label="联系方式"><input className={ipt} value={v.contact} onChange={upd("contact")} placeholder="微信/电话" /></Field>
          </div>
          <Field label="标签 (逗号分隔)"><input className={ipt} value={v.tagsText} onChange={upd("tagsText")} placeholder="如 设计,周末,急" /></Field>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm">取消</button>
          <button disabled={submitting || !v.title || !v.summary || !v.contact}
            onClick={() => onSubmit({
              title: v.title, summary: v.summary, description: v.description || null,
              category: v.category, location: v.location || null, salary: v.salary || null,
              contact: v.contact,
              tags: v.tagsText.split(/[,，]/).map((t) => t.trim()).filter(Boolean).slice(0, 8),
            })}
            className="flex-1 rounded-xl bg-mint py-3 text-sm font-semibold text-background disabled:opacity-50">
            {submitting ? "发布中…" : "发布"}
          </button>
        </div>
      </div>
    </div>
  );
}