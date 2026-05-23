import { Link } from "@tanstack/react-router";
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from "react";

/** 统一霓虹机能风按钮：玻璃描边（ghost） + 珊瑚红硬投影（coral）。
 *  作为 <button> 使用；如需 <Link>，用 NeonLinkButton。 */
export type NeonVariant = "ghost" | "coral";

const sizeMap: Record<NeonVariant, string> = {
  ghost: "px-9 py-2.5",
  coral: "px-9 py-2.5",
};

export function NeonInner({ variant, children }: { variant: NeonVariant; children: ReactNode }) {
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
  ghost: "hover:-translate-y-1 active:translate-y-0",
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