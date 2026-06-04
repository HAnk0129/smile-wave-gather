import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Share2, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getSbti } from "@/lib/sbti";

export const Route = createFileRoute("/games/sbti/share/$code")({
  head: ({ params }) => ({ meta: [{ title: `分享海报 · ${params.code}` }] }),
  component: SharePage,
});

function genInvite() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function SharePage() {
  const { code } = Route.useParams();
  const p = getSbti(code);
  const nickname = "你"; // mock
  const invite = genInvite();

  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <Link to="/games/sbti/select" className="text-coral underline">人格不存在，去重新选择</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/games/sbti/result/$code" params={{ code }} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-base font-semibold">分享海报</h1>
        <span className="w-9" />
      </header>

      <main className="mx-auto w-full max-w-md px-5 pt-4">
        {/* 海报预览 */}
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-2xl"
          style={{ background: `linear-gradient(160deg, ${p.color}, #0b0b14 80%)` }}
        >
          <div className="flex items-center justify-between text-xs text-background/80">
            <span>@{nickname} 的人格铭牌</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5">Pulse · SBTI</span>
          </div>

          <div className="mt-6 grid h-28 w-28 mx-auto place-items-center rounded-3xl bg-background/25 backdrop-blur">
            <Sparkles className="h-12 w-12 text-background drop-shadow" />
          </div>

          <div className="mt-5 text-center">
            <div className="font-display text-5xl font-bold tracking-tight text-background drop-shadow">{p.code}</div>
            <div className="mt-1 text-base font-medium text-background/95">{p.name}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {p.keywords.map((k) => (
                <span key={k} className="rounded-full bg-background/25 px-2.5 py-1 text-[11px] text-background">#{k}</span>
              ))}
            </div>
            <p className="mt-5 text-sm italic text-background/95">「{p.summary}」</p>
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-background/20 pt-4 text-background/90">
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">邀请码</div>
              <div className="font-display text-xl font-bold tracking-widest">{invite}</div>
              <div className="mt-1 text-[10px] opacity-70">扫码加入，一起测人格</div>
            </div>
            <div className="h-20 w-20 rounded-lg bg-background/90 p-2">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#0b0b14 0% 25%, transparent 0% 50%)",
                  backgroundSize: "12px 12px",
                }}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          好友通过邀请链接完成注册并选择人格后，双方均可获得积分、经验值或装扮奖励。
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => toast.success("图片已保存")}
            className="rounded-full border border-border bg-surface px-3 py-3 text-xs"
          >
            <Download className="mx-auto mb-1 h-4 w-4" />
            保存图片
          </button>
          <button
            onClick={() => toast.success("分享链接已生成")}
            className="rounded-full bg-gradient-to-r from-coral to-sun px-3 py-3 text-xs font-semibold text-background"
          >
            <Share2 className="mx-auto mb-1 h-4 w-4" />
            分享好友
          </button>
          <button
            onClick={() => toast.success("链接已复制")}
            className="rounded-full border border-border bg-surface px-3 py-3 text-xs"
          >
            <Link2 className="mx-auto mb-1 h-4 w-4" />
            复制链接
          </button>
        </div>
      </main>
    </div>
  );
}