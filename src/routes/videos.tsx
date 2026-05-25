import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Play, Plus, Music2, Volume2, VolumeX, Trash2, MoreVertical, Flag } from "lucide-react";
import { listShortVideos, toggleVideoLike, deleteShortVideo, type ShortVideoFeedItem } from "@/lib/videos.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VideoCommentsSheet } from "@/components/VideoCommentsSheet";
import { ReportSheet } from "@/components/ReportSheet";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "短视频 · Pulse" },
      { name: "description", content: "在 Pulse 看陌生人的真实生活片段,30 秒读懂一个人。" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const list = useServerFn(listShortVideos);
  const { data, isLoading } = useQuery({
    queryKey: ["short-videos"],
    queryFn: () => list({ data: { scope: "all", limit: 20 } }),
    enabled: authed === true,
  });

  if (authed === false) {
    return (
      <Shell>
        <div className="grid place-items-center pt-32 text-center">
          <div className="mx-5 max-w-sm rounded-3xl border border-border bg-surface/70 p-8 backdrop-blur">
            <h2 className="font-display text-2xl font-semibold">登录后才能看短视频</h2>
            <Link to="/auth" search={{ mode: "login" }} className="mt-4 inline-block rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-background">去登录</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const items = data?.items ?? [];

  return (
    <Shell>
      <div className="relative h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll bg-black">
        {/* Top bar */}
        <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
          <button onClick={() => navigate({ to: "/community" })} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="pointer-events-none text-sm font-semibold text-white drop-shadow">短视频</div>
          <Link to="/videos/upload" className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-coral to-sun text-background shadow-lg">
            <Plus className="h-5 w-5" />
          </Link>
        </header>

        {isLoading && (
          <div className="grid h-full place-items-center text-white/70">加载中…</div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="grid h-full place-items-center px-8 text-center">
            <div>
              <Music2 className="mx-auto h-12 w-12 text-coral" />
              <h2 className="mt-4 font-display text-2xl font-semibold text-white">还没有人发布短视频</h2>
              <p className="mt-2 text-sm text-white/60">来做第一个分享 30 秒生活的人吧</p>
              <Link to="/videos/upload" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-sun px-5 py-2.5 text-sm font-semibold text-background">
                <Plus className="h-4 w-4" /> 发布短视频
              </Link>
            </div>
          </div>
        )}

        {items.map((v) => (
          <VideoCard key={v.id} v={v} />
        ))}
      </div>
    </Shell>
  );
}

function VideoCard({ v }: { v: ShortVideoFeedItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(v.liked_by_me);
  const [likes, setLikes] = useState(v.likes_count);
  const [comments, setComments] = useState(v.comments_count);
  const [openComments, setOpenComments] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const qc = useQueryClient();
  const like = useServerFn(toggleVideoLike);
  const remove = useServerFn(deleteShortVideo);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null)); }, []);

  // Autoplay when visible
  useEffect(() => {
    const el = cardRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.7) {
          vid.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          vid.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.7, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); } else { vid.pause(); setPlaying(false); }
  };

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try { await like({ data: { videoId: v.id, like: next } }); }
    catch (e: any) {
      setLiked(!next); setLikes((n) => n + (next ? -1 : 1));
      toast.error(e?.message ?? "操作失败");
    }
  };

  const onDelete = async () => {
    if (!confirm("确认删除这条短视频?")) return;
    try {
      await remove({ data: { id: v.id } });
      toast.success("已删除");
      qc.invalidateQueries({ queryKey: ["short-videos"] });
    } catch (e: any) {
      toast.error(e?.message ?? "删除失败");
    }
  };

  return (
    <div ref={cardRef} className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={v.video_url}
        poster={v.cover_url ?? undefined}
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Tap overlay shows play icon */}
      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 grid place-items-center bg-black/20">
          <Play className="h-16 w-16 text-white/90 drop-shadow-lg" />
        </button>
      )}

      {/* gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* right rail */}
      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5 text-white">
        <Link to="/me" className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-br from-coral to-sun font-display text-lg">
          {v.author.avatar
            ? <img src={v.author.avatar} alt="" className="h-full w-full object-cover" />
            : (v.author.nickname?.slice(0, 1) ?? "P")}
        </Link>
        <button onClick={onLike} className="flex flex-col items-center">
          <Heart className={`h-9 w-9 ${liked ? "fill-coral text-coral" : ""}`} />
          <span className="text-xs tabular-nums">{likes}</span>
        </button>
        <button className="flex flex-col items-center" onClick={() => setOpenComments(true)}>
          <MessageCircle className="h-9 w-9" />
          <span className="text-xs tabular-nums">{comments}</span>
        </button>
        <button onClick={() => setMuted((m) => !m)} className="flex flex-col items-center">
          {muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
          <span className="text-[10px]">{muted ? "静音" : "声音"}</span>
        </button>
        {me === v.author_id && (
          <button onClick={onDelete} className="flex flex-col items-center text-white/70">
            <Trash2 className="h-6 w-6" />
            <span className="text-[10px]">删除</span>
          </button>
        )}
        {me && me !== v.author_id && (
          <button onClick={() => setOpenReport(true)} className="flex flex-col items-center text-white/70">
            <Flag className="h-6 w-6" />
            <span className="text-[10px]">举报</span>
          </button>
        )}
      </div>

      {/* bottom info */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-8 text-white">
        <div className="font-display text-base font-semibold">@{v.author.nickname}{v.author.city ? ` · ${v.author.city}` : ""}</div>
        {v.caption && <p className="mt-1 line-clamp-3 text-sm text-white/90">{v.caption}</p>}
      </div>

      <VideoCommentsSheet
        open={openComments}
        onClose={() => setOpenComments(false)}
        videoId={v.id}
        me={me}
        onCountChange={(d) => setComments((n) => Math.max(0, n + d))}
      />
      <ReportSheet
        open={openReport}
        onClose={() => setOpenReport(false)}
        targetType="post"
        targetId={v.id}
        authorId={v.author_id}
      />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}