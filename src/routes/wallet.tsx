import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Crown, Gift, Plus, History, Sparkles, Loader2 } from "lucide-react";
import { getMyWallet, getMyLedger, topUpCoins, buyProPlan } from "@/lib/wallet.functions";
import { GIFT_CATALOG, TOPUP_PACKS, PRO_PLANS, isPro, findGift } from "@/lib/wallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "钱包 · Pulse" },
      { name: "description", content: "Pulse 心动币钱包：充值、送礼、订阅 Pulse Pro。" },
    ],
  }),
  component: WalletPage,
});

const KIND_LABEL: Record<string, string> = {
  topup: "充值",
  spend: "消费",
  gift_sent: "送出礼物",
  gift_received: "收到礼物",
  pro_sub: "订阅 Pulse Pro",
  refund: "退款",
  admin: "管理员调整",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${m}-${day} ${hh}:${mm}`;
}

function WalletPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"topup" | "pro" | "gifts" | "history">("topup");
  const [busy, setBusy] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const fetchWallet = useServerFn(getMyWallet);
  const fetchLedger = useServerFn(getMyLedger);
  const topup = useServerFn(topUpCoins);
  const buyPro = useServerFn(buyProPlan);

  const w = useQuery({ queryKey: ["wallet"], queryFn: () => fetchWallet(), enabled: authed === true });
  const ledger = useQuery({ queryKey: ["wallet-ledger"], queryFn: () => fetchLedger(), enabled: authed === true });

  // realtime: when wallet row updates
  useEffect(() => {
    if (authed !== true) return;
    const ch = supabase
      .channel("wallet-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => {
        qc.invalidateQueries({ queryKey: ["wallet"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [authed, qc]);

  const handleTopUp = async (amount: number) => {
    setBusy(`topup-${amount}`);
    try {
      await topup({ data: { amount } });
      toast.success(`充值成功 +${amount} 心动币`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
    } catch (e: any) { toast.error(e.message ?? "充值失败"); }
    finally { setBusy(null); }
  };

  const handleBuyPro = async (plan: "month" | "quarter" | "year") => {
    setBusy(`pro-${plan}`);
    try {
      const r = await buyPro({ data: { plan } });
      toast.success(`Pulse Pro 已开通至 ${new Date(r.proUntil).toLocaleDateString()}`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e: any) {
      toast.error(e.message?.includes("coins") ? "心动币不足，请先充值" : (e.message ?? "开通失败"));
    } finally { setBusy(null); }
  };

  if (authed === false) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center p-6 text-center">
        <div className="max-w-sm">
          <Coins className="mx-auto size-10 text-coral opacity-70" />
          <p className="mt-3 text-sm text-muted-foreground">登录后查看你的钱包</p>
        </div>
      </div>
    );
  }

  const coins = w.data?.coins ?? 0;
  const proUntil = w.data?.proUntil ?? null;
  const proActive = isPro(proUntil);

  return (
    <div className="min-h-dvh bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/85 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <button onClick={() => nav({ to: "/me" })} className="size-9 rounded-full hover:bg-muted/40 flex items-center justify-center">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-base font-semibold">钱包</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* balance card */}
        <section className="rounded-3xl p-5 bg-gradient-to-br from-coral via-sun/80 to-brand text-background shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs/none opacity-80">我的心动币</span>
            {proActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2 py-0.5 text-[11px]">
                <Crown className="size-3" /> Pulse Pro
              </span>
            )}
          </div>
          <div className="mt-2 flex items-end gap-2">
            <Coins className="size-7 mb-1" />
            <span className="font-display text-4xl font-bold">{coins.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px] opacity-80">
            {proActive
              ? `Pro 有效期至 ${new Date(proUntil!).toLocaleDateString()}`
              : "开通 Pulse Pro 解锁更多权益"}
          </p>
        </section>

        {/* tabs */}
        <nav className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-surface/40 p-1 text-xs">
          {[
            { k: "topup", l: "充值", i: Plus },
            { k: "pro", l: "Pro", i: Crown },
            { k: "gifts", l: "礼物", i: Gift },
            { k: "history", l: "明细", i: History },
          ].map(({ k, l, i: Ic }) => (
            <button
              key={k}
              onClick={() => setTab(k as any)}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl transition ${tab === k ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
            >
              <Ic className="size-3.5" /> {l}
            </button>
          ))}
        </nav>

        {/* topup */}
        {tab === "topup" && (
          <section className="grid grid-cols-2 gap-2.5">
            {TOPUP_PACKS.map((p) => (
              <button
                key={p.coins}
                disabled={busy === `topup-${p.coins}`}
                onClick={() => handleTopUp(p.coins)}
                className="rounded-2xl border border-border bg-card p-4 text-left hover:border-coral/60 active:scale-[0.99] transition disabled:opacity-60"
              >
                <div className="text-[11px] text-muted-foreground">{p.label}</div>
                <div className="mt-1 flex items-center gap-1 text-2xl font-display font-bold text-coral">
                  {busy === `topup-${p.coins}` && <Loader2 className="size-4 animate-spin" />}
                  +{p.coins}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">心动币 · 测试充值</div>
              </button>
            ))}
            <div className="col-span-2 mt-1 rounded-xl border border-dashed border-border/60 p-3 text-[11px] text-muted-foreground">
              当前为测试充值；接入真实支付（Stripe / 微信 / 支付宝）后此入口将替换为正式购买。
            </div>
          </section>
        )}

        {/* pro */}
        {tab === "pro" && (
          <section className="space-y-2">
            <div className="rounded-2xl border border-coral/40 bg-card p-4">
              <h3 className="font-display text-base font-semibold flex items-center gap-2">
                <Crown className="size-4 text-sun" /> Pulse Pro 会员权益
              </h3>
              <ul className="mt-2 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>• 每日额外 30 张滑卡 / 无限喜欢</li>
                <li>• 谁喜欢了你 · 列表可见</li>
                <li>• 高级筛选（学历 / 身高 / 兴趣）</li>
                <li>• 已读回执、消息撤回、专属徽章</li>
                <li>• 每月赠送 88 心动币</li>
              </ul>
            </div>
            <div className="grid gap-2">
              {PRO_PLANS.map((p) => (
                <button
                  key={p.plan}
                  disabled={busy === `pro-${p.plan}`}
                  onClick={() => handleBuyPro(p.plan)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-coral/60 transition disabled:opacity-60"
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="text-[11px] text-muted-foreground">{p.days} 天</div>
                  </div>
                  <div className="flex items-center gap-1 text-coral font-display font-bold">
                    {busy === `pro-${p.plan}` && <Loader2 className="size-4 animate-spin" />}
                    <Coins className="size-4" /> {p.coins}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* gifts catalog preview */}
        {tab === "gifts" && (
          <section className="grid grid-cols-3 gap-2">
            {GIFT_CATALOG.map((g) => (
              <div key={g.code} className="rounded-2xl border border-border bg-card p-3 text-center">
                <div className="text-3xl">{g.emoji}</div>
                <div className="mt-1 text-xs font-medium">{g.name}</div>
                <div className="mt-0.5 text-[11px] text-coral flex items-center justify-center gap-0.5">
                  <Coins className="size-3" /> {g.coins}
                </div>
              </div>
            ))}
            <p className="col-span-3 mt-2 text-[11px] text-muted-foreground text-center">
              在聊天页面点击 <Gift className="inline size-3" /> 送礼图标，向对方赠送
            </p>
          </section>
        )}

        {/* history */}
        {tab === "history" && (
          <section className="space-y-1.5">
            {ledger.isLoading && <div className="text-center text-sm text-muted-foreground py-8">加载中…</div>}
            {!ledger.isLoading && (ledger.data?.entries ?? []).length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <Sparkles className="size-8 mx-auto mb-2 opacity-30" />
                还没有流水
              </div>
            )}
            {(ledger.data?.entries ?? []).map((e: any) => {
              const gift = e.ref?.gift_code ? findGift(e.ref.gift_code) : null;
              return (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      {gift && <span>{gift.emoji}</span>}
                      {KIND_LABEL[e.kind] ?? e.kind}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{fmtDate(e.created_at)} · 余额 {e.balance_after}</div>
                  </div>
                  <div className={`font-display font-semibold text-sm ${e.delta > 0 ? "text-mint" : "text-coral"}`}>
                    {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}