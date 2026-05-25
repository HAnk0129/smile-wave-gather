import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Square, Play, Pause, Trash2, UploadCloud, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { saveVoiceCard, deleteVoiceCard } from "@/lib/videos.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/voice-card")({
  head: () => ({ meta: [{ title: "语音名片 · Pulse" }] }),
  component: VoiceCardPage,
});

const MAX_SEC = 60;

function VoiceCardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserId(data.session?.user.id ?? null);
    });
  }, []);

  const fetchMe = useServerFn(getMyProfile);
  const { data } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchMe(),
    enabled: authed === true,
  });
  const save = useServerFn(saveVoiceCard);
  const remove = useServerFn(deleteVoiceCard);

  const existing = (data?.profile as any)?.voice_card_url as string | null | undefined;
  const existingDur = (data?.profile as any)?.voice_card_duration as number | null | undefined;

  // recorder state
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [previewUrl]);

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setBlob(b);
        const url = URL.createObjectURL(b);
        setPreviewUrl(url);
        const dur = Math.max(1, Math.round((Date.now() - startTsRef.current) / 1000));
        setDuration(dur);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      startTsRef.current = Date.now();
      setElapsed(0);
      setBlob(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      mr.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startTsRef.current) / 1000);
        setElapsed(sec);
        if (sec >= MAX_SEC) stopRecord();
      }, 250);
    } catch (e: any) {
      toast.error("无法获取麦克风权限");
    }
  };

  const stopRecord = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
    mediaRef.current?.stop();
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const upload = async () => {
    if (!blob || !userId) return;
    setUploading(true);
    try {
      const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("voice-cards")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("voice-cards").getPublicUrl(path);
      await save({ data: { url: pub.publicUrl, durationSec: duration } });
      toast.success("语音名片已保存");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (e: any) {
      toast.error(e?.message ?? "保存失败");
    } finally {
      setUploading(false);
    }
  };

  const removeExisting = async () => {
    if (!confirm("确认删除当前语音名片?")) return;
    try {
      await remove();
      toast.success("已删除");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e: any) {
      toast.error(e?.message ?? "删除失败");
    }
  };

  if (authed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-center">
        <div className="mx-5 max-w-sm rounded-3xl border border-border bg-surface/70 p-8">
          <h2 className="font-display text-2xl font-semibold">先登录,再录语音</h2>
          <Link to="/auth" search={{ mode: "login" }} className="mt-4 inline-block rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-background">去登录</Link>
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[400px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--coral)_22%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/me" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> 我的
        </Link>
        <span className="text-xs text-muted-foreground">语音名片</span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-24 pt-6">
        <h1 className="font-display text-2xl font-semibold">用声音介绍自己</h1>
        <p className="mt-1 text-sm text-muted-foreground">最长 60 秒,会显示在你的资料卡上。</p>

        {/* Existing */}
        {existing && !blob && (
          <div className="mt-5 rounded-3xl border border-border bg-surface/70 p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">当前的语音名片</div>
            <audio src={existing} controls className="mt-3 w-full" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>时长 {existingDur ?? "?"}s</span>
              <button onClick={removeExisting} className="inline-flex items-center gap-1 text-destructive">
                <Trash2 className="h-4 w-4" /> 删除
              </button>
            </div>
          </div>
        )}

        {/* Recorder */}
        <div className="mt-5 rounded-3xl border border-border bg-surface/70 p-6 text-center">
          <div className="relative mx-auto h-44 w-44">
            {recording && [0, 1, 2].map((i) => (
              <div key={i} className="absolute inset-0 animate-ping rounded-full border-2 border-coral/40" style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
            <div className={`absolute inset-6 grid place-items-center rounded-full ${recording ? "bg-gradient-to-br from-coral to-sun" : "bg-gradient-to-br from-mint/40 to-coral/40"} text-background`}>
              <Mic className="h-14 w-14" />
            </div>
          </div>

          <div className="mt-4 font-display text-4xl tabular-nums">
            {recording ? `${mm}:${ss}` : blob ? `${Math.floor(duration / 60).toString().padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}` : `00:00`}
          </div>
          <div className="text-xs text-muted-foreground">最长 {MAX_SEC} 秒</div>

          {!recording && !blob && (
            <button onClick={startRecord} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-coral to-sun px-7 font-semibold text-background">
              <Mic className="h-4 w-4" /> 开始录制
            </button>
          )}
          {recording && (
            <button onClick={stopRecord} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-destructive px-7 font-semibold text-destructive-foreground">
              <Square className="h-4 w-4" /> 停止
            </button>
          )}
          {blob && previewUrl && (
            <>
              <audio ref={audioRef} src={previewUrl} onEnded={() => setPlaying(false)} className="hidden" />
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={togglePlay} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background/40 px-5 text-sm">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? "暂停" : "试听"}
                </button>
                <button
                  onClick={() => { setBlob(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background/40 px-5 text-sm text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" /> 重录
                </button>
              </div>
              <button
                onClick={upload}
                disabled={uploading}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-coral font-semibold text-background disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? "保存中…" : "保存为语音名片"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}