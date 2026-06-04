import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { SBTI_LIST, type SbtiPersonality } from "@/lib/sbti";

export const Route = createFileRoute("/games/sbti/select")({
  head: () => ({ meta: [{ title: "选择你的人格 · SBTI" }] }),
  component: SbtiSelectPage,
});

function SbtiSelectPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SBTI_LIST;
    return SBTI_LIST.filter(
      (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [query]);

  const selectedItem: SbtiPersonality | undefined = SBTI_LIST.find((p) => p.code === selected);

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground pb-32">
      <header className="sticky top-0 z-20 mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-6 pb-3 bg-background/80 backdrop-blur">
        <Link to="/games/sbti" className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回
        </Link>
        <h1 className="font-display text-lg font-semibold">选择你的人格</h1>
        <span className="w-12" />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索人格名称或代码"
            className="w-full rounded-full border border-border bg-surface/60 py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map((p) => {
            const isSel = selected === p.code;
            return (
              <button
                key={p.code}
                onClick={() => setSelected(p.code)}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  isSel ? "border-coral bg-coral/10 ring-2 ring-coral/40" : "border-border bg-surface/50 hover:border-foreground/30"
                }`}
              >
                {isSel && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-coral text-background">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div className="h-16 w-full rounded-xl mb-3" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}55)` }} />
                <div className="font-display text-base font-semibold tracking-tight">{p.code}</div>
                <div className="text-xs text-muted-foreground">{p.name}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.keywords.slice(0, 3).map((k) => (
                    <span key={k} className="rounded-full border border-border bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {k}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">没有找到匹配的人格</div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <button
            disabled={!selected}
            onClick={() => setConfirmOpen(true)}
            className="w-full rounded-full bg-gradient-to-r from-coral to-sun px-6 py-3.5 text-sm font-semibold text-background shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-none disabled:bg-muted disabled:text-muted-foreground"
          >
            {selected ? `确认选择 ${selected}` : "请选择一种人格"}
          </button>
        </div>
      </div>

      {confirmOpen && selectedItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-5 backdrop-blur" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div
              className="mx-auto h-24 w-24 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${selectedItem.color}, ${selectedItem.color}55)` }}
            />
            <div className="mt-4 font-display text-2xl font-semibold">{selectedItem.code}</div>
            <div className="text-sm text-muted-foreground">{selectedItem.name}</div>
            <p className="mt-4 text-sm leading-relaxed">
              你确定选择 <span className="font-semibold text-coral">{selectedItem.code} · {selectedItem.name}</span> 作为你的 SBTI 人格吗？
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm">
                返回修改
              </button>
              <button
                onClick={() => navigate({ to: "/games/sbti/result/$code", params: { code: selectedItem.code } })}
                className="flex-1 rounded-full bg-gradient-to-r from-coral to-sun px-4 py-2.5 text-sm font-semibold text-background"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}