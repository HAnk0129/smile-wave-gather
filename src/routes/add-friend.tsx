import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, UserPlus, QrCode, ScanLine, Loader2, MessageCircle, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  searchUsersByNickname,
  lookupUserById,
  startConversation,
} from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

type Tab = "search" | "qr" | "scan";
type SearchParams = { tab?: Tab };

export const Route = createFileRoute("/add-friend")({
  head: () => ({ meta: [{ title: "添加好友 · Pulse" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    tab: (["search", "qr", "scan"] as const).includes(s.tab as never)
      ? (s.tab as Tab)
      : undefined,
  }),
  component: AddFriendPage,
});

function AddFriendPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(search.tab ?? "search");
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  if (me === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <p className="text-sm text-muted-foreground">请先登录再添加好友</p>
          <Link
            to="/auth"
            search={{ mode: "login" }}
            className="mt-4 inline-block rounded-[10px] bg-coral px-4 py-2 text-sm font-semibold text-background"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate({ to: "/messages" })}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-semibold">添加好友</h1>
        </div>
        <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-1 px-4 pb-3">
          <TabBtn active={tab === "search"} onClick={() => setTab("search")} icon={<Search className="h-4 w-4" />} label="搜昵称" />
          <TabBtn active={tab === "qr"} onClick={() => setTab("qr")} icon={<QrCode className="h-4 w-4" />} label="我的码" />
          <TabBtn active={tab === "scan"} onClick={() => setTab("scan")} icon={<ScanLine className="h-4 w-4" />} label="扫一扫" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
        {tab === "search" && <SearchPanel />}
        {tab === "qr" && <QrPanel userId={me} />}
        {tab === "scan" && <ScanPanel />}
      </main>
    </div>
  );
}

function TabBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
        active
          ? "bg-coral text-background shadow-sm"
          : "border border-border bg-surface/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ----------------------- 搜昵称 ----------------------- */
