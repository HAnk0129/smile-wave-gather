import { Link } from "@tanstack/react-router";
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from "react";

/** 统一霓虹机能风按钮：玻璃描边（ghost） + 珊瑚红硬投影（coral）。
 *  作为 <button> 使用；如需 <Link>，用 NeonLinkButton。 */
export type NeonVariant = "ghost" | "coral";

const sizeMap: Record<NeonVariant, string> = {
  ghost: "px-7 py-2.5",
  coral: "px-7 py-2.5",
};

export function NeonInner({ variant, children }: { variant: NeonVariant; children: ReactNode }) {
  if (variant === "ghost") {
    return (
      <>
        <span className="absolute inset-0 rounded-[10px] border-2 border-[#7F77DD] transition-colors" />
        <span className="relative font-semibold tracking-wide text-sm text-[#7F77DD] inline-flex items-center gap-2">{children}</span>
      </>
    );
  }
  return (
    <>
      <span className="absolute inset-0 rounded-[10px] bg-[#E54848]" />
      <span className="relative font-semibold tracking-wide text-sm text-white inline-flex items-center gap-2">{children}</span>
    </>
  );
}

const baseCls = "group relative inline-flex items-center cursor-pointer transition-all duration-300 active:scale-95";
const hoverCls: Record<NeonVariant, string> = {
  ghost: "",
  coral: "",
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