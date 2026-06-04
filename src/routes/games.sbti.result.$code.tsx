import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Sparkles, Share2, RefreshCw, UserPlus, Gift } from "lucide-react";
import { toast } from "sonner";
import { getSbti } from "@/lib/sbti";

export const Route = createFileRoute("/games/sbti/result/$code")({
  head: ({ params }) => ({ meta: [{ title: `${params.code} · 我的 SBTI 人格` }] }),
  component: ResultPage,
});

function ResultPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const p = getSbti(code);
  const [equipped, setEquipped] = useState(false);

  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-muted-foreground">没有找到该人格</p>
          <Link to="/games/sbti/select" className="mt-3 inline-block text-coral underline">重新选择</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link to="/games/sbti" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-base font-semibold">我的人格结果</h1>
        <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-4">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-center"
          style={{ background: `linear-gradient(160deg, ${p.color}, ${p.color}66 60%, transparent)` }}
        >
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-background/30 backdrop-blur">
            <Sparkles className="h-12 w-12 text-background drop-shadow" />
          </div>
          <div className="mt-5 font-display text-4xl font-bold tracking-tight text-background drop-shadow">{p.code}</div>
          <div className="mt-1 text-lg font-medium text-background/95">{p.name}</div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {p.keywords.map((k) => (
              <span key={k} className="rounded-full bg-background/30 px-2.5 py-1 text-[11px] text-background backdrop-blur">
                #{k}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface/60 p-5">
          <p className="text-sm leading-relaxed text-foreground/90">「{p.summary}」</p>
        </div>

        <div className="mt-5 rounded-2xl border border-coral/30 bg-gradient-to-br from-coral/10 to-sun/10 p-5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-coral" />
            <div className="font-display text-sm font-semibold">你已解锁专属奖励</div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">限定虚拟人物服装</div>
            <div className="flex flex-wrap gap-1.5">
              {p.outfit.map((o) => (
                <span key={o} className="rounded-full border border-coral/40 bg-background/40 px-2.5 py-1 text-xs text-coral">{o}</span>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">专属人格铭牌</div>
            <div className="inline-block rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">{p.badge}</div>
          </div>
        </div>

        <button
          onClick={() => { setEquipped(true); toast.success("装备成功"); }}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-coral to-sun px-6 py-3.5 text-sm font-semibold text-background shadow-lg"
        >
          {equipped ? "已装备到个人主页 ✓" : "立即装备到个人主页"}
        </button>

        {equipped && (
          <div className="mt-3 rounded-2xl border border-mint/40 bg-mint/10 p-4 text-center text-xs text-mint">
            模拟形象已更新：戴着{p.outfit[0]}，挂着 {p.badge} 的你
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate({ to: "/games/sbti/share/$code", params: { code: p.code } })}
            className="rounded-full border border-border bg-surface px-3 py-2.5 text-xs"
          >
            <Share2 className="mx-auto mb-0.5 h-3.5 w-3.5" />
            生成海报
          </button>
          <button
            onClick={() => { toast.success("邀请链接已复制"); }}
            className="rounded-full border border-border bg-surface px-3 py-2.5 text-xs"
          >
            <UserPlus className="mx-auto mb-0.5 h-3.5 w-3.5" />
            邀请测试
          </button>
          <button
            onClick={() => navigate({ to: "/games/sbti/select" })}
            className="rounded-full border border-border bg-surface px-3 py-2.5 text-xs"
          >
            <RefreshCw className="mx-auto mb-0.5 h-3.5 w-3.5" />
            重新选择
          </button>
        </div>
      </main>
    </div>
  );
}