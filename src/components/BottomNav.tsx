import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, MessageCircle, Plus, User, Users } from "lucide-react";

export type BottomNavActive = "community" | "explore" | "games" | "me" | "messages";

/**
 * Unified bottom navigation used across the main app pages.
 * The center "+" opens the publisher: if a local `onCompose` is provided
 * (e.g. on the community page) it triggers it; otherwise it navigates to
 * /community with `?compose=1` which auto-opens the compose sheet.
 */
export function BottomNav({
  active,
  onCompose,
}: {
  active: BottomNavActive;
  onCompose?: () => void;
}) {
  const nav = useNavigate();
  const items = [
    { key: "community", to: "/community", icon: Users, label: "社区" },
    { key: "explore", to: "/explore", icon: Compass, label: "发现" },
    { type: "compose" as const },
    { key: "messages", to: "/messages", icon: MessageCircle, label: "消息" },
    { key: "me", to: "/me", icon: User, label: "我的" },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t border-border" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-3xl grid grid-cols-5 h-16 items-center">
        {items.map((it) => {
          if ("type" in it && it.type === "compose") {
            return (
              <button
                key="compose"
                onClick={() => {
                  if (onCompose) onCompose();
                  else nav({ to: "/community", search: { compose: 1 } as never });
                }}
                aria-label="发布内容"
                className="flex items-center justify-center"
              >
                <span className="size-12 rounded-full bg-gradient-to-br from-coral to-sun text-background shadow-lg glow-coral flex items-center justify-center active:scale-95 transition -mt-4">
                  <Plus className="size-6" />
                </span>
              </button>
            );
          }
          const isActive = it.key === active;
          return (
            <Link
              key={it.key}
              to={it.to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                isActive ? "text-coral" : "text-muted-foreground"
              }`}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}