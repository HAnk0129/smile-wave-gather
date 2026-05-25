import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Settings, Edit3, LogOut, Shield, Bell, Lock, Heart, MessageCircle,
  Sparkles, MapPin, Cake, Briefcase, GraduationCap, Crown, ChevronRight,
  Home, User as UserIcon, Flame, Camera,
} from "lucide-react";
import { getMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "我的 · Pulse" },
      { name: "description", content: "查看与编辑你的 Pulse 个人主页：资料、相册、兴趣标签、认证与设置。" },
    ],
  }),
  component: MePage,
});

function MePage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchMe = useServerFn(getMyProfile);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchMe(),
    enabled: authed === true,
  });

  if (authed === false) {
    return (
      <Shell>
        <div className="grid place-items-center pt-32 text-center">
          <div className="mx-5 max-w-sm rounded-3xl border border-border bg-surface/70 p-8 backdrop-blur">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-coral to-sun text-background shadow-lg">
              <UserIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">还没有登录</h2>
            <p className="mt-2 text-sm text-muted-foreground">登录后即可查看你的个人主页、消息和匹配</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/auth" search={{ mode: "login" }} className="rounded-[10px] border border-brand/40 px-4 py-2.5 text-sm font-medium text-brand">登录</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-[10px] bg-coral px-4 py-2.5 text-sm font-semibold text-background">注册</Link>
            </div>
          </div>
        </div>
        <BottomNav active="me" />
      </Shell>
    );
  }

  const profile = data?.profile as Record<string, any> | null | undefined;
  const onboarded = profile?.onboarded;
  const photos: string[] = Array.isArray(profile?.photos) ? profile!.photos : [];
  const mainIdx = profile?.main_idx ?? 0;
  const mainPhoto = photos[mainIdx] || photos[0];
  const interests: string[] = Array.isArray(profile?.interests) ? profile!.interests : [];
  const personality: string[] = Array.isArray(profile?.personality) ? profile!.personality : [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    refetch();
    navigate({ to: "/" });
  };

  return (
    <Shell>
      {/* Hero */}
      <header className="relative">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand/30 via-coral/10 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-coral to-sun text-background">
              <Flame className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">我的</span>
          </Link>
          <Link to="/me" className="rounded-full border border-border bg-surface/60 p-2 backdrop-blur" aria-label="设置">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-md px-5">
          <div className="rounded-3xl border border-border bg-surface/80 p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                {mainPhoto ? (
                  <img src={mainPhoto} alt="头像" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-coral/60" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-coral to-sun font-display text-3xl text-background">
                    {(profile?.nickname || "我").slice(0, 1)}
                  </div>
                )}
                <Link to="/onboarding" className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-brand text-background shadow">
                  <Camera className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
                    {isLoading ? "—" : profile?.nickname || "未命名"}
                  </h1>
                  {profile?.verify_real && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-mint/20 px-1.5 py-0.5 text-[10px] text-mint">
                      <Shield className="h-3 w-3" /> 真人
                    </span>
                  )}
                  {profile?.verify_student && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] text-brand">
                      <GraduationCap className="h-3 w-3" /> 学生
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {profile?.signature || "还没有签名，点编辑加一句让人记住你的话"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {profile?.city && <Chip icon={MapPin}>{profile.city}</Chip>}
                  {profile?.mbti && <Chip icon={Sparkles}>{profile.mbti}</Chip>}
                  {profile?.zodiac && <Chip icon={Cake}>{profile.zodiac}</Chip>}
                </div>
              </div>
            </div>

            {!onboarded && !isLoading && (
              <Link
                to="/onboarding"
                className="mt-4 flex items-center justify-between rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> 完善资料解锁更多匹配
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-background/60 py-3 text-center">
              <Stat label="同频喜欢" value="0" />
              <Stat label="互相匹配" value="0" />
              <Stat label="收到留言" value="0" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-md px-5 pb-28 pt-5">
        {/* Photo gallery */}
        <section className="mt-2">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-display text-base font-semibold">我的相册</h2>
            <Link to="/onboarding" className="text-xs text-muted-foreground hover:text-foreground">
              编辑
            </Link>
          </div>
          {photos.length === 0 ? (
            <Link
              to="/onboarding"
              className="grid h-32 place-items-center rounded-2xl border border-dashed border-border bg-surface/40 text-sm text-muted-foreground"
            >
              + 上传你的第一张照片
            </Link>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 9).map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={p} alt="" className="h-full w-full object-cover" />
                  {i === mainIdx && (
                    <span className="absolute left-1 top-1 rounded-full bg-coral/90 px-1.5 py-0.5 text-[9px] font-semibold text-background">主图</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* About */}
        <section className="mt-6">
          <h2 className="mb-2 font-display text-base font-semibold">关于我</h2>
          <div className="rounded-2xl border border-border bg-surface/60 p-4 text-sm leading-relaxed text-foreground/90">
            {profile?.intro || "还没有写自我介绍。让别人通过你的故事认识你。"}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {profile?.job && <InfoRow icon={Briefcase}>{profile.job}</InfoRow>}
            {profile?.school && <InfoRow icon={GraduationCap}>{profile.school}</InfoRow>}
            {profile?.height && <InfoRow icon={UserIcon}>{profile.height}</InfoRow>}
            {profile?.hometown && <InfoRow icon={Home}>{profile.hometown}</InfoRow>}
          </div>
        </section>

        {/* Tags */}
        {(interests.length > 0 || personality.length > 0) && (
          <section className="mt-6">
            <h2 className="mb-2 font-display text-base font-semibold">兴趣 & 性格</h2>
            <div className="rounded-2xl border border-border bg-surface/60 p-4">
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((t) => (
                    <span key={t} className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] text-mint">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {personality.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {personality.map((t) => (
                    <span key={t} className="rounded-full border border-sun/30 bg-sun/10 px-2.5 py-1 text-[11px] text-sun">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Menu */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/60 divide-y divide-border">
          <MenuItem icon={Edit3} label="编辑资料" to="/onboarding" />
          <MenuItem icon={Heart} label="我喜欢的人" badge="敬请期待" />
          <MenuItem icon={MessageCircle} label="我的消息" to="/messages" />
          <MenuItem icon={Crown} label="升级 Pulse Pro" badge="HOT" badgeColor="bg-sun text-background" />
        </section>

        <section className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/60 divide-y divide-border">
          <MenuItem icon={Bell} label="通知中心" to="/notifications" />
          <MenuItem icon={Lock} label="隐私与可见性" to="/privacy" />
          <MenuItem icon={Shield} label="实名 & 学生认证" to="/verify" />
          <MenuItem icon={Shield} label="账号安全" />
        </section>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface/40 py-3 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> 退出登录
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">Pulse v0.1 · 让相遇变得有趣</p>
      </main>

      <BottomNav active="me" />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

function Chip({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate text-foreground/90">{children}</span>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, to, search, badge, badgeColor,
}: {
  icon: any; label: string; to?: string; search?: Record<string, unknown>;
  badge?: string; badgeColor?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm">{label}</span>
      {badge && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${badgeColor ?? "bg-surface text-muted-foreground"}`}>
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) {
    return (
      <Link to={to} search={search as never} className="block hover:bg-background/40">
        {inner}
      </Link>
    );
  }
  return <button className="block w-full text-left hover:bg-background/40">{inner}</button>;
}

// BottomNav lives in src/components/BottomNav.tsx