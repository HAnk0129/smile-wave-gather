import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("id, user_a, user_b, source, last_message, last_message_at, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const partnerIds = Array.from(
      new Set((convs ?? []).map((c) => (c.user_a === userId ? c.user_b : c.user_a))),
    );
    const profilesMap = new Map<string, { nickname: string | null; photos: unknown; main_idx: number | null }>();
    if (partnerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, photos, main_idx")
        .in("id", partnerIds);
      (profs ?? []).forEach((p) => profilesMap.set(p.id, p as never));
    }

    return {
      conversations: (convs ?? []).map((c) => {
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
    const { data: convId, error } = await supabase.rpc("start_conversation", {
      partner_id: data.partnerId,
      source: data.source,
    });
    if (error) throw new Error(error.message);
    return { id: convId as string };
  });