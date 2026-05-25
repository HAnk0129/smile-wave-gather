import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // exclude conversations where the partner is blocked (either direction)
    const { data: blockRows } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedSet = new Set<string>(
      (blockRows ?? []).map((b: any) => (b.blocker_id === userId ? b.blocked_id : b.blocker_id)),
    );

    const { data: convs, error } = await supabase
      .from("conversations")
      .select("id, user_a, user_b, source, last_message, last_message_at, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const visibleConvs = (convs ?? []).filter((c) => {
      const partnerId = c.user_a === userId ? c.user_b : c.user_a;
      return !blockedSet.has(partnerId);
    });

    const partnerIds = Array.from(
      new Set(visibleConvs.map((c) => (c.user_a === userId ? c.user_b : c.user_a))),
    );
    const profilesMap = new Map<string, { nickname: string | null; photos: unknown; main_idx: number | null }>();
    if (partnerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, photos, main_idx")
        .in("id", partnerIds);
      (profs ?? []).forEach((p) => profilesMap.set(p.id, p as never));
    }

    // unread counts per conversation (messages I haven't read that aren't mine)
    const convIds = visibleConvs.map((c) => c.id);
    const unreadMap = new Map<string, number>();
    if (convIds.length) {
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .is("read_at", null)
        .neq("sender_id", userId);
      (unreadRows ?? []).forEach((r: any) => {
        unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) ?? 0) + 1);
      });
    }

    return {
      conversations: visibleConvs.map((c) => {
        const partnerId = c.user_a === userId ? c.user_b : c.user_a;
        const p = profilesMap.get(partnerId);
        const photos = Array.isArray(p?.photos) ? (p!.photos as string[]) : [];
        return {
          id: c.id,
          partnerId,
          partnerName: p?.nickname || "Pulse 用户",
          partnerAvatar: photos[p?.main_idx ?? 0] || photos[0] || null,
          source: c.source as "match" | "voice" | "video" | "treehole",
          lastMessage: c.last_message,
          lastMessageAt: c.last_message_at,
          unread: unreadMap.get(c.id) ?? 0,
        };
      }),
    };
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conv, error } = await supabase
      .from("conversations")
      .select("id, user_a, user_b, source, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conv) throw new Error("会话不存在");

    const partnerId = conv.user_a === userId ? conv.user_b : conv.user_a;
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, nickname, photos, main_idx, city")
      .eq("id", partnerId)
      .maybeSingle();
    const photos = Array.isArray(prof?.photos) ? (prof!.photos as string[]) : [];

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true })
      .limit(200);

    return {
      id: conv.id,
      source: conv.source as "match" | "voice" | "video" | "treehole",
      me: userId,
      partner: {
        id: partnerId,
        name: prof?.nickname || "Pulse 用户",
        avatar: photos[prof?.main_idx ?? 0] || photos[0] || null,
        city: prof?.city || null,
      },
      messages: (msgs ?? []).map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        readAt: m.read_at,
      })),
    };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: userId,
        content: data.content,
      })
      .select("id, sender_id, content, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { message: msg };
  });

export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        partnerId: z.string().uuid(),
        source: z.enum(["match", "voice", "video", "treehole"]).default("match"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.partnerId === userId) throw new Error("不能和自己开始对话");
    const { data: blockRow } = await supabase
      .from("blocks")
      .select("blocker_id")
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${data.partnerId}),and(blocker_id.eq.${data.partnerId},blocked_id.eq.${userId})`)
      .limit(1)
      .maybeSingle();
    if (blockRow) throw new Error("无法发起对话：你们之间存在拉黑关系");
    const { data: convId, error } = await supabase.rpc("start_conversation", {
      partner_id: data.partnerId,
      source: data.source,
    });
    if (error) throw new Error(error.message);
    return { id: convId as string };
  });

/** Mark every incoming (not-mine, unread) message in a conversation as read. */
export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ conversationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, count } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() }, { count: "exact" })
      .eq("conversation_id", data.conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { marked: count ?? 0 };
  });

/** Search users by nickname (excluding self). Used for "add friend by nickname". */
export const searchUsersByNickname = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ q: z.string().trim().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, nickname, photos, main_idx, city, signature")
      .eq("onboarded", true)
      .ilike("nickname", `%${data.q}%`)
      .limit(30);
    if (error) throw new Error(error.message);
    const users = (rows ?? [])
      .filter((r: any) => r.id !== userId)
      .map((r: any) => {
        const photos = Array.isArray(r.photos) ? (r.photos as string[]) : [];
        return {
          id: r.id as string,
          nickname: (r.nickname as string | null) ?? "Pulse 用户",
          city: (r.city as string | null) ?? null,
          signature: (r.signature as string | null) ?? null,
          avatar: photos[r.main_idx ?? 0] || photos[0] || null,
        };
      });
    return { users };
  });

/** Look up a single user by id (used after scanning a QR code). */
export const lookupUserById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id === userId) throw new Error("这是你自己的二维码");
    const { data: row, error } = await supabase
      .from("profiles")
      .select("id, nickname, photos, main_idx, city, signature, onboarded")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || !(row as any).onboarded) throw new Error("用户不存在或未完成资料");
    const photos = Array.isArray((row as any).photos) ? ((row as any).photos as string[]) : [];
    return {
      user: {
        id: row.id as string,
        nickname: ((row as any).nickname as string | null) ?? "Pulse 用户",
        city: ((row as any).city as string | null) ?? null,
        signature: ((row as any).signature as string | null) ?? null,
        avatar: photos[(row as any).main_idx ?? 0] || photos[0] || null,
      },
    };
  });