import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, ExternalLink, MapPin, Sparkles, Trophy, User } from "lucide-react";
import { getContest } from "@/lib/contests.functions";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/contests/$contestId")({
  head: () => ({
    meta: [
      { title: "比赛详情 · Pulse" },
      { name: "description", content: "查看比赛公告的完整信息与报名方式。" },
    ],
  }),
  component: ContestDetailPage,
});

function ContestDetailPage() {
  const { contestId } = Route.useParams();
  const router = useRouter();
  const fetch = useServerFn(getContest);
  const { data, isLoading } = useQuery({
    queryKey: ["contest", contestId],
    queryFn: () => fetch({ data: { id: contestId } }),
  });
  const c = data?.contest;
  const vsMatch = c?.title.match(/^(.+?)\s*(?:vs|VS|对|对阵)\s*(.+)$/);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3 backdrop-blur">
        <button onClick={() => router.history.back()} className="rounded-full p-1.5 hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-base font-semibold">比赛详情</h1>
      </div>

      {isLoading && <p className="px-5 py-8 text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && !c && (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          公告不存在或已被删除。
          <div className="mt-3">
            <Link to="/contests" className="text-coral">返回列表</Link>
          </div>
        </div>
      )}

      {c && (
        <article className="mx-auto max-w-3xl px-5">
          <div className="relative mt-3 h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-coral/40 via-sun/20 to-mint/20">
            {c.cover && (
              <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            )}
            <span className="absolute left-4 top-4 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium">
              {c.category}
            </span>
          </div>

          <div className="mt-5">
            {vsMatch ? (
              <div className="flex items-stretch gap-4">
                <div className="flex-1 text-right">
                  <p className="font-display text-xl font-bold leading-tight">{vsMatch[1]}</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="vs-badge rounded-2xl px-4 py-2 text-lg">VS</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display text-xl font-bold leading-tight">{vsMatch[2]}</p>
                </div>
              </div>
            ) : (
              <h2 className="font-display text-2xl font-bold">{c.title}</h2>
            )}
            {c.summary && (
              <p className="mt-3 text-center text-sm text-muted-foreground">{c.summary}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {c.location && <InfoTile icon={<MapPin className="h-4 w-4" />} label="地点" value={c.location} />}
            {c.starts_at && <InfoTile icon={<Calendar className="h-4 w-4" />} label="开始时间" value={fmtFull(c.starts_at)} />}
            {c.deadline && <InfoTile icon={<Calendar className="h-4 w-4" />} label="报名截止" value={fmtFull(c.deadline)} />}
            {c.prize && <InfoTile icon={<Sparkles className="h-4 w-4" />} label="奖品" value={c.prize} />}
            {c.organizer && <InfoTile icon={<Trophy className="h-4 w-4" />} label="主办方" value={c.organizer} />}
            {c.contact && <InfoTile icon={<User className="h-4 w-4" />} label="联系方式" value={c.contact} />}
          </div>

          {c.description && (
            <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-4">
              <h3 className="mb-2 font-display text-sm font-semibold">详细介绍</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{c.description}</p>
            </section>
          )}

          {c.register_url && (
            <a
              href={c.register_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-coral to-sun py-3.5 font-display text-sm font-semibold text-background shadow-lg shadow-coral/30"
            >
              立即报名 <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </article>
      )}

      <BottomNav active="explore" />
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function fmtFull(s: string) {
  try {
    return new Date(s).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}