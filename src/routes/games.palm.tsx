import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Hand, Heart, Loader2, RefreshCw, Share2, Sparkles, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  getPalmQuota,
  revealPalm,
  verifyPalm,
  type PalmReport,
} from "@/lib/palm.functions";

export const Route = createFileRoute("/games/palm")({
  head: () => ({
    meta: [
      { title: "AI 看手相 · Pulse — 拍张手掌，读懂你的爱情线" },
      { name: "description", content: "上传手掌照片，Pulse AI 解读你的感情线、事业线与生命线，生成专属手相报告。" },
      { property: "og:title", content: "AI 看手相 · Pulse" },
      { property: "og:description", content: "拍张手掌，AI 为你解读爱情线。" },
    ],
  }),
  component: PalmPage,
});

type Report = PalmReport;
type Stage = "idle" | "share" | "report";

function PalmPage() {
  const verifyFn = useServerFn(verifyPalm);
  const revealFn = useServerFn(revealPalm);
  const quotaFn = useServerFn(getPalmQuota);

  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [readingId, setReadingId] = useState<string | null>(null);
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quota = useQuery({
    queryKey: ["palm-quota"],
    queryFn: () => quotaFn({}),
  });
  const remaining = quota.data?.remaining ?? 0;
  const limit = quota.data?.limit ?? 2;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const onFile = async (file: File) => {
    setError(null);
    setReport(null);
    const dataUrl = await compressImage(file, 1024, 0.85);
    setPreview(dataUrl);
  };

  const analyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const r = await verifyFn({ data: { imageDataUrl: preview } });
      setReadingId(r.readingId);
      setStage("share");
      void quota.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const reveal = async () => {
    if (!readingId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await revealFn({ data: { readingId } });
      setReport(r.preset);
      setStage("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "查看失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setReport(null);
    setError(null);
    setStage("idle");
    setReadingId(null);
    setShareConfirmed(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const outOfQuota = !quota.isLoading && remaining <= 0 && stage === "idle";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute top-10 -left-20 size-[420px] rounded-full bg-coral/30 blur-[120px]" />
      <div className="absolute top-32 right-0 size-[380px] rounded-full bg-sun/20 blur-[120px]" />

      <header className="relative sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/games" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="size-4" />
            返回游戏库
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-coral/15 flex items-center justify-center">
              <Hand className="size-3.5 text-coral" />
            </div>
            <span className="font-display font-bold text-sm">AI 看手相</span>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-4xl px-6 pt-8 md:pt-10 pb-20">
        {stage === "idle" && (
          <div className="relative rounded-[32px] border border-border bg-surface/70 backdrop-blur p-5 md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-coral" />
                  <span>Powered by Pulse AI · 仅供娱乐 · 每人 {limit} 次</span>
                </div>
                <h1 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[0.98]">
                  上传手掌，马上开始
                  <span className="font-serif-display italic text-gradient-hero"> AI 看手相</span>
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  剩余测试机会：<span className="font-bold text-foreground">{remaining}/{limit}</span> ·
                  分享到朋友圈解锁结果
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 md:gap-8 items-center">
              <UploadZone
                preview={preview}
                onSelect={() => inputRef.current?.click()}
                onClear={reset}
              />
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />

              <div>
                <h3 className="font-display font-bold text-lg mb-3">拍照小贴士</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <Tip>张开手掌，五指自然分开</Tip>
                  <Tip>光线均匀，避免强烈阴影</Tip>
                  <Tip>整只手掌清晰入镜即可</Tip>
                  <Tip>左右手皆可，传统看左手</Tip>
                </ul>

                <button
                  onClick={analyze}
                  disabled={!preview || loading || outOfQuota}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold glow-coral hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      正在识别手掌…
                    </>
                  ) : outOfQuota ? (
                    <>已用完 {limit} 次机会</>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      开始识别手相
                    </>
                  )}
                </button>

                {error && (
                  <p className="mt-4 text-sm text-coral text-center">{error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === "share" && preview && (
          <ShareGate
            preview={preview}
            confirmed={shareConfirmed}
            onConfirm={() => setShareConfirmed(true)}
            onReveal={reveal}
            loading={loading}
            error={error}
          />
        )}

        {stage === "report" && report && preview && (
          <ReportView report={report} preview={preview} onReset={reset} />
        )}
      </section>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 size-1.5 rounded-full bg-mint shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function UploadZone({
  preview,
  onSelect,
  onClear,
}: {
  preview: string | null;
  onSelect: () => void;
  onClear: () => void;
}) {
  if (preview) {
    return (
      <div className="relative aspect-square rounded-3xl overflow-hidden border border-border group">
        <img src={preview} alt="手掌预览" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-background/80 backdrop-blur border border-border text-xs font-semibold hover:bg-background transition"
          >
            <RefreshCw className="size-3.5" />
            换一张
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-background/80 backdrop-blur border border-border text-xs hover:bg-background transition"
          >
            移除
          </button>
        </div>
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-coral/30 rounded-3xl" />
        <PalmLines />
      </div>
    );
  }
  return (
    <button
      onClick={onSelect}
      className="relative aspect-square w-full rounded-3xl border-2 border-dashed border-border bg-surface-2/40 hover:bg-surface-2/70 hover:border-coral/50 transition flex flex-col items-center justify-center gap-3 group"
    >
      <div className="size-16 rounded-2xl bg-coral/15 flex items-center justify-center group-hover:scale-110 transition">
        <Hand className="size-7 text-coral" />
      </div>
      <div className="text-center">
        <div className="font-semibold">上传 / 拍摄手掌</div>
        <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
          <Upload className="size-3" />
          点击选择照片
        </div>
      </div>
    </button>
  );
}

function PalmLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-50 mix-blend-screen" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pl1" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 22)" />
          <stop offset="100%" stopColor="oklch(0.87 0.16 88)" />
        </linearGradient>
      </defs>
      <path d="M10 35 Q 40 30 70 50" stroke="url(#pl1)" strokeWidth="0.4" fill="none" className="animate-pulse" />
      <path d="M15 55 Q 30 75 55 90" stroke="oklch(0.78 0.15 165)" strokeWidth="0.4" fill="none" />
      <path d="M25 25 Q 45 50 50 90" stroke="oklch(0.87 0.16 88)" strokeWidth="0.3" fill="none" />
    </svg>
  );
}

function ReportView({
  report,
  preview,
  onReset,
}: {
  report: Report;
  preview: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative rounded-[32px] border border-border bg-surface/70 backdrop-blur overflow-hidden">
        <div className="grid md:grid-cols-[200px_1fr] gap-6 p-6 md:p-8">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border">
            <img src={preview} alt="手掌" className="w-full h-full object-cover" />
            <PalmLines />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-coral font-semibold">Pulse 手相报告</span>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold leading-snug">
              "{report.overall}"
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {report.fortune}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <LineCard color="coral" icon={Heart} label="感情线" data={report.love} />
        <LineCard color="sun" icon={Zap} label="事业线" data={report.career} />
        <LineCard color="mint" icon={Sparkles} label="生命线" data={report.life} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-border bg-surface/60 p-6">
          <div className="text-xs uppercase tracking-wider text-mint font-semibold mb-2">缘分提示</div>
          <p className="text-sm leading-relaxed">{report.matchHint}</p>
        </div>
        <div className="rounded-3xl border border-dashed border-border bg-surface/30 p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">温馨提示</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.warning}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onReset}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-border bg-surface hover:bg-surface-2 transition text-sm font-semibold"
        >
          <RefreshCw className="size-4" />
          再测一次
        </button>
        <Link
          to="/discover"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold glow-coral hover:scale-[1.01] transition"
        >
          <Heart className="size-4" />
          去匹配同频的人
        </Link>
      </div>
    </div>
  );
}

function ShareGate({
  preview,
  confirmed,
  onConfirm,
  onReveal,
  loading,
  error,
}: {
  preview: string;
  confirmed: boolean;
  onConfirm: () => void;
  onReveal: () => void;
  loading: boolean;
  error: string | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    // Render a simple share card on a canvas and trigger download
    const canvas = document.createElement("canvas");
    const W = 750;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0e0e12");
    grad.addColorStop(1, "#1a1216");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // load palm preview
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = preview;
    }).catch(() => null);
    if (img) {
      const size = 500;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect((W - size) / 2, 200, size, size, 36);
      ctx.clip();
      ctx.drawImage(img, (W - size) / 2, 200, size, size);
      ctx.restore();
    }
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 28px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PULSE · AI 手相", W / 2, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 56px -apple-system, system-ui, sans-serif";
    ctx.fillText("我的专属手相报告", W / 2, 170);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "400 26px -apple-system, system-ui, sans-serif";
    ctx.fillText("扫描朋友圈，揭晓我的爱情线", W / 2, 770);
    ctx.fillText("· 上 Pulse · AI 看手相 ·", W / 2, 820);
    ctx.fillStyle = "#ffd166";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText("分享后解锁你的完整运势", W / 2, 900);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "palm-share.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("已保存到本地，去朋友圈分享吧～");
    }, "image/png");
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative rounded-[32px] border border-border bg-surface/70 backdrop-blur p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-mint/15 text-mint px-3 py-1.5 text-xs font-semibold">
            <Check className="size-3.5" />
            手掌识别成功
          </div>
          <h2 className="mt-4 font-display text-2xl md:text-3xl font-bold">
            分享到朋友圈，解锁你的手相报告
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            保存下方卡片 → 发到朋友圈 → 回来点击「已分享，查看结果」
          </p>
        </div>

        <div
          ref={cardRef}
          className="mx-auto max-w-sm rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-coral/20 via-background to-sun/15 p-6"
        >
          <div className="text-coral text-xs font-bold tracking-widest">PULSE · AI 手相</div>
          <h3 className="mt-1 font-display text-xl font-bold">我的专属手相报告已生成</h3>
          <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden border border-border">
            <img src={preview} alt="手掌" className="w-full h-full object-cover" />
            <PalmLines />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            扫描朋友圈，揭晓你的爱情线 · 事业线 · 生命线
          </div>
          <div className="mt-2 font-serif-display italic text-sm text-foreground">
            "分享后解锁你的完整运势 ✨"
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <button
            onClick={downloadCard}
            className="inline-flex items-center justify-center gap-2 h-12 rounded-full border border-border bg-surface hover:bg-surface-2 transition text-sm font-semibold"
          >
            <Share2 className="size-4" />
            保存卡片图片
          </button>
          {!confirmed ? (
            <button
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-mint text-background hover:scale-[1.01] transition text-sm font-semibold"
            >
              <Check className="size-4" />
              我已分享朋友圈
            </button>
          ) : (
            <button
              onClick={onReveal}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground glow-coral hover:scale-[1.01] transition text-sm font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              查看我的手相结果
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-coral text-center">{error}</p>}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          诚信小提示：分享是给小伙伴一起玩的福利，不分享也能查看，但会少点仪式感～
        </p>
      </div>
    </div>
  );
}

function LineCard({
  color,
  icon: Icon,
  label,
  data,
}: {
  color: "coral" | "sun" | "mint";
  icon: typeof Heart;
  label: string;
  data: { score: number; line: string; comment: string };
}) {
  const score = Math.max(0, Math.min(100, Math.round(data.score ?? 0)));
  return (
    <div className="relative rounded-3xl border border-border bg-surface/60 p-6 overflow-hidden">
      <div
        className="absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-30"
        style={{ background: `var(--${color})` }}
      />
      <div className="relative flex items-center justify-between mb-4">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: `color-mix(in oklab, var(--${color}) 18%, transparent)`,
            color: `var(--${color})`,
          }}
        >
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className="font-display text-3xl font-bold" style={{ color: `var(--${color})` }}>
          {score}
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-border overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: `var(--${color})` }}
        />
      </div>
      <div className="relative font-semibold text-sm mb-1.5">{data.line}</div>
      <p className="relative text-xs text-muted-foreground leading-relaxed">{data.comment}</p>
    </div>
  );
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}