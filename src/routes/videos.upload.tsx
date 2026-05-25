import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, UploadCloud, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { publishShortVideo } from "@/lib/videos.functions";
import { toast } from "sonner";
import { track, Events } from "@/lib/analytics";

export const Route = createFileRoute("/videos/upload")({
  head: () => ({ meta: [{ title: "发布短视频 · Pulse" }] }),
  component: VideoUploadPage,
});

const MAX_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_DURATION = 90; // seconds

function VideoUploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const submit = useServerFn(publishShortVideo);

  const onPick = (f: File) => {
    if (!f.type.startsWith("video/")) {
      toast.error("请选择视频文件");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("视频不能大于 60MB");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setDuration(null);
    setSize(null);
  };

  const onMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setDuration(Math.round(v.duration));
    setSize({ w: v.videoWidth, h: v.videoHeight });
  };

  const onPublish = async () => {
    if (!file || !userId) return;
    if (duration && duration > MAX_DURATION) {
      toast.error(`视频不能超过 ${MAX_DURATION} 秒`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("short-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("short-videos").getPublicUrl(path);
      await submit({
        data: {
          videoUrl: pub.publicUrl,
          caption,
          durationSec: duration ?? undefined,
          width: size?.w,
          height: size?.h,
        },
      });
      track(Events.VideoUploaded, { duration: duration ?? null, size_bytes: file.size });
      toast.success("发布成功");
      navigate({ to: "/videos" });
    } catch (e: any) {
      toast.error(e?.message ?? "发布失败");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> 短视频
        </Link>
        <span className="text-xs text-muted-foreground">发布</span>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-6">
        <h1 className="font-display text-2xl font-semibold">分享一段 30 秒生活</h1>
        <p className="mt-1 text-sm text-muted-foreground">最长 90 秒,文件不超过 60MB。</p>

        <div className="mt-5">
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-surface/40 text-muted-foreground hover:text-foreground"
            >
              <UploadCloud className="h-10 w-10" />
              <div className="text-sm">点击选择视频</div>
              <div className="text-[11px] text-muted-foreground">MP4 / MOV · 竖屏效果更好</div>
            </button>
          ) : (
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-black">
              <video
                src={preview}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                playsInline
                onLoadedMetadata={onMeta}
              />
              <button
                onClick={() => { setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); }}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              {duration && (
                <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {duration}s · {size ? `${size.w}×${size.h}` : ""}
                </div>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          />
        </div>

        <div className="mt-5">
          <label className="text-xs text-muted-foreground">说点什么</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="给这条视频写一句话…"
            rows={3}
            className="mt-2 w-full rounded-2xl border border-border bg-surface/40 p-3 text-sm outline-none focus:border-coral"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{caption.length}/300</div>
        </div>

        <button
          onClick={onPublish}
          disabled={!file || uploading}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-coral to-sun font-semibold text-background disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {uploading ? "上传中…" : "发布"}
        </button>
      </main>
    </div>
  );
}