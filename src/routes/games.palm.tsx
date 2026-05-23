import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowLeft, Hand, Heart, Loader2, RefreshCw, Sparkles, Upload, Zap } from "lucide-react";
import { readPalm } from "@/lib/palm.functions";

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

type Report = Awaited<ReturnType<typeof readPalm>>;

function PalmPage() {
  const fn = useServerFn(readPalm);
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setError(null);
    setReport(null);
    // Downscale for payload size
    const dataUrl = await compressImage(file, 1024, 0.85);
    setPreview(dataUrl);
  };

  const analyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fn({ data: { imageDataUrl: preview } });
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setReport(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

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

      <section className="relative mx-auto max-w-3xl px-6 pt-12 md:pt-16 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-coral" />
          <span>Powered by Pulse AI · 仅供娱乐</span>
        </div>
        <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold tracking-tight leading-[0.98]">
          拍张<span className="font-serif-display italic text-gradient-hero">手掌</span>，
          <br className="md:hidden" />
          看看你的爱情线。
        </h1>
        <p className="mt-5 max-w-lg mx-auto text-muted-foreground leading-relaxed">
          AI 会解读你的感情线、事业线与生命线，生成一份独家手相报告——可与心动对象互换查看缘分契合度。
        </p>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-20">
        {!report && (
          <div className="relative rounded-[32px] border border-border bg-surface/70 backdrop-blur p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
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
                  disabled={!preview || loading}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold glow-coral hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      AI 解读中…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      开始解读手相
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

        {report && preview && (
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