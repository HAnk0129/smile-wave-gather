import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Shield, Users, MessageSquare, Flag, AlertTriangle, FileText, Trees,
  Search, RefreshCw, Trash2, ImageIcon, Video as VideoIcon, Mic,
  ShieldCheck, CheckCircle2, XCircle, KeyRound, UserPlus, X, School, Copy, Check,
  BadgeCheck, GraduationCap, Wallet, Gift, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  claimFirstAdmin, getAdminStats, getAdminCharts,
  adminListUsers, adminListMessages, adminListReports, adminUpdateReport,
  adminListTreehole, adminListPosts, adminDeleteMessage,
  adminListPhotoQueue, adminReviewPhoto, adminReviewPost, adminReviewTreehole,
  adminModerationSummary,
  adminListRoleMembers, adminFindUser, adminAssignRole, adminRevokeRole,
  adminListShortVideos, adminReviewShortVideo,
  adminListVideoComments, adminDeleteVideoComment,
  adminWalletOverview, adminListGifts, adminListLedger,
} from "@/lib/admin.functions";
import {
  adminListCampuses, adminCreateCampus, adminListCampusInvites,
  createCampusInvite,
} from "@/lib/campus.functions";
import { adminListVerifications, adminReviewVerification } from "@/lib/verify.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "员工内部后台 · Pulse" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab =
  | "overview" | "moderation" | "users" | "messages" | "reports"
  | "treehole" | "posts" | "videos" | "wallet" | "verify" | "roles" | "campuses";

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      setUserId(s?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 直接走浏览器端 supabase 查询,避免 serverFn 冷启动延迟
  const { data: roleData, isLoading: roleLoading, refetch: refetchRole } = useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      if (!userId) return { isAdmin: false };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return { isAdmin: !!data };
    },
    enabled: authed === true && !!userId,
  });

  if (authed === false) return <Gate title="请先登录" subtitle="员工内部后台需要登录账号" cta={<Link to="/auth" className="rounded-lg bg-coral px-5 py-2.5 text-white">去登录</Link>} />;
  if (authed === null || roleLoading) return <Gate title="加载中…" />;
  if (!roleData?.isAdmin) return <ClaimAdmin onClaimed={() => refetchRole()} />;

  return <AdminConsole />;
}

function Gate({ title, subtitle, cta }: { title: string; subtitle?: string; cta?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background grid place-items-center text-foreground">
      <div className="max-w-sm rounded-2xl border border-border bg-surface/70 p-8 text-center backdrop-blur">
        <Shield className="mx-auto h-10 w-10 text-coral" />
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        {cta && <div className="mt-5">{cta}</div>}
      </div>
    </div>
  );
}

function ClaimAdmin({ onClaimed }: { onClaimed: () => void }) {
  const claim = useServerFn(claimFirstAdmin);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true); setErr(null);
    try { await claim(); onClaimed(); }
    catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  };
  return (
    <Gate
      title="无管理员权限"
      subtitle="若你是首位员工,可申领成为初始管理员;之后由你授权其他员工。"
      cta={
        <div className="space-y-3">
          <button onClick={handle} disabled={loading} className="rounded-lg bg-coral px-5 py-2.5 text-white disabled:opacity-50">
            {loading ? "处理中…" : "申领初始管理员"}
          </button>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
      }
    />
  );
}

function AdminConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "概览", icon: Shield },
    { key: "moderation", label: "内容审核", icon: ShieldCheck },
    { key: "users", label: "用户", icon: Users },
    { key: "messages", label: "消息", icon: MessageSquare },
    { key: "treehole", label: "树洞", icon: Trees },
    { key: "posts", label: "社区", icon: FileText },
    { key: "videos", label: "短视频", icon: VideoIcon },
    { key: "wallet", label: "钱包/礼物", icon: Wallet },
    { key: "reports", label: "举报", icon: Flag },
    { key: "verify", label: "认证", icon: BadgeCheck },
    { key: "roles", label: "权限", icon: KeyRound },
    { key: "campuses", label: "园区", icon: School },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-coral text-white"><Shield className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold">Pulse 员工后台</div>
              <div className="text-[11px] text-muted-foreground">internal · v1</div>
            </div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← 返回 App</Link>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${active ? "bg-coral text-white" : "text-muted-foreground hover:bg-surface"}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {tab === "overview" && <Overview />}
        {tab === "moderation" && <ModerationTab />}
        {tab === "users" && <UsersTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "treehole" && <TreeholeTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "videos" && <VideosTab />}
        {tab === "wallet" && <WalletTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "verify" && <VerifyTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "campuses" && <CampusesTab />}
      </main>
    </div>
  );
}

