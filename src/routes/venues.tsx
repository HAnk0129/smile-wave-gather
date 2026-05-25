import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, MapPin, Users as UsersIcon, Clock, X } from "lucide-react";
import { toast } from "sonner";
import {
  listVenues, listMyBookings, listVenueBookings, createBooking, cancelBooking,
  type Venue,
} from "@/lib/venues.functions";
import { BottomNav } from "@/components/BottomNav";
import { Header, EmptyState } from "@/routes/contests";

export const Route = createFileRoute("/venues")({
  head: () => ({
    meta: [
      { title: "场地预约 · Pulse" },
      { name: "description", content: "图书馆讨论室、剧场、运动场地等校园资源,一键预约。" },
    ],
  }),
  component: VenuesPage,
});

function VenuesPage() {
  const fetchVenues = useServerFn(listVenues);
  const fetchMine = useServerFn(listMyBookings);
  const [picked, setPicked] = useState<Venue | null>(null);
  const [tab, setTab] = useState<"all" | "mine">("all");

  const venues = useQuery({ queryKey: ["venues"], queryFn: () => fetchVenues() });
  const mine = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchMine(), enabled: tab === "mine" });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Header title="场地预约" subtitle="校园资源,一键搞定" icon={<CalendarDays className="h-5 w-5" />} />
      <div className="mx-auto max-w-3xl px-5">
        <div className="mt-3 inline-flex rounded-full border border-border bg-surface/60 p-1 text-xs">
          {(["all", "mine"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 ${tab === t ? "bg-coral text-background" : "text-muted-foreground"}`}>
              {t === "all" ? "全部场地" : "我的预约"}
            </button>
          ))}
        </div>

        {tab === "all" && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(venues.data?.venues ?? []).map((v) => (
              <button key={v.id} onClick={() => setPicked(v)}
                className="overflow-hidden rounded-2xl border border-border bg-surface/70 p-4 text-left backdrop-blur transition hover:border-coral">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] text-coral">{v.category}</span>
                  {v.capacity && <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><UsersIcon className="h-3 w-3" />{v.capacity}人</span>}
                </div>
                <h3 className="mt-2 font-display text-base font-semibold">{v.name}</h3>
                {v.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>}
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {v.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</span>}
                  {v.open_hours && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{v.open_hours}</span>}
                </div>
                <div className="mt-3 text-xs font-medium text-coral">立即预约 →</div>
              </button>
            ))}
            {venues.isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          </div>
        )}

        {tab === "mine" && (
          <div className="mt-4 space-y-3">
            {mine.isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
            {!mine.isLoading && (mine.data?.bookings ?? []).length === 0 && (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} text="还没有预约,去全部场地看看吧" />
            )}
            {(mine.data?.bookings ?? []).map((b) => (
              <MyBookingCard key={b.id} b={b} onCancel={() => mine.refetch()} />
            ))}
          </div>
        )}
      </div>

      {picked && <BookSheet venue={picked} onClose={() => setPicked(null)} />}
      <BottomNav active="explore" />
    </div>
  );
}

function MyBookingCard({ b, onCancel }: { b: any; onCancel: () => void }) {
  const cancelFn = useServerFn(cancelBooking);
  const m = useMutation({
    mutationFn: () => cancelFn({ data: { id: b.id } }),
    onSuccess: () => { toast.success("已取消"); onCancel(); },
    onError: (e: any) => toast.error(e?.message ?? "操作失败"),
  });
  const colors: Record<string, string> = {
    pending: "bg-sun/15 text-sun",
    approved: "bg-mint/15 text-mint",
    rejected: "bg-destructive/15 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已驳回", cancelled: "已取消" };
  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold">{b.venue_name ?? "场地"}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">用途:{b.purpose}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${colors[b.status]}`}>{labels[b.status]}</span>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        {fmtTime(b.starts_at)} – {fmtTime(b.ends_at)} · {b.attendees} 人
      </div>
      {b.review_note && <p className="mt-1 text-[11px] text-muted-foreground">备注: {b.review_note}</p>}
      {(b.status === "pending" || b.status === "approved") && (
        <button onClick={() => m.mutate()} disabled={m.isPending}
          className="mt-3 text-xs text-destructive">取消预约</button>
      )}
    </article>
  );
}

function BookSheet({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const createFn = useServerFn(createBooking);
  const fetchSlots = useServerFn(listVenueBookings);
  const qc = useQueryClient();
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [contact, setContact] = useState("");

  const slots = useQuery({
    queryKey: ["venue-slots", venue.id],
    queryFn: () => fetchSlots({ data: { venue_id: venue.id } }),
  });

  const m = useMutation({
    mutationFn: () => createFn({ data: {
      venue_id: venue.id,
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(ends).toISOString(),
      purpose, attendees, contact: contact || null,
    }}),
    onSuccess: () => {
      toast.success("预约已提交,等待审核");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "预约失败"),
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">{venue.name}</h2>
            {venue.location && <p className="mt-0.5 text-xs text-muted-foreground">{venue.location} · {venue.open_hours}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-border"><X className="h-4 w-4" /></button>
        </div>

        {(slots.data?.slots ?? []).length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-surface/60 p-3">
            <p className="text-[11px] text-muted-foreground">已被占用的时段:</p>
            <div className="mt-1 space-y-0.5 text-[11px]">
              {(slots.data?.slots ?? []).slice(0, 6).map((s: any, i: number) => (
                <div key={i}>{fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Field label="开始时间"><input type="datetime-local" className={ipt} value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
          <Field label="结束时间"><input type="datetime-local" className={ipt} value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
          <Field label="使用人数"><input type="number" min={1} className={ipt} value={attendees} onChange={(e) => setAttendees(parseInt(e.target.value) || 1)} /></Field>
          <Field label="用途"><input className={ipt} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="如:小组讨论 / 社团排练" /></Field>
          <Field label="联系方式 (可选)"><input className={ipt} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="微信/电话" /></Field>
        </div>
        <button disabled={m.isPending || !starts || !ends || !purpose}
          onClick={() => m.mutate()}
          className="mt-5 w-full rounded-xl bg-coral py-3 text-sm font-semibold text-background disabled:opacity-50">
          {m.isPending ? "提交中…" : "提交预约"}
        </button>
      </div>
    </div>
  );
}

const ipt = "w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-coral";
function Field({ label, children }: any) {
  return <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>;
}
function fmtTime(s: string) {
  try { return new Date(s).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return s; }
}