import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function Header({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-border backdrop-blur-xl"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(255,138,0,0.8) 0%, rgba(255,138,0,0.8) 20%, rgba(255,138,0,0.4) 50%, rgba(255,138,0,0) 80%), radial-gradient(circle at top right, rgba(255,138,0,0.8) 0%, rgba(255,138,0,0.8) 20%, rgba(255,138,0,0.4) 50%, rgba(255,138,0,0) 80%), linear-gradient(#FFFFFF, #FFFFFF)",
        backgroundColor: "#FFFFFF",
        color: "#331915",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
        <Link to="/" className="grid h-9 w-9 place-items-center rounded-xl bg-white/30 text-[#331915]"><ChevronLeft className="h-4 w-4" /></Link>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/30 text-[#331915]">{icon}</div>
        <div>
          <h1 className="font-display text-lg font-semibold leading-tight text-[#331915]">{title}</h1>
          {subtitle && <p className="text-[11px] text-[#331915]/80">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface/60 text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}