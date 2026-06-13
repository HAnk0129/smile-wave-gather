import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function Header({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-border backdrop-blur-xl text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, #FF8A00 0%, #FF8A00 55%, #FFFFFF 100%)",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
        <Link to="/" className="grid h-9 w-9 place-items-center rounded-xl border border-white/40 bg-white/20 text-white"><ChevronLeft className="h-4 w-4" /></Link>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white">{icon}</div>
        <div>
          <h1 className="font-display text-lg font-semibold leading-tight text-white">{title}</h1>
          {subtitle && <p className="text-[11px] text-white/90">{subtitle}</p>}
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