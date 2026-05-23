import { Link } from "@tanstack/react-router";
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from "react";

/** 统一霓虹机能风按钮：玻璃描边（ghost） + 珊瑚红硬投影（coral）。
 *  作为 <button> 使用；如需 <Link>，用 NeonLinkButton。 */
export type NeonVariant = "ghost" | "coral";

const sizeMap: Record<NeonVariant, string> = {
  ghost: "px-7 py-2.5",
  coral: "px-9 py-2.5",
};

export function NeonInner({ variant, children }: { variant: NeonVariant; children: ReactNode }) {
  if (variant === "ghost") {
    return (
      <>
        <span className="absolute inset-0 rounded-full border-2 border-[#FF3B5C]/60 group-hover:border-[#FF3B5C] transition-colors" />
        <span className="absolute inset-0 rounded-full bg-[#FF3B5C]/10 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="absolute -top-1 -left-1 size-2 rounded-full bg-[#FF3B5C] scale-0 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_10px_#FF3B5C]" />
        <span className="relative font-bold tracking-wider text-sm text-[#FF3B5C] inline-flex items-center gap-2">{children}</span>
      </>
    );
  }
  return (
    <>
      <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full bg-[#B91C3C] transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
      <span className="absolute inset-0 rounded-full bg-[#FF3B5C] shadow-[0_0_25px_rgba(255,59,92,0.4)] group-hover:shadow-[0_0_40px_rgba(255,59,92,0.6)] transition-all" />
      <span className="absolute inset-0 rounded-full overflow-hidden opacity-20">
        <span className="absolute top-0 -left-[100%] w-1/2 h-full bg-white skew-x-[-30deg] group-hover:left-[150%] transition-all duration-700" />
      </span>
      <span className="relative font-extrabold tracking-widest text-sm text-white inline-flex items-center gap-2">{children}</span>
    </>
  );
}

const baseCls = "group relative inline-flex items-center cursor-pointer transition-all duration-300 active:scale-95";
const hoverCls: Record<NeonVariant, string> = {
  ghost: "",
  coral: "hover:-translate-y-1 active:translate-y-0",
};

export function neonButtonClass(variant: NeonVariant = "ghost", extra = "") {
  return `${baseCls} ${sizeMap[variant]} ${hoverCls[variant]} ${extra}`;
}

export const NeonButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { variant?: NeonVariant }>(
  ({ variant = "ghost", className = "", children, ...rest }, ref) => (
    <button ref={ref} className={neonButtonClass(variant, className)} {...rest}>
      <NeonInner variant={variant}>{children}</NeonInner>
    </button>
  ),
);
NeonButton.displayName = "NeonButton";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-5">
      <Link
        to="/auth"
        search={{ mode: "login", redirect: "/discover" }}
        className={neonButtonClass("ghost")}
      >
        <NeonInner variant="ghost">登录</NeonInner>
      </Link>
      <Link
        to="/auth"
        search={{ mode: "signup", redirect: "/onboarding" }}
        className={neonButtonClass("coral")}
      >
        <NeonInner variant="coral">注册</NeonInner>
      </Link>
    </div>
  );
}