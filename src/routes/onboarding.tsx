import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Camera, Heart, Sparkles,
  Shield, Phone, GraduationCap, BadgeCheck, Star, Plus, User2, MapPin,
  Cigarette, Wine, Moon, Utensils, Cat, Image as ImageIcon, Video,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

/* ---------- Auth Gate (WeChat / Google / Phone) ---------- */

type AuthMethod = { provider: "wechat" | "google" | "phone"; nickname?: string };

function AuthGate({ onContinue }: { onContinue: (m: AuthMethod) => void }) {
  const [loading, setLoading] = useState<AuthMethod["provider"] | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const handleOAuth = (provider: "wechat" | "google") => {
    setLoading(provider);
    // 模拟 OAuth 授权流程
    setTimeout(() => {
      onContinue({
        provider,
        nickname: provider === "wechat" ? "微信用户" : "Google 用户",
      });
    }, 900);
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

      <main className="relative z-10 flex-1 mx-auto w-full max-w-md px-6 pt-10 pb-8 flex flex-col">
        <div className="text-center">
          <div className="mx-auto size-16 rounded-3xl bg-gradient-to-br from-coral via-sun to-mint flex items-center justify-center glow-coral mb-5">
            <Heart className="size-7 text-background fill-background" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            加入 <span className="font-serif-display italic text-coral">Pulse</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">选择你偏好的方式，30 秒开启心动之旅</p>
        </div>

        {/* Social buttons */}
        <div className="mt-10 space-y-3">
          <button
            onClick={() => handleOAuth("wechat")}
            disabled={loading !== null}
            className="w-full h-12 rounded-2xl bg-[#07C160] text-white font-semibold flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
          >
            <WeChatIcon />
            {loading === "wechat" ? "正在唤起微信…" : "使用微信注册 / 登录"}
          </button>

          <button
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
            className="w-full h-12 rounded-2xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-60"
          >
            <GoogleIcon />
            {loading === "google" ? "正在跳转 Google…" : "使用 Google 注册 / 登录"}
          </button>
        </div>

        {/* Divider */}
        <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          或使用手机号
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Phone */}
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
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 位短信验证码"
              inputMode="numeric"
              className="flex-1 h-12 px-4 rounded-2xl border border-border bg-surface/60 text-sm focus:outline-none focus:border-coral/50"
            />
            <button
              onClick={() => phone.length === 11 && setSent(true)}
              disabled={phone.length !== 11 || sent}
              className="h-12 px-4 rounded-2xl border border-coral/40 text-coral text-sm font-medium disabled:opacity-50"
            >
              {sent ? "已发送" : "获取验证码"}
            </button>
          </div>
          <button
            onClick={() => onContinue({ provider: "phone" })}
            disabled={phone.length !== 11 || code.length !== 6}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold glow-coral disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition"
          >
            手机号注册 / 登录
          </button>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground leading-relaxed">
          继续即代表同意 <a className="underline">《用户协议》</a> 与 <a className="underline">《隐私政策》</a>
          <br />我们会严格保护你的真实信息
        </p>
      </main>
    </div>
  );
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M8.7 2C4.5 2 1 4.9 1 8.5c0 2 1.1 3.8 2.9 5L3 16l2.6-1.4c.7.2 1.5.3 2.3.4-.1-.4-.2-.9-.2-1.4 0-3.5 3.3-6.3 7.4-6.3h.7C15 4.1 12.2 2 8.7 2zm-2.6 4a.9.9 0 110 1.8.9.9 0 010-1.8zm5.2 0a.9.9 0 110 1.8.9.9 0 010-1.8zM15.5 9c-3.6 0-6.5 2.4-6.5 5.4 0 3 2.9 5.4 6.5 5.4.7 0 1.4-.1 2-.3l2.2 1.2-.6-2c1.5-1 2.4-2.6 2.4-4.3 0-3-2.9-5.4-6-5.4zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.3z"/>
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0012 22z"/>
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 010-3.8V7.5H3a10 10 0 000 9l3.4-2.6z"/>
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003 7.5l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9z"/>
    </svg>
  );
}

const STEPS = [
  { key: "basic", title: "账号基础", subtitle: "让我们先认识一下你" },
  { key: "photos", title: "照片展示", subtitle: "上传 2–8 张真实照片" },
  { key: "bio", title: "个人简介", subtitle: "用一句话定义自己" },
  { key: "tags", title: "兴趣 & 性格", subtitle: "标签越精准，匹配越对味" },
  { key: "lifestyle", title: "生活方式", subtitle: "找到生活节奏相似的人" },
  { key: "intent", title: "交友意向", subtitle: "避免错配，让相遇更高效" },
  { key: "verify", title: "认证 & 安全", subtitle: "完成最后一步，开始遇见" },
] as const;

const INTEREST_TAGS = [
  "旅行","摄影","咖啡","健身","徒步","骑行","滑雪","潜水","冲浪","露营",
  "电影","音乐节","Live House","唱跳","乐器","K-Pop","摇滚","电子","民谣","古典",
  "美食","烘焙","火锅","日料","brunch","red wine","调酒","小酒馆","街边小吃","素食",
  "读书","写作","播客","脱口秀","桌游","剧本杀","密室","展览","美术馆","设计",
  "宠物","猫派","狗派","养花","手作","编织","陶艺","香薰","水彩","二次元",
  "原神","王者","CSGO","Switch","主机","街机","台球","羽毛球","网球","篮球",
  "瑜伽","普拉提","跑步","马拉松","攀岩","街舞","拉丁","民族舞","滑板","飞盘",
  "投资","创业","AI","编程","硬件","摄影后期","Vlog","剪辑","短视频","创作者",
];

const PERSONALITY_TAGS = [
  "温柔","幽默","直球","社恐","E人","I人","治愈系","INTJ女孩","松弛感","氛围感",
  "细节控","行动派","完美主义","佛系","感性","理性","浪漫","务实","好奇心","共情力",
  "话痨","安静","酷盖","元气","奶系","御姐","少年感","成熟","小天才","钝感力",
];

const MBTI = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const ZODIAC = ["白羊","金牛","双子","巨蟹","狮子","处女","天秤","天蝎","射手","摩羯","水瓶","双鱼"];
const INTENT = ["认真恋爱","拓展朋友","兴趣搭子","线下饭搭","旅行同伴","深度聊天","随缘看看"];

type Profile = {
  nickname: string; gender: string; birthday: string; city: string;
  hometown: string; height: string; education: string; job: string; school: string;
  photos: string[]; mainIdx: number; videoIntro: string;
  signature: string; intro: string; status: string;
  interests: string[]; personality: string[]; mbti: string; zodiac: string;
  smoke: string; drink: string; sleep: string; diet: string; pet: string;
  intent: string[]; relationship: string; idealType: string;
  ageRange: [number, number]; distance: string;
  icebreaker: string; phone: string;
  verifyReal: boolean; verifyStudent: boolean;
};

const initial: Profile = {
  nickname: "", gender: "", birthday: "", city: "",
  hometown: "", height: "", education: "", job: "", school: "",
  photos: [], mainIdx: 0, videoIntro: "",
  signature: "", intro: "", status: "",
  interests: [], personality: [], mbti: "", zodiac: "",
  smoke: "", drink: "", sleep: "", diet: "", pet: "",
  intent: [], relationship: "", idealType: "",
  ageRange: [20, 30], distance: "同城",
  icebreaker: "", phone: "",
  verifyReal: false, verifyStudent: false,
};

