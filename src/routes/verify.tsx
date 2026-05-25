import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Shield, GraduationCap, Upload, CheckCircle2, Clock, XCircle, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyVerifications, submitVerification } from "@/lib/verify.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "实名 & 学生认证 · Pulse" },
      { name: "description", content: "提交实名认证或学生认证，获得认证徽章，提升匹配可信度。" },
    ],
  }),
  component: VerifyPage,
});

const KIND_META = {
  real: {
    title: "实人认证",
    icon: Shield,
    color: "from-mint to-brand",
    desc: "上传一张你手持身份证件、脸部清晰可见的自拍。审核通过后会获得「真人」徽章。",
    accept: "image/*",
    extraLabel: "备注（可选，例如你今天穿了什么）",
  },
  student: {
    title: "学生认证",
    icon: GraduationCap,
    color: "from-coral to-sun",
    desc: "上传一张能证明你在校生身份的图片（学生证 / 校园卡 / 学校邮箱截图）。",
    accept: "image/*",
    extraLabel: "学校名称（可选）",
  },
} as const;

type Kind = keyof typeof KIND_META;

function VerifyPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setAuthed(!!data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const fetchMine = useServerFn(getMyVerifications);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-verifications"],
    queryFn: () => fetchMine(),
    enabled: authed === true,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-3">
          <button onClick={() => navigate({ to: "/me" })} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-lg font-semibold tracking-tight">实名 & 学生认证</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-20 pt-5">
        {authed === false && (
          <div className="rounded-3xl border border-border bg-surface/60 p-6 text-center text-sm text-muted-foreground">
            请先<Link to="/auth" search={{ mode: "login" }} className="mx-1 text-coral underline">登录</Link>再进行认证
          </div>
        )}

        {authed === true && (
          <>
            <div className="rounded-3xl border border-coral/30 bg-gradient-to-r from-coral/15 via-sun/10 to-mint/15 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-coral" />
                <span className="font-display font-semibold">为什么要认证？</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                认证用户拥有徽章、在匹配中优先曝光、获得更多信任。资料仅用于人工审核，不会公开展示。
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {(["real", "student"] as Kind[]).map((k) => (
                <VerifyCard
                  key={k}
                  kind={k}
                  record={data?.[k] ?? null}
                  loading={isLoading}
                  onChanged={refetch}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function VerifyCard({
  kind, record, loading, onChanged,
}: {
  kind: Kind;
  record: { status: string; review_note: string | null; created_at: string; reviewed_at: string | null } | null;
  loading: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const submitFn = useServerFn(submitVerification);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extra, setExtra] = useState("");
  const [uploading, setUploading] = useState(false);

  const status = record?.status;
  const StatusBadge = () => {
    if (loading) return <span className="text-xs text-muted-foreground">加载中…</span>;
    if (status === "approved") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-[11px] text-mint">
        <CheckCircle2 className="h-3 w-3" /> 已通过
      </span>
    );
    if (status === "pending") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sun/20 px-2 py-0.5 text-[11px] text-sun">
        <Clock className="h-3 w-3" /> 审核中
      </span>
    );
    if (status === "rejected") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] text-destructive">
        <XCircle className="h-3 w-3" /> 未通过
      </span>
    );
    return <span className="text-[11px] text-muted-foreground">未提交</span>;
  };

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("请选择图片文件");
    if (file.size > 8 * 1024 * 1024) return toast.error("图片最大 8MB");

    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) throw new Error("请先登录");
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${uid}/verify/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      await submitFn({ data: { kind, storagePath: path, extra: extra || undefined } });
      toast.success("已提交，请等待人工审核（一般 24 小时内）");
      setExtra("");
      qc.invalidateQueries({ queryKey: ["my-verifications"] });
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "提交失败");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = status !== "approved" && status !== "pending";

  return (
    <div className="rounded-3xl border border-border bg-surface/60 p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${meta.color} text-background shadow`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold">{meta.title}</h3>
            <StatusBadge />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.desc}</p>
        </div>
      </div>

      {status === "rejected" && record?.review_note && (
        <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          审核备注：{record.review_note}
        </div>
      )}

      {canSubmit && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={meta.extraLabel}
            maxLength={200}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <input ref={fileRef} type="file" accept={meta.accept} className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-sun py-2.5 text-sm font-semibold text-background shadow disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {status === "rejected" ? "重新提交" : "上传凭证"}
          </button>
          <p className="text-[10px] text-muted-foreground">支持 JPG / PNG，最大 8MB，凭证仅用于审核。</p>
        </div>
      )}

      {status === "pending" && (
        <p className="mt-3 text-xs text-muted-foreground">已提交于 {new Date(record!.created_at).toLocaleString()}，审核中…</p>
      )}
      {status === "approved" && record?.reviewed_at && (
        <p className="mt-3 text-xs text-mint">已通过 · {new Date(record.reviewed_at).toLocaleDateString()}</p>
      )}
    </div>
  );
}