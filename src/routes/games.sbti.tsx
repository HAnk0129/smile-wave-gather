import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { SBTI_TEST_URL } from "@/lib/sbti";

export const Route = createFileRoute("/games/sbti")({
  head: () => ({
    meta: [
      { title: "SBTI 趣味人格测试 · Pulse" },
      { name: "description", content: "测测你的抽象社交人格，解锁专属铭牌与限定装扮。" },
    ],
  }),
  component: SbtiLayout,
});

function SbtiLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/games/sbti") return <Outlet />;
  return <SbtiIntro />;
}

function SbtiIntro() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tested, setTested] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--coral)_22%,transparent),transparent)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-6">
        <Link to="/games" className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回小游戏
        </Link>
        <span className="text-xs text-muted-foreground">SBTI 人格</span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-24 pt-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-coral/30 via-sun/20 to-mint/20">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-background/80 text-coral shadow-xl backdrop-blur">
                <Sparkles className="h-10 w-10" />
              </div>
              <div className="mt-4 font-display text-lg text-background/90 bg-foreground/80 inline-block px-3 py-1 rounded-full">趣味人格 · 限定铭牌</div>
            </div>
          </div>
        </div>

        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">测测你的抽象社交人格</h1>
        <p className="mt-2 text-sm text-muted-foreground">解锁专属铭牌与限定装扮</p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate({ to: "/games/sbti/select" })}
            className="w-full rounded-full bg-gradient-to-r from-coral to-sun px-6 py-4 text-sm font-semibold text-background shadow-lg"
          >
            我已经了解自己的人格类型
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full rounded-full border border-border bg-surface px-6 py-4 text-sm font-medium text-foreground hover:bg-surface/70"
          >
            我还不清楚，去在线测试
          </button>
          {tested && (
            <button
              onClick={() => navigate({ to: "/games/sbti/select" })}
              className="w-full rounded-full border border-mint/40 bg-mint/10 px-6 py-4 text-sm font-semibold text-mint hover:bg-mint/20"
            >
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 我已经完成测试，选择人格</span>
            </button>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">测试结果仅供娱乐</p>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-5 backdrop-blur" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold">前往在线测试</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              即将跳转至外部 SBTI 测试页面。完成测试后，请返回本页面并选择与你结果一致的人格类型。
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm">
                暂不测试
              </button>
              <a
                href={SBTI_TEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setTested(true); setModalOpen(false); }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-sun px-4 py-2.5 text-sm font-semibold text-background"
              >
                前往测试 <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}