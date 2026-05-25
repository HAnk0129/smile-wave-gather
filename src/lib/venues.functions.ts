import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Venue = {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  category: string;
  location: string | null;
  capacity: number | null;
  open_hours: string | null;
  rules: string | null;
  active: boolean;
};

export type VenueBooking = {
  id: string;
  venue_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  purpose: string;
  attendees: number;
  contact: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  review_note: string | null;
  created_at: string;
  venue_name?: string | null;
};

export const listVenues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("venues")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { venues: (data ?? []) as Venue[] };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("venue_bookings")
      .select("*, venues(name)")
      .eq("user_id", userId)
      .order("starts_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((r: any) => ({ ...r, venue_name: r.venues?.name ?? null }));
    return { bookings: rows as VenueBooking[] };
  });

export const listVenueBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { venue_id: string }) =>
    z.object({ venue_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // user can only see own bookings; this returns upcoming slots that are taken so the UI can hint
    const { data: rows, error } = await context.supabase
      .from("venue_bookings")
      .select("starts_at, ends_at, status")
      .eq("venue_id", data.venue_id)
      .in("status", ["pending", "approved"])
      .gte("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { slots: rows ?? [] };
  });

const BookingInput = z
  .object({
    venue_id: z.string().uuid(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    purpose: z.string().min(2).max(200),
    attendees: z.number().int().min(1).max(500).default(1),
    contact: z.string().max(120).optional().nullable(),
  })
  .refine((v) => new Date(v.ends_at).getTime() > new Date(v.starts_at).getTime(), {
    message: "结束时间必须晚于开始时间",
    path: ["ends_at"],
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookingInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("venue_bookings")
      .insert({ ...data, user_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { booking: row as VenueBooking };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("venue_bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });