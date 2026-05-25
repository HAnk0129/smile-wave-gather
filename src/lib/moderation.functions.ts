import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Block a user. Idempotent. */
export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ targetId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.targetId === userId) throw new Error("不能拉黑自己");
    const { error } = await supabase
      .from("blocks")
      .upsert(
        { blocker_id: userId, blocked_id: data.targetId },
        { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Unblock a user. */
export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ targetId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", data.targetId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** List ids of users the current user has blocked. */
export const listBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_id, created_at")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { blocked: (data ?? []).map((r: any) => r.blocked_id as string) };
  });

const REPORT_REASONS = [
  "spam",
  "harassment",
  "nudity",
  "hate",
  "violence",
  "scam",
  "underage",
  "self_harm",
  "other",
] as const;

const TARGET_TYPES = ["user", "post", "treehole", "message", "comment"] as const;

/** Create a report against another user, post, message, etc. */
export const reportContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        targetType: z.enum(TARGET_TYPES),
        targetId: z.string().uuid(),
        reason: z.enum(REPORT_REASONS),
        detail: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      target_type: data.targetType,
      target_id: data.targetId,
      reason: data.reason,
      detail: data.detail ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });