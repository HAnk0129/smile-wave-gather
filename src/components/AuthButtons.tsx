import { Link } from "@tanstack/react-router";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-5">
      {/* 登录：玻璃描边 + 薄荷高亮角点 */}
      <Link
        to="/auth"
        search={{ mode: "login", redirect: "/discover" }}
        className="group relative inline-flex items-center px-7 py-2.5 cursor-pointer transition-all duration-300 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-[#4ADE80]/60 transition-colors" />
        <span className="absolute inset-0 rounded-full bg-white/5 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="absolute -top-1 -left-1 size-2 rounded-full bg-[#4ADE80] scale-0 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_10px_#4ADE80]" />
        <span className="relative font-bold tracking-wider text-sm text-white">登录</span>
      </Link>

      {/* 注册：珊瑚红主体 + 活力黄硬投影 + 高光扫光 */}
      <Link
        to="/auth"
        search={{ mode: "signup", redirect: "/onboarding" }}
        className="group relative inline-flex items-center px-9 py-2.5 cursor-pointer transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95"
      >
        <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full bg-[#FACC15] transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
        <span className="absolute inset-0 rounded-full bg-[#FF3B5C] shadow-[0_0_25px_rgba(255,59,92,0.4)] group-hover:shadow-[0_0_40px_rgba(255,59,92,0.6)] transition-all" />
        <span className="absolute inset-0 rounded-full overflow-hidden opacity-20">
          <span className="absolute top-0 -left-[100%] w-1/2 h-full bg-white skew-x-[-30deg] group-hover:left-[150%] transition-all duration-700" />
        </span>
        <span className="relative font-extrabold tracking-widest text-sm text-[#0a0a0f]">注册</span>
      </Link>
    </div>
  );
}