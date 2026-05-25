import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Flag, ShieldCheck, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { listMyReports, listMyAppeals, submitAppeal } from "@/lib/moderation.functions";

export const Route = createFileRoute("/me/reports")({
  head: () => ({
    meta: [
      { title: "我的举报与申诉 · Pulse" },
      { name: "description", content: "查看你提交过的举报处理进度,并对处理结果提出申诉。" },
    ],
  }),
  component: MyReportsPage,
});

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-muted/40 text-muted-foreground" },
  reviewing: { label: "审核中", color: "bg-sun/20 text-sun" },
  resolved: { label: "已处理", color: "bg-mint/20 text-mint" },
  rejected: { label: "驳回", color: "bg-rose-500/20 text-rose-300" },
};

const APPEAL_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "待受理", color: "bg-muted/40 text-muted-foreground" },
  reviewing: { label: "审核中", color: "bg-sun/20 text-sun" },
  accepted: { label: "已通过", color: "bg-mint/20 text-mint" },
  rejected: { label: "未通过", color: "bg-rose-500/20 text-rose-300" },
};

const REASON_LABEL: Record<string, string> = {
  spam: "垃圾广告", harassment: "骚扰辱骂", nudity: "色情低俗", hate: "歧视仇恨",
  violence: "暴力血腥", scam: "诈骗引流", underage: "未成年风险", self_harm: "自残自杀", other: "其他",
};

function MyReportsPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"reports" | "appeals">("reports");
  const [appealFor, setAppealFor] = useState<{ reportId: string; targetType: string; targetId: string } | null>(null);
  const [newAppealOpen, setNewAppealOpen] = useState(false);

  const reportsFn = useServerFn(listMyReports);
  const appealsFn = useServerFn(listMyAppeals);
  const reportsQ = useQuery({ queryKey: ["my-reports"], queryFn: () => reportsFn() });
  const appealsQ = useQuery({ queryKey: ["my-appeals"], queryFn: () => appealsFn() });

  return (
    <div className="min-h-dvh bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button onClick={() => nav({ to: "/me" })} className="grid size-9 place-items-center rounded-full hover:bg-muted/40">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="flex items-center gap-2 text-base font-semibold">
            <Flag className="size-4 text-coral" /> 我的举报与申诉
          </h1>
          <button
            onClick={() => { setAppealFor(null); setNewAppealOpen(true); }}
            className="ml-auto flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1.5 text-xs font-medium text-coral hover:bg-coral/25"
          >
            <Plus className="size-3.5" /> 新建申诉
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl gap-2 px-4 pb-3">
          {(["reports", "appeals"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                tab === k ? "bg-foreground text-background" : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {k === "reports" ? `我的举报 ${reportsQ.data?.reports.length ?? ""}` : `我的申诉 ${appealsQ.data?.appeals.length ?? ""}`}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-3 text-xs text-muted-foreground">
          我们会在 24 小时内核实你的举报;如对处理结果有异议,可以在右上角提交申诉,审核人员会重新评估。
        </div>

        {tab === "reports" && (
          <>
            {reportsQ.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>}
            {!reportsQ.isLoading && (reportsQ.data?.reports ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                你还没有提交过举报
              </div>
            )}
            {(reportsQ.data?.reports ?? []).map((r: any) => {
              const st = REPORT_STATUS[r.status] ?? REPORT_STATUS.pending;
              const canAppeal = r.status === "rejected";
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-surface/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px]">{r.target_type}</span>
                        <span>{REASON_LABEL[r.reason] ?? r.reason}</span>
                        <span>·</span>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      {r.detail && <p className="mt-1.5 text-sm text-muted-foreground">{r.detail}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  {r.resolution_note && (
                    <div className="mt-3 rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">审核反馈:</span> {r.resolution_note}
                    </div>
                  )}
                  {canAppeal && (
                    <button
                      onClick={() => {
                        setAppealFor({ reportId: r.id, targetType: r.target_type, targetId: r.target_id });
                        setNewAppealOpen(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-coral/40 px-3 py-1.5 text-xs text-coral hover:bg-coral/10"
                    >
                      <ShieldCheck className="size-3.5" /> 对结果申诉
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === "appeals" && (
          <>
            {appealsQ.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>}
            {!appealsQ.isLoading && (appealsQ.data?.appeals ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                你还没有提交过申诉
              </div>
            )}
            {(appealsQ.data?.appeals ?? []).map((a: any) => {
              const st = APPEAL_STATUS[a.status] ?? APPEAL_STATUS.pending;
              return (
                <div key={a.id} className="rounded-2xl border border-border bg-surface/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px]">{APPEAL_KIND_LABEL[a.kind] ?? a.kind}</span>
                        {a.target_type && <span>{a.target_type}</span>}
                        <span>·</span>
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1.5 text-sm">{a.reason}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  {a.resolution_note && (
                    <div className="mt-3 rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">审核回复:</span> {a.resolution_note}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div className="pt-4 text-center text-[11px] text-muted-foreground">
          需要查看通知?<Link to="/notifications" className="text-coral hover:underline">前往通知中心</Link>
        </div>
      </main>

      {newAppealOpen && (
        <AppealSheet
          initial={appealFor}
          onClose={() => { setNewAppealOpen(false); setAppealFor(null); }}
          onDone={() => { setTab("appeals"); }}
        />
      )}
    </div>
  );
}

const APPEAL_KIND_LABEL: Record<string, string> = {
  report_rejected: "举报被驳回",
  content_removed: "内容被处理",
  account_action: "账号处置",
  other: "其他",
};

function AppealSheet({
  initial,
  onClose,
  onDone,
}: {
  initial: { reportId: string; targetType: string; targetId: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const submit = useServerFn(submitAppeal);
  const [kind, setKind] = useState<"report_rejected" | "content_removed" | "account_action" | "other">(
    initial ? "report_rejected" : "content_removed",
  );
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          kind,
          reason: reason.trim(),
          targetType: initial?.targetType as any,
          targetId: initial?.targetId,
          relatedReportId: initial?.reportId,
        },
      }),
    onSuccess: () => {
      toast.success("申诉已提交,我们会尽快回复");
      qc.invalidateQueries({ queryKey: ["my-appeals"] });
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "提交失败"),
  });

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border-t border-border bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-mint" /> 提交申诉
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          请客观说明申诉理由,审核人员会基于事实和社区规则重新评估。恶意刷申诉可能影响账号信用。
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(Object.keys(APPEAL_KIND_LABEL) as (keyof typeof APPEAL_KIND_LABEL)[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k as any)}
              className={`rounded-2xl border px-3 py-2 text-xs transition ${
                kind === k ? "border-mint bg-mint/10 text-foreground" : "border-border/70 bg-muted/20 text-muted-foreground"
              }`}
            >
              {APPEAL_KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 1000))}
          placeholder="请详细说明你的理由,至少 10 个字(最多 1000 字)"
          rows={5}
          className="mt-3 w-full resize-none rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm outline-none focus:border-mint"
        />
        <div className="mt-1 text-right text-[10px] text-muted-foreground">{reason.length}/1000</div>

        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending || reason.trim().length < 10}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-brand py-3 text-sm font-semibold text-background disabled:opacity-60"
        >
          {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} 提交申诉
        </button>
      </div>
    </div>
  );
}