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

const TARGET_TYPES = ["user", "post", "treehole", "message", "comment", "video", "video_comment"] as const;

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

/** 当前用户提交过的举报列表 */
export const listMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reports")
      .select("id,target_type,target_id,reason,detail,status,resolution_note,resolved_at,created_at")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

const APPEAL_KINDS = ["report_rejected", "content_removed", "account_action", "other"] as const;

/** 提交申诉 */
export const submitAppeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(APPEAL_KINDS),
        reason: z.string().trim().min(10, "请至少说明 10 个字").max(1000),
        targetType: z.enum(TARGET_TYPES).optional(),
        targetId: z.string().uuid().optional(),
        relatedReportId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // 同一目标 24h 内只能申诉一次,避免刷
    if (data.relatedReportId) {
      const { data: existing } = await supabase
        .from("appeals")
        .select("id")
        .eq("user_id", userId)
        .eq("related_report_id", data.relatedReportId)
        .in("status", ["pending", "reviewing"])
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error("该举报已有正在处理的申诉,请耐心等待");
      }
    }
    const { data: row, error } = await supabase
      .from("appeals")
      .insert({
        user_id: userId,
        kind: data.kind,
        reason: data.reason,
        target_type: data.targetType ?? null,
        target_id: data.targetId ?? null,
        related_report_id: data.relatedReportId ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as any)?.id as string };
  });

/** 当前用户的申诉列表 */
export const listMyAppeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("appeals")
      .select("id,kind,target_type,target_id,related_report_id,reason,status,resolution_note,resolved_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { appeals: data ?? [] };
  });