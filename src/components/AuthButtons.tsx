import { Link } from "@tanstack/react-router";
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from "react";

/** 统一霓虹机能风按钮：玻璃描边（ghost） + 珊瑚红硬投影（coral）。
 *  作为 <button> 使用；如需 <Link>，用 NeonLinkButton。 */
type Variant = "ghost" | "coral";

const sizeMap: Record<Variant, string> = {
  ghost: "px-7 py-2.5",
  coral: "px-9 py-2.5",
};

function NeonInner({ variant, children }: { variant: Variant; children: ReactNode }) {
  if (variant === "ghost") {
    return (
      <>
        <span className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-[#4ADE80]/60 transition-colors" />
        <span className="absolute inset-0 rounded-full bg-white/5 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="absolute -top-1 -left-1 size-2 rounded-full bg-[#4ADE80] scale-0 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_10px_#4ADE80]" />
        <span className="relative font-bold tracking-wider text-sm text-white inline-flex items-center gap-2">{children}</span>
      </>
    );
  }
  return (
    <>
      <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full bg-[#FACC15] transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
      <span className="absolute inset-0 rounded-full bg-[#FF3B5C] shadow-[0_0_25px_rgba(255,59,92,0.4)] group-hover:shadow-[0_0_40px_rgba(255,59,92,0.6)] transition-all" />
      <span className="absolute inset-0 rounded-full overflow-hidden opacity-20">
        <span className="absolute top-0 -left-[100%] w-1/2 h-full bg-white skew-x-[-30deg] group-hover:left-[150%] transition-all duration-700" />
      </span>
      <span className="relative font-extrabold tracking-widest text-sm text-[#0a0a0f] inline-flex items-center gap-2">{children}</span>
    </>
  );
}

const baseCls = "group relative inline-flex items-center cursor-pointer transition-all duration-300 active:scale-95";
const hoverCls: Record<Variant, string> = {
  ghost: "",
  coral: "hover:-translate-y-1 active:translate-y-0",
};

export const NeonButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { variant?: Variant }>(
  ({ variant = "ghost", className = "", children, ...rest }, ref) => (
    <button ref={ref} className={`${baseCls} ${sizeMap[variant]} ${hoverCls[variant]} ${className}`} {...rest}>
      <NeonInner variant={variant}>{children}</NeonInner>
    </button>
  ),
);
NeonButton.displayName = "NeonButton";

export function NeonLinkButton({
  variant = "ghost",
  className = "",
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof Link> & { variant?: Variant }) {
  return (
    // @ts-expect-error TanStack Link generic typing
    <Link className={`${baseCls} ${sizeMap[variant]} ${hoverCls[variant]} ${className}`} {...rest}>
      <NeonInner variant={variant}>{children}</NeonInner>
    </Link>
  );
}

export function AuthButtons() {
  return (
    <div className="flex items-center gap-5">
      <NeonLinkButton to="/auth" search={{ mode: "login", redirect: "/discover" }} variant="ghost">
        登录
      </NeonLinkButton>
      <NeonLinkButton to="/auth" search={{ mode: "signup", redirect: "/onboarding" }} variant="coral">
        注册
      </NeonLinkButton>
    </div>
  );
}