/* -------------------- Overview -------------------- */
function Overview() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  const s = data?.stats;
  const items = [
    { label: "注册用户", value: s?.users, icon: Users, color: "from-coral to-pink-500" },
    { label: "聊天消息总数", value: s?.messages, icon: MessageSquare, color: "from-violet-500 to-indigo-500" },
    { label: "今日新增消息", value: s?.messagesToday, icon: MessageSquare, color: "from-sun to-orange-500" },
    { label: "社区帖子", value: s?.posts, icon: FileText, color: "from-emerald-500 to-teal-500" },
    { label: "树洞帖子", value: s?.treehole, icon: Trees, color: "from-green-500 to-lime-500" },
    { label: "通话记录", value: s?.calls, icon: Mic, color: "from-blue-500 to-cyan-500" },
    { label: "待处理举报", value: s?.pendingReports, icon: Flag, color: "from-rose-500 to-red-500" },
    { label: "未关闭风险", value: s?.openFlags, icon: AlertTriangle, color: "from-amber-500 to-red-500" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">数据概览</h2>
        <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> 刷新
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-2xl border border-border bg-surface/60 p-4">
              <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${it.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold">{isLoading ? "—" : (it.value ?? 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">{it.label}</div>
            </div>
          );
        })}
      </div>
      <ChartsPanel />
    </div>
  );
}

/* -------------------- Charts -------------------- */
const COLORS = ["#E54848", "#7F77DD", "#F5C443", "#3DDC97", "#5BC0EB", "#FF8A65"];