function SearchPanel() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const searchFn = useServerFn(searchUsersByNickname);
  const { data, isFetching } = useQuery({
    queryKey: ["search-users", submitted],
    queryFn: () => searchFn({ data: { q: submitted } }),
    enabled: submitted.length > 0,
  });

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(q.trim()); }}
        className="flex items-center gap-2 rounded-full border border-border px-3 py-2"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="输入对方昵称"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-background disabled:opacity-50"
          disabled={!q.trim()}
        >
          搜索
        </button>
      </form>

      <div className="mt-4">
        {!submitted && (
          <p className="px-2 text-center text-sm text-muted-foreground">
            输入昵称关键词，找到 ta 后即可发起聊天。
          </p>
        )}
        {submitted && isFetching && (
          <div className="space-y-2">
            {[0,1,2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface/50" />)}
          </div>
        )}
        {submitted && !isFetching && (data?.users.length ?? 0) === 0 && (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">没有找到「{submitted}」</p>
        )}
        <ul className="space-y-2">
          {(data?.users ?? []).map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function UserRow({
  user,
}: { user: { id: string; nickname: string; city: string | null; signature: string | null; avatar: string | null } }) {
  const navigate = useNavigate();
  const startFn = useServerFn(startConversation);
  const mut = useMutation({
    mutationFn: () => startFn({ data: { partnerId: user.id, source: "match" } }),
    onSuccess: ({ id }) => {
      toast.success(`已和 ${user.nickname} 建立对话`);
      navigate({ to: "/chat", search: { conv: id, name: user.nickname, from: "match" } });
    },
    onError: (e: any) => toast.error(e?.message ?? "发起对话失败"),
  });
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface/40 px-3 py-3">
      {user.avatar ? (
        <img src={user.avatar} alt={user.nickname} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border" />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-coral to-sun font-display text-lg text-background">
          {user.nickname.slice(0,1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-semibold">{user.nickname}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[user.city, user.signature].filter(Boolean).join(" · ") || "Pulse 用户"}
        </div>
      </div>
      <button
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
        className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
      >
        {mut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageCircle className="h-3 w-3" />}
        打招呼
      </button>
    </li>
  );
}

/* ----------------------- 我的二维码 ----------------------- */
function QrPanel({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/add-friend?tab=scan&uid=${userId}`
    : `/add-friend?tab=scan&uid=${userId}`;
  const payload = `pulse:user:${userId}`;
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-surface/80 to-surface/30 p-6 text-center">
      <p className="text-xs text-muted-foreground">让朋友扫一扫，立即加你为好友</p>
      <div className="mt-4 inline-block rounded-2xl bg-white p-4 shadow-sm">
        <QRCodeSVG value={payload} size={200} level="M" />
      </div>
      <div className="mt-4 text-[11px] text-muted-foreground break-all px-4">{payload}</div>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("链接已复制，发给好友即可");
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast.error("复制失败");
          }
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-sm text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
        复制邀请链接
      </button>
    </div>
  );
}

/* ----------------------- 扫一扫 ----------------------- */
function ScanPanel() {
  const navigate = useNavigate();
  const containerId = "qr-reader-box";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [foundUser, setFoundUser] = useState<{
    id: string; nickname: string; city: string | null; signature: string | null; avatar: string | null;
  } | null>(null);

  const lookupFn = useServerFn(lookupUserById);
  const startFn = useServerFn(startConversation);

  // Auto-handle ?uid=... when arriving from a shared link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    if (uid) handleId(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parsePayload(raw: string): string | null {
    const s = raw.trim();
    const m1 = s.match(/^pulse:user:([0-9a-fA-F-]{36})$/);
    if (m1) return m1[1];
    const m2 = s.match(/[?&]uid=([0-9a-fA-F-]{36})/);
    if (m2) return m2[1];
    if (/^[0-9a-fA-F-]{36}$/.test(s)) return s;
    return null;
  }

  async function handleId(rawOrId: string) {
    const id = parsePayload(rawOrId);
    if (!id) { toast.error("无法识别的二维码"); return; }
    try {
      const { user } = await lookupFn({ data: { id } });
      setFoundUser(user);
      stopScan();
    } catch (e: any) {
      toast.error(e?.message ?? "查找用户失败");
    }
  }

  async function startScan() {
    setFoundUser(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const inst = new Html5Qrcode(containerId);
      scannerRef.current = inst;
      setScanning(true);
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => { handleId(decoded); },
        () => {},
      );
    } catch (e: any) {
      setScanning(false);
      toast.error(e?.message ?? "无法启动摄像头，可手动输入 ID");
    }
  }

  async function stopScan() {
    const inst = scannerRef.current;
    if (inst) {
      try { await inst.stop(); await inst.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  useEffect(() => () => { stopScan(); }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-surface/40 p-4">
        <div
          id={containerId}
          ref={containerRef}
          className="mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black/60"
        />
        <div className="mt-3 flex justify-center">
          {!scanning ? (
            <button
              onClick={startScan}
              className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-background"
            >
              <ScanLine className="h-4 w-4" /> 开始扫描
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-sm"
            >
              停止扫描
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          需要授权摄像头；浏览器不支持时请使用下方手动输入。
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-4">
        <p className="text-xs text-muted-foreground">手动添加（粘贴邀请链接或 用户 ID）</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="pulse:user:xxxx 或 完整链接"
            className="flex-1 rounded-full border border-border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            onClick={() => handleId(manualId)}
            disabled={!manualId.trim()}
            className="rounded-full bg-coral px-3 py-2 text-xs font-semibold text-background disabled:opacity-50"
          >
            查找
          </button>
        </div>
      </div>

      {foundUser && (
        <div className="rounded-3xl border border-coral/40 bg-gradient-to-br from-coral/10 to-sun/10 p-4">
          <div className="flex items-center gap-3">
            {foundUser.avatar ? (
              <img src={foundUser.avatar} alt={foundUser.nickname} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-coral to-sun font-display text-xl text-background">
                {foundUser.nickname.slice(0,1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base font-semibold">{foundUser.nickname}</div>
              <div className="truncate text-xs text-muted-foreground">
                {[foundUser.city, foundUser.signature].filter(Boolean).join(" · ") || "Pulse 用户"}
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const { id } = await startFn({ data: { partnerId: foundUser.id, source: "match" } });
                  toast.success("已建立对话");
                  navigate({ to: "/chat", search: { conv: id, name: foundUser.nickname, from: "match" } });
                } catch (e: any) {
                  toast.error(e?.message ?? "发起对话失败");
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-background"
            >
              <UserPlus className="h-3 w-3" /> 加为好友
            </button>
          </div>
        </div>
      )}
    </div>
  );
}