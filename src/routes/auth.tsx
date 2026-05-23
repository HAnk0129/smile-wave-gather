import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, Mail, Phone as PhoneIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode as string) === "signup" ? "signup" : "login",
    redirect: (s.redirect as string) || "/discover",
  }),
  component: AuthPage,
});

type Tab = "email" | "phone";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const [tab, setTab] = useState<Tab>("email");
  const [loading, setLoading] = useState<string | null>(null);

  // 已登录直接跳走
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect });
    });
  }, [navigate, search.redirect]);

  // 邮箱
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmail = async () => {
    if (!email.includes("@") || password.length < 6) {
      toast.error("请填写有效邮箱和至少 6 位密码");
      return;
    }
    setLoading("email");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        toast.success("注册成功，请前往邮箱完成验证后再登录");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("登录成功");
        navigate({ to: search.redirect });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(null);
    }
  };

  // 手机号
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const fullPhone = () => `+86${phone}`;

  const sendOtp = async () => {
    if (phone.length !== 11) {
      toast.error("请输入 11 位手机号");
      return;
    }
    setLoading("sendOtp");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone() });
      if (error) throw error;
      setOtpSent(true);
      toast.success("验证码已发送");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "发送失败，请确认短信服务已配置");
    } finally {
      setLoading(null);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("请输入 6 位验证码");
      return;
    }
    setLoading("verifyOtp");
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhone(),
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("登录成功");
      navigate({ to: search.redirect });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "验证失败");
    } finally {
      setLoading(null);
    }
  };

  // Google
  const handleGoogle = async () => {
    setLoading("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + search.redirect,
      });
      if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
      if (result.redirected) return;
      navigate({ to: search.redirect });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Google 登录失败");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      <div className="absolute -top-32 -left-20 size-[420px] rounded-full bg-coral/25 blur-[140px]" />
      <div className="absolute top-40 -right-20 size-[380px] rounded-full bg-mint/20 blur-[140px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-sun/15 blur-[160px]" />

      <header className="relative z-10 mx-auto w-full max-w-md px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="size-4" /> 返回
        </Link>
      </header>

      <main className="relative z-10 flex-1 mx-auto w-full max-w-md px-6 pt-10 pb-10 flex flex-col">
        <div className="text-center">
          <div className="mx-auto size-16 rounded-3xl bg-gradient-to-br from-coral via-sun to-mint flex items-center justify-center glow-coral mb-5">
            <Heart className="size-7 text-background fill-background" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? "欢迎回来" : "加入 "}
            {mode === "signup" && <span className="font-serif-display italic text-coral">Pulse</span>}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "登录继续遇见同频的人" : "30 秒开启你的心动之旅"}
          </p>
        </div>

        {/* Social */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full h-12 rounded-2xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-60"
          >
            <GoogleIcon />
            {loading === "google" ? "正在跳转 Google…" : `使用 Google ${mode === "login" ? "登录" : "注册"}`}
          </button>
          <button
            onClick={() => toast.info("微信登录正在接入中，敬请期待")}
            disabled={loading !== null}
            className="w-full h-12 rounded-2xl bg-[#07C160]/90 text-white font-semibold flex items-center justify-center gap-3 hover:bg-[#07C160] active:scale-[0.99] transition disabled:opacity-60"
          >
            <WeChatIcon />
            使用微信{mode === "login" ? "登录" : "注册"}（即将开放）
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          或使用账号
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-surface/60 border border-border mb-5">
          {(["email", "phone"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                tab === t ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "email" ? <Mail className="size-4" /> : <PhoneIcon className="size-4" />}
              {t === "email" ? "邮箱密码" : "手机号"}
            </button>
          ))}
        </div>

        {tab === "email" ? (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-2xl border border-border bg-surface/60 text-sm focus:outline-none focus:border-coral/50"
            />
            <div className="relative">
              <KeyRound className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "设置至少 6 位密码" : "密码"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-surface/60 text-sm focus:outline-none focus:border-coral/50"
              />
            </div>
            <button
              onClick={handleEmail}
              disabled={loading !== null}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold glow-coral disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              {loading === "email" && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "登录" : "注册账号"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="inline-flex h-12 items-center px-3 rounded-2xl border border-border bg-surface/60 text-sm">+86</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="请输入手机号"
                inputMode="numeric"
                className="flex-1 h-12 px-4 rounded-2xl border border-border bg-surface/60 text-sm focus:outline-none focus:border-coral/50"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 位短信验证码"
                inputMode="numeric"
                className="flex-1 h-12 px-4 rounded-2xl border border-border bg-surface/60 text-sm focus:outline-none focus:border-coral/50"
              />
              <button
                onClick={sendOtp}
                disabled={phone.length !== 11 || loading !== null}
                className="h-12 px-4 rounded-2xl border border-coral/40 text-coral text-sm font-medium disabled:opacity-50"
              >
                {loading === "sendOtp" ? "发送中…" : otpSent ? "重新发送" : "获取验证码"}
              </button>
            </div>
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || loading !== null}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold glow-coral disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              {loading === "verifyOtp" && <Loader2 className="size-4 animate-spin" />}
              手机号{mode === "login" ? "登录" : "注册"}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>还没有账号？<button onClick={() => setMode("signup")} className="text-coral font-medium ml-1">立即注册</button></>
          ) : (
            <>已有账号？<button onClick={() => setMode("login")} className="text-coral font-medium ml-1">直接登录</button></>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
          继续即代表同意 <a className="underline">《用户协议》</a> 与 <a className="underline">《隐私政策》</a>
        </p>
      </main>
    </div>
  );
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M8.7 2C4.5 2 1 4.9 1 8.5c0 2 1.1 3.8 2.9 5L3 16l2.6-1.4c.7.2 1.5.3 2.3.4-.1-.4-.2-.9-.2-1.4 0-3.5 3.3-6.3 7.4-6.3h.7C15 4.1 12.2 2 8.7 2zm-2.6 4a.9.9 0 110 1.8.9.9 0 010-1.8zm5.2 0a.9.9 0 110 1.8.9.9 0 010-1.8zM15.5 9c-3.6 0-6.5 2.4-6.5 5.4 0 3 2.9 5.4 6.5 5.4.7 0 1.4-.1 2-.3l2.2 1.2-.6-2c1.5-1 2.4-2.6 2.4-4.3 0-3-2.9-5.4-6-5.4zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.3z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0012 22z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 010-3.8V7.5H3a10 10 0 000 9l3.4-2.6z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003 7.5l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9z" />
    </svg>
  );
}