function ChartsPanel() {
  const fn = useServerFn(getAdminCharts);
  const { data, isLoading } = useQuery({ queryKey: ["admin-charts"], queryFn: () => fn() });

  if (isLoading || !data) {
    return <div className="rounded-2xl border border-border bg-surface/40 p-8 text-center text-sm text-muted-foreground">图表加载中…</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="近 14 天新增趋势" subtitle="新用户 · 消息 · 帖子">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.daily} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gMsg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7F77DD" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7F77DD" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E54848" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#E54848" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5C443" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#F5C443" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" name="消息" dataKey="messages" stroke="#7F77DD" fill="url(#gMsg)" strokeWidth={2} />
            <Area type="monotone" name="新用户" dataKey="users" stroke="#E54848" fill="url(#gUser)" strokeWidth={2} />
            <Area type="monotone" name="帖子" dataKey="posts" stroke="#F5C443" fill="url(#gPost)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="内容分布" subtitle="近 14 天产出占比">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.contentMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={3}>
              {data.contentMix.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="风险等级分布" subtitle="AI 标记的内容风险">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.riskBars} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="level" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.riskBars.map((_, i) => (
                <Cell key={i} fill={["#3DDC97", "#F5C443", "#E54848"][i] ?? "#7F77DD"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="举报处理状态" subtitle={`未关闭风险 ${data.flagStatus.open} · 已处理 ${data.flagStatus.resolved}`}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.reportPie} dataKey="value" nameKey="name" outerRadius={92} label={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              {data.reportPie.map((_, i) => (
                <Cell key={i} fill={["#E54848", "#3DDC97", "#7F77DD"][i] ?? "#F5C443"} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* -------------------- Users -------------------- */
function UsersTab() {
  const [search, setSearch] = useState("");
  const fn = useServerFn(adminListUsers);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fn({ data: { search: search || undefined, limit: 50, offset: 0 } }),
  });
  const users = data?.users ?? [];
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">用户管理 <span className="ml-2 text-sm font-normal text-muted-foreground">共 {data?.total ?? 0}</span></h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="昵称搜索"
              className="rounded-lg border border-border bg-surface/60 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-coral" />
          </div>
          <button onClick={() => refetch()} className="rounded-lg border border-border p-2"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-2.5">用户</th><th>性别</th><th>城市</th><th>引导完成</th><th>注册时间</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">加载中…</td></tr>}
            {!isLoading && users.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">暂无数据</td></tr>}
            {users.map((u: any) => {
              const photos = Array.isArray(u.photos) ? u.photos : [];
              const avatar = photos[u.main_idx ?? 0] || photos[0];
              return (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-coral to-pink-500">
                        {avatar && <img src={avatar} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-medium">{u.nickname || "未命名"}</div>
                        <div className="text-[10px] text-muted-foreground">{u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.gender || "—"}</td>
                  <td>{u.city || "—"}</td>
                  <td>{u.onboarded ? "✓" : "—"}</td>
                  <td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------- Messages -------------------- */
function MessagesTab() {
  const [search, setSearch] = useState("");
  const [hasMedia, setHasMedia] = useState(false);
  const qc = useQueryClient();
  const fn = useServerFn(adminListMessages);
  const delFn = useServerFn(adminDeleteMessage);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-messages", search, hasMedia],
    queryFn: () => fn({ data: { search: search || undefined, hasMedia, limit: 80, offset: 0 } }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });
  const msgs = data?.messages ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">消息分析 <span className="ml-2 text-sm font-normal text-muted-foreground">共 {data?.total ?? 0}</span></h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-xs">
            <input type="checkbox" checked={hasMedia} onChange={(e) => setHasMedia(e.target.checked)} />
            仅含媒体
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索内容关键词"
              className="rounded-lg border border-border bg-surface/60 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-coral" />
          </div>
          <button onClick={() => refetch()} className="rounded-lg border border-border p-2"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
        {!isLoading && msgs.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无消息</p>}
        {msgs.map((m: any) => (
          <div key={m.id} className="rounded-2xl border border-border bg-surface/40 p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-coral to-pink-500">
                {m.sender.avatar && <img src={m.sender.avatar} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium">{m.sender.nickname}</span>
                  <span className="text-muted-foreground">{m.sender_id.slice(0, 8)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">会话 {m.conversation_id.slice(0, 8)}</span>
                  {m.attachments.length > 0 && (
                    <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[10px] text-coral">
                      {m.attachments.length} 个附件
                    </span>
                  )}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{m.content}</p>
                {m.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.attachments.map((a: any) => <AttachmentPreview key={a.id} att={a} />)}
                  </div>
                )}
              </div>
              <button onClick={() => { if (confirm("软删除该消息?")) del.mutate(m.id); }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttachmentPreview({ att }: { att: any }) {
  if (att.kind === "image") {
    return (
      <a href={att.url} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-lg border border-border bg-black/40">
        <img src={att.url} alt="" className="h-full w-full object-cover" />
      </a>
    );
  }
  if (att.kind === "video") {
    return (
      <video src={att.url} controls className="h-32 w-44 rounded-lg border border-border bg-black object-cover" />
    );
  }
  if (att.kind === "audio") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 py-2 text-xs">
        <Mic className="h-3.5 w-3.5 text-coral" />
        <audio src={att.url} controls className="h-7" />
      </div>
    );
  }
  return (
    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 py-2 text-xs">
      <FileText className="h-3.5 w-3.5" /> 文件
    </a>
  );
}

/* -------------------- Reports -------------------- */
function ReportsTab() {
  const qc = useQueryClient();
  const fn = useServerFn(adminListReports);
  const upd = useServerFn(adminUpdateReport);
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => fn() });
  const reports = data?.reports ?? [];
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">举报处理</h2>
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && reports.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无举报</p>}
      {reports.map((r: any) => (
        <div key={r.id} className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">{r.target_type}</span>
                <span>{r.target_id.slice(0, 8)}</span>
                <span>·</span>
                <span>by {r.reporter_id.slice(0, 8)}</span>
                <span>·</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1.5 text-sm"><span className="font-medium">{r.reason}</span>{r.detail && <span className="ml-2 text-muted-foreground">{r.detail}</span>}</p>
            </div>
            <select value={r.status} onChange={(e) => mut.mutate({ id: r.id, status: e.target.value })}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs">
              <option value="pending">待处理</option>
              <option value="reviewing">审核中</option>
              <option value="resolved">已处理</option>
              <option value="rejected">驳回</option>
            </select>
          </div>
        </div>
      ))}
    </section>
  );
}

/* -------------------- Treehole / Posts -------------------- */
function TreeholeTab() {
  const fn = useServerFn(adminListTreehole);
  const { data, isLoading } = useQuery({ queryKey: ["admin-treehole"], queryFn: () => fn() });
  const posts = data?.posts ?? [];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">树洞内容</h2>
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {posts.map((p: any) => (
        <div key={p.id} className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">{p.anon_name}</span>
            {p.mood && <span>{p.mood}</span>}
            <span>·</span>
            <span>{new Date(p.created_at).toLocaleString()}</span>
            <span className="ml-auto text-[10px]">作者:{p.author_id.slice(0, 8)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm">{p.content}</p>
          {p.media_url && <img src={p.media_url} alt="" className="mt-2 max-h-60 rounded-lg" />}
          <div className="mt-2 text-xs text-muted-foreground">共鸣 {p.resonance_count} · 抱抱 {p.hug_count}</div>
        </div>
      ))}
    </section>
  );
}

function PostsTab() {
  const fn = useServerFn(adminListPosts);
  const { data, isLoading } = useQuery({ queryKey: ["admin-posts"], queryFn: () => fn() });
  const posts = data?.posts ?? [];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">社区帖子</h2>
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {posts.map((p: any) => (
        <div key={p.id} className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">{p.category}</span>
            <span>{new Date(p.created_at).toLocaleString()}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold">{p.title}</h3>
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{p.content}</p>
          <div className="mt-2 text-[11px] text-muted-foreground">❤ {p.likes_count} · 💬 {p.comments_count} · 🔥 {p.hot}</div>
        </div>
      ))}
    </section>
  );
}

/* -------------------- Moderation -------------------- */
type ModSub = "photos" | "posts" | "treehole";

function ModerationTab() {
  const [sub, setSub] = useState<ModSub>("photos");
  const sumFn = useServerFn(adminModerationSummary);
  const { data: sum } = useQuery({ queryKey: ["mod-summary"], queryFn: () => sumFn() });

  const subs: { key: ModSub; label: string; count?: number }[] = [
    { key: "photos", label: "用户照片 / 头像" },
    { key: "posts", label: "社区帖子", count: sum?.posts },
    { key: "treehole", label: "匿名树洞", count: sum?.treehole },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">内容审核中心</h2>
          <p className="text-xs text-muted-foreground">
            待处理风险 {sum?.flagsOpen ?? 0} · 待处理举报 {sum?.reportsPending ?? 0}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {subs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSub(s.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              sub === s.key ? "bg-coral text-white" : "text-muted-foreground hover:bg-surface"
            }`}
          >
            {s.label}
            {typeof s.count === "number" && (
              <span className="ml-1.5 rounded bg-black/30 px-1.5 py-0.5 text-[10px]">{s.count}</span>
            )}
          </button>
        ))}
      </div>
      {sub === "photos" && <PhotoModeration />}
      {sub === "posts" && <PostModeration />}
      {sub === "treehole" && <TreeholeModeration />}
    </section>
  );
}

function PhotoModeration() {
  const [onlyPending, setOnlyPending] = useState(true);
  const qc = useQueryClient();
  const listFn = useServerFn(adminListPhotoQueue);
  const reviewFn = useServerFn(adminReviewPhoto);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mod-photos", onlyPending],
    queryFn: () => listFn({ data: { onlyFlagged: onlyPending, limit: 60 } }),
  });
  const mut = useMutation({
    mutationFn: (v: { profileId: string; idx: number; action: "approve" | "reject" }) =>
      reviewFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mod-photos"] }),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          仅显示未审核
        </label>
        <button onClick={() => refetch()} className="rounded-lg border border-border p-2">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          暂无待审核的照片
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it: any) => (
          <div key={`${it.profileId}:${it.idx}`} className="overflow-hidden rounded-2xl border border-border bg-surface/40">
            <div className="relative aspect-[3/4] w-full bg-black/40">
              {it.url ? (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {it.isMain && (
                <span className="absolute left-2 top-2 rounded bg-coral px-1.5 py-0.5 text-[10px] text-white">主头像</span>
              )}
              <span
                className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] ${
                  it.decision === "approve"
                    ? "bg-emerald-500/80 text-white"
                    : it.decision === "reject"
                      ? "bg-rose-500/80 text-white"
                      : "bg-black/60 text-white/80"
                }`}
              >
                {it.decision === "approve" ? "已通过" : it.decision === "reject" ? "已驳回" : "待审"}
              </span>
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-medium">{it.nickname || "未命名"}</div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {it.gender || "—"} · {it.city || "—"} · #{it.idx}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ profileId: it.profileId, idx: it.idx, action: "approve" })}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> 通过
                </button>
                <button
                  disabled={mut.isPending}
                  onClick={() => {
                    if (confirm("驳回并从用户资料中移除该照片?")) {
                      mut.mutate({ profileId: it.profileId, idx: it.idx, action: "reject" });
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                >
                  <XCircle className="h-3.5 w-3.5" /> 驳回
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostModeration() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListPosts);
  const reviewFn = useServerFn(adminReviewPost);
  const { data, isLoading } = useQuery({ queryKey: ["mod-posts"], queryFn: () => listFn() });
  const posts = data?.posts ?? [];
  const mut = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "remove"; reason?: string }) => reviewFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-posts"] });
      qc.invalidateQueries({ queryKey: ["mod-summary"] });
    },
  });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && posts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无社区帖子</p>
      )}
      {posts.map((p: any) => (
        <div key={p.id} className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">{p.category}</span>
                <span>作者 {p.author_id.slice(0, 8)}</span>
                <span>·</span>
                <span>{new Date(p.created_at).toLocaleString()}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{p.content}</p>
              <div className="mt-1.5 text-[11px] text-muted-foreground">❤ {p.likes_count} · 💬 {p.comments_count} · 🔥 {p.hot}</div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                onClick={() => mut.mutate({ id: p.id, action: "approve" })}
                className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> 通过
              </button>
              <button
                onClick={() => {
                  const r = prompt("请输入移除原因(可选)") || undefined;
                  if (confirm("确认删除该帖子?")) mut.mutate({ id: p.id, action: "remove", reason: r });
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> 移除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VerifyTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListVerifications);
  const reviewFn = useServerFn(adminReviewVerification);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications", status],
    queryFn: () => listFn({ data: { status, limit: 80 } }),
  });

  const review = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; note?: string }) => reviewFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-verifications"] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">实名 / 学生认证</h2>
        <div className="flex gap-1 rounded-lg border border-border p-1 text-xs">
          {(["pending","approved","rejected","all"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded px-2.5 py-1 ${status===s ? "bg-coral text-white" : "text-muted-foreground hover:bg-surface"}`}>
              {s === "pending" ? "待审核" : s === "approved" ? "已通过" : s === "rejected" ? "已驳回" : "全部"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无记录</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it: any) => (
          <div key={it.id} className="overflow-hidden rounded-2xl border border-border bg-surface/60">
            <a href={it.evidence_url} target="_blank" rel="noreferrer" className="block">
              <img src={it.evidence_url} alt="凭证" className="h-56 w-full object-cover" />
            </a>
            <div className="p-3">
              <div className="flex items-center gap-2">
                {it.user.avatar
                  ? <img src={it.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                  : <div className="grid h-7 w-7 place-items-center rounded-full bg-coral/30 text-[11px]">{it.user.nickname.slice(0,1)}</div>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{it.user.nickname}</div>
                  <div className="text-[10px] text-muted-foreground">{it.user.city || "未填城市"}</div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${it.kind === "real" ? "bg-mint/20 text-mint" : "bg-brand/20 text-brand"}`}>
                  {it.kind === "real" ? <Shield className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                  {it.kind === "real" ? "实人" : "学生"}
                </span>
              </div>
              {it.evidence_extra && (
                <p className="mt-2 line-clamp-2 rounded-lg bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
                  备注：{it.evidence_extra}
                </p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">提交于 {new Date(it.created_at).toLocaleString()}</p>

              {it.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: it.id, action: "approve" })}
                    disabled={review.isPending}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-mint/20 px-3 py-1.5 text-xs font-semibold text-mint hover:bg-mint/30 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> 通过
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt("驳回原因（可选）") || undefined;
                      review.mutate({ id: it.id, action: "reject", note });
                    }}
                    disabled={review.isPending}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> 驳回
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-[11px]">
                  <span className={it.status === "approved" ? "text-mint" : "text-rose-300"}>
                    {it.status === "approved" ? "已通过" : "已驳回"}
                  </span>
                  {it.review_note && <span className="ml-1 text-muted-foreground">· {it.review_note}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========== Campuses Tab ===========
function CampusesTab() {
  const listFn = useServerFn(adminListCampuses);
  const createFn = useServerFn(adminCreateCampus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-campuses"],
    queryFn: () => listFn(),
  });
  const campuses = data?.campuses ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const createMut = useMutation({
    mutationFn: () => createFn({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-campuses"] });
      setShowCreate(false);
      setName(""); setSlug(""); setLocation(""); setDescription("");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">校园 / 园区</h2>
          <p className="text-xs text-muted-foreground">管理各个学校或园区社区，下发首批邀请码。</p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="rounded-lg bg-coral px-3 py-1.5 text-sm text-white">
          {showCreate ? "取消" : "+ 新建园区"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-border bg-surface/40 p-4 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="园区名称，如 复旦大学"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-coral/50" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="英文标识 slug (a-z0-9-)"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-coral/50" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="地点 (可选)"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-coral/50" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简介 (可选)"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-coral/50" />
          <button
            disabled={!name.trim() || !slug.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
            className="md:col-span-2 h-10 rounded-lg bg-coral text-white text-sm font-medium disabled:opacity-40"
          >
            {createMut.isPending ? "创建中…" : "创建园区"}
          </button>
          {createMut.error && (
            <div className="md:col-span-2 text-xs text-rose-400">{(createMut.error as any).message}</div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">加载中…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface/40">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left">名称</th>
                <th className="px-4 py-2 text-left">Slug</th>
                <th className="px-4 py-2 text-left">地点</th>
                <th className="px-4 py-2 text-left">成员数</th>
                <th className="px-4 py-2 text-left">创建时间</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {campuses.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.location ?? "-"}</td>
                  <td className="px-4 py-2">{c.member_count}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setSelected(selected === c.id ? null : c.id)}
                      className="text-xs text-coral"
                    >
                      {selected === c.id ? "收起" : "邀请码"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CampusInvitesPanel campusId={selected} campusName={campuses.find((c) => c.id === selected)?.name ?? ""} />
      )}
    </div>
  );
}

function CampusInvitesPanel({ campusId, campusName }: { campusId: string; campusName: string }) {
  const listFn = useServerFn(adminListCampusInvites);
  const createFn = useServerFn(createCampusInvite);
  const qc = useQueryClient();
  const queryKey = ["admin-campus-invites", campusId] as const;
  const { data } = useQuery({ queryKey, queryFn: () => listFn({ data: { campus_id: campusId } }) });
  const invites = data?.invites ?? [];
  const [maxUses, setMaxUses] = useState(20);
  const [hours, setHours] = useState(168);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => createFn({ data: { campus_id: campusId, max_uses: maxUses, expires_in_hours: hours } }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="text-sm font-semibold">{campusName} · 邀请码</div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-muted-foreground">可用次数</label>
        <input type="number" min={1} max={500} value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value) || 1)}
          className="w-20 h-8 px-2 rounded-lg border border-border bg-background outline-none" />
        <label className="text-muted-foreground ml-2">有效期 (小时)</label>
        <input type="number" min={1} max={1440} value={hours}
          onChange={(e) => setHours(Number(e.target.value) || 1)}
          className="w-20 h-8 px-2 rounded-lg border border-border bg-background outline-none" />
        <button onClick={() => mut.mutate()} disabled={mut.isPending}
          className="ml-2 h-8 px-3 rounded-lg bg-coral text-white text-xs disabled:opacity-40">
          {mut.isPending ? "生成中…" : "+ 生成邀请码"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left">邀请码</th>
              <th className="px-2 py-1.5 text-left">使用 / 上限</th>
              <th className="px-2 py-1.5 text-left">到期</th>
              <th className="px-2 py-1.5 text-left">状态</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">还没有邀请码</td></tr>
            )}
            {invites.map((i) => (
              <tr key={i.id} className="border-b border-border/60">
                <td className="px-2 py-1.5 font-mono">{i.code}</td>
                <td className="px-2 py-1.5">{i.uses} / {i.max_uses}</td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {i.expires_at ? new Date(i.expires_at).toLocaleString("zh-CN") : "长期"}
                </td>
                <td className="px-2 py-1.5">
                  {i.uses >= i.max_uses ? <span className="text-rose-400">已用完</span> :
                    i.status !== "active" ? <span className="text-muted-foreground">已撤销</span> :
                    i.expires_at && new Date(i.expires_at) < new Date() ? <span className="text-amber-400">已过期</span> :
                    <span className="text-emerald-400">可用</span>}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => copy(i.code)} className="inline-flex items-center gap-1 text-coral">
                    {copiedCode === i.code ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedCode === i.code ? "已复制" : "复制"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Roles -------------------- */
const ROLE_META: Record<string, { label: string; color: string; desc: string }> = {
  admin: { label: "管理员", color: "bg-rose-500/15 text-rose-300 border-rose-500/40", desc: "可访问全部后台功能,可分配/撤销角色" },
  moderator: { label: "审核员", color: "bg-amber-500/15 text-amber-300 border-amber-500/40", desc: "可处理举报和审核内容" },
  user: { label: "普通用户", color: "bg-white/10 text-white/70 border-white/20", desc: "默认角色,无后台权限" },
};
const ALL_ROLES = ["admin", "moderator"] as const;

function RolesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListRoleMembers);
  const assignFn = useServerFn(adminAssignRole);
  const revokeFn = useServerFn(adminRevokeRole);

  const [search, setSearch] = useState("");
  const [onlyStaff, setOnlyStaff] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-roles", search, onlyStaff],
    queryFn: () => listFn({ data: { search: search || undefined, onlyStaff, limit: 80 } }),
  });
  const members: any[] = data?.members ?? [];

  const assign = useMutation({
    mutationFn: (v: { targetUserId: string; role: "admin" | "moderator" }) => assignFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-roles"] }),
  });
  const revoke = useMutation({
    mutationFn: (v: { targetUserId: string; role: "admin" | "moderator" }) => revokeFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-roles"] }),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">角色权限</h2>
          <p className="text-xs text-muted-foreground">为员工授予 admin 或 moderator 权限,可随时调整</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={onlyStaff} onChange={(e) => setOnlyStaff(e.target.checked)} />
            仅显示有角色的员工
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="按昵称搜索"
              className="rounded-lg border border-border bg-surface/60 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-coral" />
          </div>
          <button onClick={() => refetch()} className="rounded-lg border border-border p-2"><RefreshCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded-lg bg-coral px-3 py-1.5 text-xs text-white hover:opacity-90">
            <UserPlus className="h-3.5 w-3.5" /> 添加员工
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["admin", "moderator", "user"] as const).map((r) => (
          <div key={r} className={`rounded-2xl border p-3 text-xs ${ROLE_META[r].color}`}>
            <div className="text-sm font-semibold">{ROLE_META[r].label}</div>
            <div className="mt-1 opacity-80">{ROLE_META[r].desc}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">员工</th>
              <th>邮箱</th>
              <th>当前角色</th>
              <th className="text-right pr-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">加载中…</td></tr>}
            {!isLoading && members.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                暂无{onlyStaff ? "员工" : "用户"},点击右上角「添加员工」分配权限
              </td></tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="border-t border-border/60 align-middle">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-coral to-pink-500">
                      {m.avatar && <img src={m.avatar} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-medium">{m.nickname || "未命名"}</div>
                      <div className="text-[10px] text-muted-foreground">{m.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-muted-foreground">{m.email || "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {m.roles.length === 0 && <span className="text-xs text-muted-foreground">无</span>}
                    {m.roles.map((r: string) => (
                      <span key={r} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${ROLE_META[r]?.color ?? ""}`}>
                        {ROLE_META[r]?.label ?? r}
                        {(r === "admin" || r === "moderator") && (
                          <button
                            title="撤销该角色"
                            onClick={() => {
                              if (confirm(`确认撤销 ${m.nickname || m.email} 的「${ROLE_META[r].label}」?`)) {
                                revoke.mutate({ targetUserId: m.id, role: r as any });
                              }
                            }}
                            className="opacity-70 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="pr-4 text-right">
                  <div className="inline-flex gap-1.5">
                    {ALL_ROLES.map((r) => {
                      const has = m.roles.includes(r);
                      return (
                        <button
                          key={r}
                          disabled={has || assign.isPending}
                          onClick={() => assign.mutate({ targetUserId: m.id, role: r })}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
                            has
                              ? "cursor-not-allowed border-border bg-surface/40 text-muted-foreground"
                              : "border-coral/40 bg-coral/10 text-coral hover:bg-coral/20"
                          }`}
                        >
                          {has ? `已是${ROLE_META[r].label}` : `设为${ROLE_META[r].label}`}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddStaffDialog
          onClose={() => setShowAdd(false)}
          onAssigned={() => qc.invalidateQueries({ queryKey: ["admin-roles"] })}
        />
      )}
    </section>
  );
}

function AddStaffDialog({ onClose, onAssigned }: { onClose: () => void; onAssigned: () => void }) {
  const findFn = useServerFn(adminFindUser);
  const assignFn = useServerFn(adminAssignRole);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [role, setRole] = useState<"admin" | "moderator">("moderator");
  const [err, setErr] = useState<string | null>(null);

  const doSearch = async () => {
    if (!q.trim()) return;
    setSearching(true); setErr(null);
    try {
      const r = await findFn({ data: { query: q.trim() } });
      setResults(r.users ?? []);
      if ((r.users ?? []).length === 0) setErr("没有找到匹配的用户");
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setSearching(false); }
  };

  const assign = async (uid: string) => {
    setErr(null);
    try {
      await assignFn({ data: { targetUserId: uid, role } });
      onAssigned();
      onClose();
    } catch (e: any) { setErr(e.message || String(e)); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold">添加员工权限</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">输入对方注册邮箱或昵称查找,然后选择要授予的角色。</p>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="邮箱 或 昵称"
            className="flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none focus:border-coral" />
          <button onClick={doSearch} disabled={searching}
            className="rounded-lg bg-coral px-3 py-2 text-sm text-white disabled:opacity-50">
            {searching ? "查找中…" : "查找"}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {ALL_ROLES.map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${role === r ? "border-coral bg-coral/10 text-coral" : "border-border text-muted-foreground"}`}>
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
        {err && <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</div>}
        <div className="mt-3 max-h-72 space-y-1.5 overflow-auto">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-coral to-pink-500">
                  {u.avatar && <img src={u.avatar} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="text-sm font-medium">{u.nickname}</div>
                  <div className="text-[10px] text-muted-foreground">{u.email || u.id.slice(0, 8)}</div>
                </div>
              </div>
              <button onClick={() => assign(u.id)}
                className="rounded-lg bg-coral px-2.5 py-1 text-xs text-white hover:opacity-90">
                设为{ROLE_META[role].label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeholeModeration() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListTreehole);
  const reviewFn = useServerFn(adminReviewTreehole);
  const { data, isLoading } = useQuery({ queryKey: ["mod-treehole"], queryFn: () => listFn() });
  const posts = data?.posts ?? [];
  const mut = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "remove"; reason?: string }) => reviewFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod-treehole"] });
      qc.invalidateQueries({ queryKey: ["mod-summary"] });
    },
  });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
      {!isLoading && posts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无树洞内容</p>
      )}
      {posts.map((p: any) => (
        <div key={p.id} className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">{p.anon_name}</span>
                {p.mood && <span>{p.mood}</span>}
                <span>·</span>
                <span>{new Date(p.created_at).toLocaleString()}</span>
                <span className="ml-auto text-[10px]">作者 {p.author_id.slice(0, 8)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{p.content}</p>
              {p.media_url && <img src={p.media_url} alt="" className="mt-2 max-h-60 rounded-lg" />}
              <div className="mt-1.5 text-xs text-muted-foreground">共鸣 {p.resonance_count} · 抱抱 {p.hug_count}</div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                onClick={() => mut.mutate({ id: p.id, action: "approve" })}
                className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> 通过
              </button>
              <button
                onClick={() => {
                  const r = prompt("请输入移除原因(可选)") || undefined;
                  if (confirm("确认删除该树洞?")) mut.mutate({ id: p.id, action: "remove", reason: r });
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> 移除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
/* -------------------- Short Videos -------------------- */
function VideosTab() {
  const [status, setStatus] = useState<"all" | "published" | "removed">("all");
  const list = useServerFn(adminListShortVideos);
  const review = useServerFn(adminReviewShortVideo);
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-videos", status],
    queryFn: () => list({ data: { status, limit: 50, offset: 0 } }),
  });
  const mut = useMutation({
    mutationFn: (v: { id: string; action: "remove" | "restore" | "delete"; reason?: string }) =>
      review({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-videos"] }),
  });
  const videos = data?.videos ?? [];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">短视频审核 <span className="ml-2 text-sm font-normal text-muted-foreground">共 {data?.total ?? 0}</span></h2>
        <div className="flex items-center gap-2">
          {(["all", "published", "removed"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs ${status === s ? "bg-coral text-white" : "border border-border text-muted-foreground"}`}>
              {s === "all" ? "全部" : s === "published" ? "已发布" : "已下架"}
            </button>
          ))}
          <button onClick={() => refetch()} className="rounded-lg border border-border p-2"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <div className="col-span-full text-center text-muted-foreground">加载中…</div>}
        {!isLoading && videos.length === 0 && <div className="col-span-full text-center text-muted-foreground">暂无数据</div>}
        {videos.map((v: any) => (
          <div key={v.id} className="overflow-hidden rounded-2xl border border-border bg-surface/60">
            <div className="relative aspect-[9/12] bg-black">
              <video src={v.video_url} poster={v.cover_url || undefined} controls className="h-full w-full object-cover" preload="metadata" />
              <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] ${v.status === "published" ? "bg-emerald-500/80 text-white" : "bg-rose-500/80 text-white"}`}>
                {v.status}
              </span>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{v.author?.nickname || v.author_id.slice(0, 8)}</span>
                <span>·</span>
                <span>{new Date(v.created_at).toLocaleString()}</span>
              </div>
              <p className="line-clamp-2 text-sm">{v.caption || <span className="text-muted-foreground">（无文案）</span>}</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>♥ {v.likes_count}</span>
                <span>💬 {v.comments_count}</span>
                <span>▶ {v.views_count}</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {v.status === "published" ? (
                  <button
                    onClick={() => {
                      const r = prompt("下架原因（可选）") || undefined;
                      if (confirm("确认下架?")) mut.mutate({ id: v.id, action: "remove", reason: r });
                    }}
                    className="flex-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-300">
                    下架
                  </button>
                ) : (
                  <button
                    onClick={() => mut.mutate({ id: v.id, action: "restore" })}
                    className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300">
                    恢复
                  </button>
                )}
                <button
                  onClick={() => {
                    const r = prompt("删除原因（可选）") || undefined;
                    if (confirm("永久删除该视频?")) mut.mutate({ id: v.id, action: "delete", reason: r });
                  }}
                  className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300">
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <VideoCommentsAdmin />
    </section>
  );
}

function VideoCommentsAdmin() {
  const list = useServerFn(adminListVideoComments);
  const del = useServerFn(adminDeleteVideoComment);
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-video-comments"],
    queryFn: () => list({ data: { limit: 30, offset: 0 } }),
  });
  const mut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-video-comments"] }),
  });
  const items = data?.comments ?? [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pt-4">
        <h3 className="text-sm font-semibold">视频评论（最近 {data?.total ?? 0}）</h3>
        <button onClick={() => refetch()} className="rounded-lg border border-border p-1.5"><RefreshCw className="h-3 w-3" /></button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">作者</th><th>内容</th><th>视频</th><th>时间</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">加载中…</td></tr>}
            {!isLoading && items.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">暂无评论</td></tr>}
            {items.map((c: any) => (
              <tr key={c.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-2 text-xs">{c.author?.nickname || c.author_id.slice(0, 8)}</td>
                <td className="max-w-[400px] py-2 text-xs">{c.content}</td>
                <td className="py-2 text-[10px] text-muted-foreground">{c.video_id.slice(0, 8)}</td>
                <td className="py-2 text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</td>
                <td className="py-2 pr-3">
                  <button onClick={() => { if (confirm("删除该评论?")) mut.mutate(c.id); }}
                    className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Wallet & Gifts -------------------- */
function WalletTab() {
  const overview = useServerFn(adminWalletOverview);
  const gifts = useServerFn(adminListGifts);
  const ledger = useServerFn(adminListLedger);
  const [kind, setKind] = useState<"all" | "topup" | "pro_sub" | "gift_sent" | "gift_received">("all");

  const ov = useQuery({ queryKey: ["admin-wallet-overview"], queryFn: () => overview() });
  const gq = useQuery({ queryKey: ["admin-gifts"], queryFn: () => gifts({ data: { limit: 30, offset: 0 } }) });
  const lq = useQuery({ queryKey: ["admin-ledger", kind], queryFn: () => ledger({ data: { kind, limit: 50, offset: 0 } }) });

  const o = ov.data;
  const cards = [
    { label: "总流通心动币", value: o?.totalCoins, icon: Wallet, color: "from-coral to-pink-500" },
    { label: "Pro 活跃会员", value: o?.proActive, icon: BadgeCheck, color: "from-amber-500 to-yellow-500" },
    { label: "累计充值（币）", value: o?.topupTotal, icon: ArrowUpRight, color: "from-emerald-500 to-teal-500" },
    { label: "Pro 收入（币）", value: o?.proRevenue, icon: ShieldCheck, color: "from-violet-500 to-indigo-500" },
    { label: "送礼总额（币）", value: o?.giftSentTotal, icon: Gift, color: "from-rose-500 to-red-500" },
    { label: "礼物笔数", value: o?.giftCount, icon: Gift, color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">钱包 & 礼物审计</h2>
        <button onClick={() => { ov.refetch(); gq.refetch(); lq.refetch(); }} className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-surface/60 p-4">
              <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${c.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-xl font-semibold">{(c.value ?? 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <h3 className="mb-3 text-sm font-semibold">最近礼物</h3>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {gq.isLoading && <div className="text-center text-xs text-muted-foreground">加载中…</div>}
            {(gq.data?.gifts ?? []).map((g: any) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-xs">
                <div>
                  <div className="font-medium">{g.sender_name} → {g.receiver_name}</div>
                  <div className="text-[10px] text-muted-foreground">{g.gift_code} · {new Date(g.created_at).toLocaleString()}</div>
                  {g.message && <div className="mt-1 text-[11px] italic text-muted-foreground">"{g.message}"</div>}
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-coral">
                  <Gift className="h-3.5 w-3.5" /> {g.coins}
                </div>
              </div>
            ))}
            {!gq.isLoading && (gq.data?.gifts ?? []).length === 0 && <div className="text-center text-xs text-muted-foreground">暂无礼物</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">财务流水</h3>
            <div className="flex flex-wrap gap-1">
              {(["all", "topup", "pro_sub", "gift_sent", "gift_received"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`rounded-md px-2 py-1 text-[10px] ${kind === k ? "bg-coral text-white" : "border border-border text-muted-foreground"}`}>
                  {k === "all" ? "全部" : k === "topup" ? "充值" : k === "pro_sub" ? "Pro" : k === "gift_sent" ? "送礼" : "收礼"}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
            {lq.isLoading && <div className="text-center text-xs text-muted-foreground">加载中…</div>}
            {(lq.data?.ledger ?? []).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 text-xs">
                <div>
                  <div className="font-medium">{l.nickname}</div>
                  <div className="text-[10px] text-muted-foreground">{l.kind} · {new Date(l.created_at).toLocaleString()}</div>
                </div>
                <div className={`flex items-center gap-0.5 font-semibold ${l.delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {l.delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {l.delta > 0 ? "+" : ""}{l.delta}
                </div>
              </div>
            ))}
            {!lq.isLoading && (lq.data?.ledger ?? []).length === 0 && <div className="text-center text-xs text-muted-foreground">暂无流水</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
