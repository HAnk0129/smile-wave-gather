import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KindEnum = z.enum(["real", "student"]);

/** 用户提交认证申请。客户端先把凭证上传到 media 桶 (<userId>/verify/...) 再调本接口。*/
export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: KindEnum,
        storagePath: z.string().min(1).max(500),
        extra: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.storagePath.startsWith(`${userId}/`)) {
      throw new Error("Invalid storage path");
    }
    // 撤回旧的 pending（如有），避免唯一索引冲突
    await supabase
      .from("verifications")
      .delete()
      .eq("user_id", userId)
      .eq("kind", data.kind)
      .eq("status", "pending");

    // 拒绝重复提交已通过的同类型
    const { data: approved } = await supabase
      .from("verifications")
      .select("id")
      .eq("user_id", userId)
      .eq("kind", data.kind)
      .eq("status", "approved")
      .maybeSingle();
    if (approved) throw new Error("你已通过该项认证，无需重复提交");

    const { error } = await supabase.from("verifications").insert({
      user_id: userId,
      kind: data.kind,
      evidence_url: data.storagePath,
      evidence_extra: data.extra ?? null,
      status: "pending",
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** 当前用户的认证状态（每个 kind 最新一条）。*/
export const getMyVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("verifications")
      .select("id, kind, status, review_note, created_at, reviewed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const latest: Record<string, any> = {};
    for (const row of data ?? []) {
      if (!latest[row.kind]) latest[row.kind] = row;
    }
    return {
      real: latest.real ?? null,
      student: latest.student ?? null,
    };
  });

/** 管理员：查看队列（默认 pending）*/
export const adminListVerifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
        limit: z.number().int().min(1).max(100).default(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // assert admin
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("没有管理员权限");

    let q = supabaseAdmin
      .from("verifications")
      .select("id, user_id, kind, evidence_url, evidence_extra, status, review_note, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const { data: profs } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, nickname, photos, main_idx, city").in("id", userIds)
      : { data: [] as any[] };
    const profMap = new Map<string, any>();
    (profs ?? []).forEach((p: any) => profMap.set(p.id, p));

    // 为凭证图片生成签名 URL
    const paths = (rows ?? []).map((r: any) => r.evidence_url).filter((u: string) => !u.startsWith("http"));
    const signedMap = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabaseAdmin.storage.from("media").createSignedUrls(paths, 60 * 60);
      (signed ?? []).forEach((s: any) => { if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl); });
    }

    return {
      items: (rows ?? []).map((r: any) => {
        const p = profMap.get(r.user_id);
        const photos = Array.isArray(p?.photos) ? (p.photos as string[]) : [];
        return {
          ...r,
          evidence_url: r.evidence_url.startsWith("http") ? r.evidence_url : (signedMap.get(r.evidence_url) ?? r.evidence_url),
          user: {
            id: r.user_id,
            nickname: p?.nickname ?? "Pulse 用户",
            city: p?.city ?? null,
            avatar: photos[p?.main_idx ?? 0] || photos[0] || null,
          },
        };
      }),
    };
  });

/** 管理员：通过 / 拒绝。通过时同步写入 profiles.verify_real / verify_student。*/
export const adminReviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        note: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("没有管理员权限");

    const { data: rec, error: rErr } = await supabaseAdmin
      .from("verifications").select("id, user_id, kind, status").eq("id", data.id).maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!rec) throw new Error("申请不存在");
    if (rec.status !== "pending") throw new Error("该申请已被处理");

    const next = data.action === "approve" ? "approved" : "rejected";
    const { error: uErr } = await supabaseAdmin
      .from("verifications")
      .update({
        status: next,
        review_note: data.note ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (uErr) throw new Error(uErr.message);

    if (data.action === "approve") {
      const col = rec.kind === "real" ? "verify_real" : "verify_student";
      const { error: pErr } = await supabaseAdmin
        .from("profiles")
        .update({ [col]: true } as never)
        .eq("id", rec.user_id);
      if (pErr) throw new Error(pErr.message);
    }

    await supabaseAdmin.from("moderation_actions").insert({
      admin_id: userId,
      target_type: "verification",
      target_id: data.id,
      action: data.action,
      note: data.note ?? null,
    } as never);
    return { ok: true };
  });