function Onboarding() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Profile>(initial);
  const navigate = useNavigate();
  const saveProfileFn = useServerFn(saveProfile);

  // 校验登录态：未登录跳到 /auth 注册模式
  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      if (!s.session) {
        navigate({ to: "/auth", search: { mode: "signup", redirect: "/onboarding" } });
      } else {
        setAuthed(true);
        const meta = s.session.user.user_metadata as { nickname?: string } | null;
        const fallback = s.session.user.email?.split("@")[0] ?? "";
        setData((d) => ({
          ...d,
          nickname: d.nickname || meta?.nickname || fallback,
          phone: d.phone || s.session.user.phone || "",
        }));
      }
    });
  }, [navigate]);

  const update = (patch: Partial<Profile>) => setData((d) => ({ ...d, ...patch }));

  const validators: Array<() => string | null> = [
    () => {
      if (!data.nickname.trim()) return "请填写昵称";
      if (!data.gender) return "请选择性别";
      if (!data.birthday) return "请选择出生日期";
      if (!data.city.trim()) return "请填写所在城市";
      return null;
    },
    () => (data.photos.length < 2 ? "至少上传 2 张照片" : null),
    () => {
      const len = data.signature.trim().length;
      if (len < 10) return "个性签名至少 10 个字";
      if (len > 150) return "个性签名不超过 150 字";
      return null;
    },
    () => (data.interests.length === 0 ? "至少选择 1 个兴趣标签" : null),
    () => null,
    () => (data.intent.length === 0 ? "请选择交友目的" : null),
    () => (!data.phone ? "请完成手机认证" : null),
  ];

  const [error, setError] = useState<string | null>(null);
  const next = async () => {
    const err = validators[step]();
    if (err) { setError(err); return; }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setSubmitting(true);
      try {
        await saveProfileFn({ data: data as unknown as Record<string, unknown> });
        try { localStorage.setItem("pulse_profile", JSON.stringify(data)); } catch {}
        toast.success("资料已保存，开始遇见");
        navigate({ to: "/me" });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "保存失败，请重试");
      } finally {
        setSubmitting(false);
      }
    }
  };
  const prev = () => { setError(null); setStep(Math.max(0, step - 1)); };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        正在校验登录状态…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute -top-32 -left-20 size-[420px] rounded-full bg-coral/20 blur-[140px]" />
      <div className="absolute top-40 -right-20 size-[380px] rounded-full bg-mint/15 blur-[140px]" />

      <header className="relative z-10 mx-auto max-w-3xl px-5 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="size-4" /> 返回
          </Link>
          <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-coral via-sun to-mint"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="mt-5">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            {STEPS[step].title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            {step === 0 && <StepBasic data={data} update={update} />}
            {step === 1 && <StepPhotos data={data} update={update} />}
            {step === 2 && <StepBio data={data} update={update} />}
            {step === 3 && <StepTags data={data} update={update} />}
            {step === 4 && <StepLifestyle data={data} update={update} />}
            {step === 5 && <StepIntent data={data} update={update} />}
            {step === 6 && <StepVerify data={data} update={update} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="inline-flex h-11 px-5 items-center gap-2 rounded-full border border-border bg-surface/60 text-sm hover:bg-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="size-4" /> 上一步
          </button>
          <div className="flex-1 text-center">
            {error && <span className="text-xs text-destructive">{error}</span>}
          </div>
          <button
            onClick={next}
            className="inline-flex h-11 px-6 items-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold glow-coral hover:scale-[1.02] active:scale-[0.98] transition"
          >
            {step === STEPS.length - 1 ? "完成并进入" : "下一步"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Shared atoms ---------- */

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-coral">*</span>}
          {!required && <span className="ml-1 text-[10px] text-muted-foreground">可选</span>}
        </label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-11 rounded-xl bg-background border-2 border-border px-4 text-sm text-foreground outline-none focus:border-coral focus:ring-2 focus:ring-coral/30 transition placeholder:text-muted-foreground/60 shadow-inner"
    />
  );
}

function Chip({ active, onClick, children, locked }: { active: boolean; onClick: () => void; children: React.ReactNode; locked?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked && !active}
      className={[
        "inline-flex items-center gap-1 h-9 px-4 rounded-full border text-sm transition",
        active
          ? "bg-coral text-primary-foreground border-coral glow-coral"
          : "bg-surface/60 border-border text-foreground hover:border-coral/60",
        locked && !active ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {active && <Check className="size-3.5" />} {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-surface/50 border border-border p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Step 1: Basic ---------- */

function StepBasic({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  return (
    <Card className="space-y-5">
      <Field label="昵称" required hint={`${data.nickname.length}/16`}>
        <TextInput
          maxLength={16}
          placeholder="给自己起个有记忆点的名字"
          value={data.nickname}
          onChange={(e) => update({ nickname: e.target.value })}
        />
      </Field>

      <Field label="性别" required>
        <div className="flex gap-2">
          {["女生","男生","其他"].map((g) => (
            <Chip key={g} active={data.gender === g} onClick={() => update({ gender: g })}>{g}</Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="出生日期" required>
          <TextInput type="date" value={data.birthday} onChange={(e) => update({ birthday: e.target.value })} />
        </Field>
        <Field label="所在城市" required>
          <TextInput placeholder="如：上海" value={data.city} onChange={(e) => update({ city: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="家乡"><TextInput placeholder="老家在哪里" value={data.hometown} onChange={(e) => update({ hometown: e.target.value })} /></Field>
        <Field label="身高"><TextInput placeholder="cm" inputMode="numeric" value={data.height} onChange={(e) => update({ height: e.target.value })} /></Field>
      </div>

      <Field label="学历">
        <div className="flex flex-wrap gap-2">
          {["高中及以下","大专","本科","硕士","博士"].map((x) => (
            <Chip key={x} active={data.education === x} onClick={() => update({ education: x })}>{x}</Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="职业/行业"><TextInput placeholder="如：产品经理" value={data.job} onChange={(e) => update({ job: e.target.value })} /></Field>
        <Field label="学校/公司"><TextInput placeholder="可后续认证" value={data.school} onChange={(e) => update({ school: e.target.value })} /></Field>
      </div>
    </Card>
  );
}

/* ---------- Step 2: Photos ---------- */

function StepPhotos({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (files: FileList | null) => {
    if (!files) return;
    const remain = 8 - data.photos.length;
    const arr = Array.from(files).slice(0, remain);
    Promise.all(
      arr.map((f) => new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(f);
      }))
    ).then((urls) => update({ photos: [...data.photos, ...urls] }));
  };

  const remove = (i: number) => {
    const next = data.photos.filter((_, idx) => idx !== i);
    update({ photos: next, mainIdx: Math.min(data.mainIdx, Math.max(0, next.length - 1)) });
  };

  const slots = useMemo(() => Array.from({ length: 8 }, (_, i) => data.photos[i] || null), [data.photos]);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">已上传 <span className="text-foreground font-semibold">{data.photos.length}</span> / 8</p>
        <span className="text-xs text-muted-foreground">第一张为主头像</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {slots.map((src, i) => (
          <div key={i} className="aspect-[3/4] relative">
            {src ? (
              <div
                className={[
                  "size-full rounded-xl overflow-hidden border-2 cursor-pointer group relative",
                  data.mainIdx === i ? "border-coral glow-coral" : "border-border",
                ].join(" ")}
                onClick={() => update({ mainIdx: i })}
              >
                <img src={src} alt="" className="size-full object-cover" />
                {data.mainIdx === i && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-coral text-primary-foreground text-[10px] font-semibold">
                    <Star className="size-3 fill-current" /> 封面
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 backdrop-blur grid place-items-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="size-full rounded-xl border-2 border-dashed border-border bg-surface/40 hover:border-coral/60 hover:bg-surface transition grid place-items-center text-muted-foreground"
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />

      <div className="grid grid-cols-3 gap-2 pt-2">
        {[
          { icon: <Camera className="size-4" />, label: "主头像", req: true },
          { icon: <ImageIcon className="size-4" />, label: "生活照", req: false },
          { icon: <Heart className="size-4" />, label: "兴趣照", req: false },
        ].map((t) => (
          <div key={t.label} className="rounded-xl bg-surface/40 border border-border px-3 py-2.5 text-xs flex items-center gap-2">
            <span className="text-coral">{t.icon}</span>
            <span className="text-foreground">{t.label}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{t.req ? "必填" : "建议"}</span>
          </div>
        ))}
      </div>

      <Field label="15s 视频动态">
        <button
          onClick={() => update({ videoIntro: data.videoIntro ? "" : "video.mp4" })}
          className="w-full h-14 rounded-xl border border-dashed border-border bg-surface/40 hover:border-coral/60 transition flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Video className="size-4" />
          {data.videoIntro ? "已添加视频动态 · 点击移除" : "录制或上传 15 秒视频（可选）"}
        </button>
      </Field>
    </Card>
  );
}

/* ---------- Step 3: Bio ---------- */

function StepBio({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  return (
    <Card className="space-y-5">
      <Field label="个性签名" required hint={`${data.signature.length}/150`}>
        <textarea
          maxLength={150}
          rows={3}
          placeholder="一句话，让别人记住你 · 50~150 字"
          value={data.signature}
          onChange={(e) => update({ signature: e.target.value })}
          className="w-full rounded-xl bg-surface/70 border border-border px-4 py-3 text-sm outline-none focus:border-coral/60 transition placeholder:text-muted-foreground resize-none"
        />
      </Field>

      <Field label="自我介绍" hint={`${data.intro.length}/500`}>
        <textarea
          maxLength={500}
          rows={5}
          placeholder="聊聊你的日常、爱好、最近在追的剧、想去的地方……"
          value={data.intro}
          onChange={(e) => update({ intro: e.target.value })}
          className="w-full rounded-xl bg-surface/70 border border-border px-4 py-3 text-sm outline-none focus:border-coral/60 transition placeholder:text-muted-foreground resize-none"
        />
      </Field>

      <Field label="当前状态">
        <div className="flex flex-wrap gap-2">
          {["在家躺平","加班中","刚下班","想找人吃饭","旅行ing","周末发呆","出差中"].map((s) => (
            <Chip key={s} active={data.status === s} onClick={() => update({ status: data.status === s ? "" : s })}>{s}</Chip>
          ))}
        </div>
      </Field>
    </Card>
  );
}

/* ---------- Step 4: Tags ---------- */

function StepTags({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  const toggle = (key: "interests" | "personality", tag: string, max: number) => {
    const arr = data[key];
    if (arr.includes(tag)) update({ [key]: arr.filter((t) => t !== tag) } as any);
    else if (arr.length < max) update({ [key]: [...arr, tag] } as any);
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold">兴趣爱好</h3>
            <p className="text-xs text-muted-foreground mt-0.5">最多选 15 个，用于匹配同频的人</p>
          </div>
          <span className={`text-sm font-semibold ${data.interests.length >= 15 ? "text-coral" : "text-muted-foreground"}`}>
            {data.interests.length}/15
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((t) => (
            <Chip
              key={t}
              active={data.interests.includes(t)}
              locked={data.interests.length >= 15}
              onClick={() => toggle("interests", t, 15)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold">性格标签</h3>
            <p className="text-xs text-muted-foreground mt-0.5">最多选 8 个，描述真实的你</p>
          </div>
          <span className={`text-sm font-semibold ${data.personality.length >= 8 ? "text-coral" : "text-muted-foreground"}`}>
            {data.personality.length}/8
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TAGS.map((t) => (
            <Chip
              key={t}
              active={data.personality.includes(t)}
              locked={data.personality.length >= 8}
              onClick={() => toggle("personality", t, 8)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </Card>

      <Card className="grid grid-cols-2 gap-4">
        <Field label="MBTI">
          <div className="flex flex-wrap gap-1.5">
            {MBTI.map((m) => (
              <button
                key={m}
                onClick={() => update({ mbti: data.mbti === m ? "" : m })}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono font-semibold transition ${
                  data.mbti === m ? "bg-mint text-background" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>
        <Field label="星座">
          <div className="flex flex-wrap gap-1.5">
            {ZODIAC.map((z) => (
              <button
                key={z}
                onClick={() => update({ zodiac: data.zodiac === z ? "" : z })}
                className={`h-8 px-2.5 rounded-lg text-xs transition ${
                  data.zodiac === z ? "bg-sun text-background font-semibold" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </Field>
      </Card>
    </div>
  );
}

/* ---------- Step 5: Lifestyle ---------- */

function StepLifestyle({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  const rows: Array<{ key: keyof Profile; label: string; icon: React.ReactNode; options: string[] }> = [
    { key: "smoke", label: "抽烟", icon: <Cigarette className="size-4" />, options: ["不抽","偶尔","社交场合","抽"] },
    { key: "drink", label: "喝酒", icon: <Wine className="size-4" />, options: ["不喝","偶尔小酌","聚会喝","酒鬼一枚"] },
    { key: "sleep", label: "作息", icon: <Moon className="size-4" />, options: ["早睡早起","规律","夜猫子","昼夜颠倒"] },
    { key: "diet", label: "饮食", icon: <Utensils className="size-4" />, options: ["火锅党","健身餐","素食","什么都吃","brunch 爱好者"] },
    { key: "pet", label: "宠物", icon: <Cat className="size-4" />, options: ["猫派","狗派","都爱","没养","想养"] },
  ];

  return (
    <Card className="space-y-5">
      {rows.map((row) => (
        <div key={row.key as string}>
          <div className="flex items-center gap-2 mb-2.5 text-sm font-medium">
            <span className="size-7 rounded-lg bg-surface grid place-items-center text-coral">{row.icon}</span>
            {row.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {row.options.map((o) => (
              <Chip
                key={o}
                active={data[row.key] === o}
                onClick={() => update({ [row.key]: data[row.key] === o ? "" : o } as any)}
              >
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ---------- Step 6: Intent ---------- */

function StepIntent({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  const toggleIntent = (t: string) => {
    update({ intent: data.intent.includes(t) ? data.intent.filter(x => x !== t) : [...data.intent, t] });
  };
  return (
    <div className="space-y-5">
      <Card>
        <Field label="交友目的" required hint="可多选">
          <div className="flex flex-wrap gap-2">
            {INTENT.map((t) => (
              <Chip key={t} active={data.intent.includes(t)} onClick={() => toggleIntent(t)}>{t}</Chip>
            ))}
          </div>
        </Field>
      </Card>

      <Card className="space-y-5">
        <Field label="感情状态">
          <div className="flex flex-wrap gap-2">
            {["单身","开放交友","暧昧中","稳定关系","一言难尽"].map((s) => (
              <Chip key={s} active={data.relationship === s} onClick={() => update({ relationship: data.relationship === s ? "" : s })}>{s}</Chip>
            ))}
          </div>
        </Field>

        <Field label="理想型" hint={`${data.idealType.length}/200`}>
          <textarea
            maxLength={200}
            rows={3}
            placeholder="希望 TA 是什么样的人？"
            value={data.idealType}
            onChange={(e) => update({ idealType: e.target.value })}
            className="w-full rounded-xl bg-surface/70 border border-border px-4 py-3 text-sm outline-none focus:border-coral/60 transition placeholder:text-muted-foreground resize-none"
          />
        </Field>

        <Field label="年龄偏好" hint={`${data.ageRange[0]} – ${data.ageRange[1]} 岁`}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">最小</span>
              <input
                type="range" min={18} max={60} value={data.ageRange[0]}
                onChange={(e) => update({ ageRange: [Number(e.target.value), Math.max(Number(e.target.value), data.ageRange[1])] })}
                className="w-full accent-coral"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">最大</span>
              <input
                type="range" min={18} max={60} value={data.ageRange[1]}
                onChange={(e) => update({ ageRange: [Math.min(data.ageRange[0], Number(e.target.value)), Number(e.target.value)] })}
                className="w-full accent-coral"
              />
            </div>
          </div>
        </Field>

        <Field label="距离偏好">
          <div className="flex flex-wrap gap-2">
            {["3km 内","同城","本省","全国"].map((d) => (
              <Chip key={d} active={data.distance === d} onClick={() => update({ distance: d })}>
                <MapPin className="size-3.5" /> {d}
              </Chip>
            ))}
          </div>
        </Field>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-sun" /> 破冰问题（可选）
        </div>
        <p className="text-xs text-muted-foreground">设置一个问题让对方回答，降低搭讪门槛</p>
        <TextInput
          placeholder="例如：周末最想去哪里发呆？"
          value={data.icebreaker}
          onChange={(e) => update({ icebreaker: e.target.value })}
        />
      </Card>
    </div>
  );
}

/* ---------- Step 7: Verify ---------- */

function StepVerify({ data, update }: { data: Profile; update: (p: Partial<Profile>) => void }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="size-4 text-coral" /> 手机认证
          <span className="ml-auto text-[10px] text-coral">必填</span>
        </div>
        <div className="flex gap-2">
          <TextInput
            placeholder="手机号"
            inputMode="numeric"
            maxLength={11}
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value.replace(/\D/g, "") })}
          />
          <button className="shrink-0 h-11 px-4 rounded-xl border border-border bg-surface text-sm hover:bg-surface-2 transition">
            获取验证码
          </button>
        </div>
        <TextInput placeholder="6 位短信验证码" inputMode="numeric" maxLength={6} />
      </Card>

      <button
        onClick={() => update({ verifyReal: !data.verifyReal })}
        className={`w-full text-left rounded-2xl border p-5 transition ${
          data.verifyReal ? "border-mint bg-mint/10" : "border-border bg-surface/50 hover:bg-surface"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl grid place-items-center ${data.verifyReal ? "bg-mint text-background" : "bg-surface-2 text-mint"}`}>
            <BadgeCheck className="size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">真人认证</span>
              <span className="text-[10px] text-muted-foreground">建议</span>
              {data.verifyReal && <Check className="size-4 text-mint ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">面部识别确认是真人，匹配率提升 3 倍，防机器人骚扰</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => update({ verifyStudent: !data.verifyStudent })}
        className={`w-full text-left rounded-2xl border p-5 transition ${
          data.verifyStudent ? "border-sun bg-sun/10" : "border-border bg-surface/50 hover:bg-surface"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl grid place-items-center ${data.verifyStudent ? "bg-sun text-background" : "bg-surface-2 text-sun"}`}>
            <GraduationCap className="size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">学生认证</span>
              <span className="text-[10px] text-muted-foreground">可选</span>
              {data.verifyStudent && <Check className="size-4 text-sun ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">解锁校园社交圈，遇见同校或同城高校的人</p>
          </div>
        </div>
      </button>

      <Card className="bg-surface/30">
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-mint mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Pulse 启用 24h 风控体系，任何用户均可一键 <span className="text-foreground font-medium">举报 / 拉黑</span>。
            我们承诺：照片仅用于审核，绝不公开你的真实姓名与手机号。
          </div>
        </div>
      </Card>

      <Card>
        <Preview data={data} />
      </Card>
    </div>
  );
}

function Preview({ data }: { data: Profile }) {
  const cover = data.photos[data.mainIdx] || data.photos[0];
  return (
    <div className="flex items-center gap-4">
      <div className="size-16 rounded-2xl overflow-hidden bg-surface-2 grid place-items-center shrink-0">
        {cover ? <img src={cover} alt="" className="size-full object-cover" /> : <User2 className="size-6 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold truncate">{data.nickname || "未命名"}</span>
          {data.gender && <span className="text-xs text-muted-foreground">· {data.gender}</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {data.city || "未填城市"} · {data.interests.length} 兴趣 · {data.personality.length} 性格
        </p>
        <p className="text-xs text-foreground/80 truncate mt-1">{data.signature || "（个性签名待填写）"}</p>
      </div>
    </div>
  );
}
