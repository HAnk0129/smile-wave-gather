import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY = z.enum(["second", "vent", "ask"]);

const COVER_BY_CATEGORY: Record<z.infer<typeof CATEGORY>, string> = {
  second: "from-mint/40 via-mint/10 to-transparent",
  vent: "from-coral/40 via-coral/10 to-transparent",
  ask: "from-sun/40 via-sun/10 to-transparent",
};

export type CommunityPost = {
  id: string;
  author_id: string;
  campus_id: string;
  category: z.infer<typeof CATEGORY>;
  title: string;
  content: string;
  cover: string;
  tags: string[];
  location: string;
  likes_count: number;
  comments_count: number;
  hot: number;
  created_at: string;
  liked_by_me: boolean;
  media: { url: string; type: "image" | "video" }[];
  author_nickname: string | null;
  author_avatar: string | null;
  status: "approved" | "pending" | "rejected" | "removed";
  review_note: string | null;
  auto_flag_reason: string | null;
};

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category?: string; campus_id?: string } | undefined) =>
    z
      .object({
        category: z.union([CATEGORY, z.literal("all")]).optional(),
        campus_id: z.string().uuid().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.campus_id) query = query.eq("campus_id", data.campus_id);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    let likedSet = new Set<string>();
    if (ids.length > 0) {
      const { data: likes } = await supabase
        .from("community_post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", ids);
      likedSet = new Set((likes ?? []).map((l) => l.post_id as string));
    }

    const authorIds = Array.from(new Set((rows ?? []).map((r: any) => r.author_id as string)));
    let authorMap = new Map<string, { nickname: string | null; avatar: string | null }>();
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, photos, main_idx")
        .in("id", authorIds);
      for (const p of profs ?? []) {
        const photos = Array.isArray((p as any).photos) ? ((p as any).photos as string[]) : [];
        const idx = (p as any).main_idx ?? 0;
        authorMap.set((p as any).id, {
          nickname: (p as any).nickname ?? null,
          avatar: photos[idx] ?? photos[0] ?? null,
        });
      }
    }

    return {
      posts: (rows ?? []).map<CommunityPost>((r: any) => ({
        id: r.id,
        author_id: r.author_id,
        campus_id: r.campus_id,
        category: r.category,
        title: r.title,
        content: r.content,
        cover: r.cover,
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        location: r.location,
        likes_count: r.likes_count,
        comments_count: r.comments_count,
        hot: r.hot,
        created_at: r.created_at,
        liked_by_me: likedSet.has(r.id),
        media: Array.isArray(r.media) ? (r.media as any) : [],
        author_nickname: authorMap.get(r.author_id)?.nickname ?? null,
        author_avatar: authorMap.get(r.author_id)?.avatar ?? null,
        status: (r.status as any) ?? "approved",
        review_note: r.review_note ?? null,
        auto_flag_reason: r.auto_flag_reason ?? null,
      })),
    };
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        campus_id: z.string().uuid(),
        category: CATEGORY,
        title: z.string().trim().min(1).max(120),
        content: z.string().trim().min(1).max(2000),
        tags: z.array(z.string().trim().min(1).max(20)).max(6).optional(),
        location: z.string().min(1).max(120),
        media: z
          .array(
            z.object({
              url: z.string().url().max(500),
              type: z.enum(["image", "video"]),
            }),
          )
          .max(9)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: userId,
        campus_id: data.campus_id,
        category: data.category,
        title: data.title,
        content: data.content,
        cover: COVER_BY_CATEGORY[data.category],
        tags: data.tags ?? [],
        location: data.location,
        media: data.media ?? [],
      })
      .select("id, status, auto_flag_reason")
      .single();
    if (error) throw new Error(error.message);
    return { post: row, pending: row?.status === "pending" };
  });

export const toggleCommunityLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ post_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("community_post_likes")
      .select("post_id")
      .eq("post_id", data.post_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("community_post_likes")
        .delete()
        .eq("post_id", data.post_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { liked: false };
    }

    const { error } = await supabase
      .from("community_post_likes")
      .insert({ post_id: data.post_id, user_id: userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  });

export const deleteCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ post_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", data.post_id)
      .eq("author_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_nickname: string | null;
  author_avatar: string | null;
};

export const listCommunityComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { post_id: string }) =>
    z.object({ post_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("community_comments")
      .select("id, post_id, author_id, content, created_at")
      .eq("post_id", data.post_id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);

    const authorIds = Array.from(new Set((rows ?? []).map((r) => r.author_id as string)));
    let profMap = new Map<string, { nickname: string | null; avatar: string | null }>();
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname, photos, main_idx")
        .in("id", authorIds);
      for (const p of profiles ?? []) {
        const photos = Array.isArray((p as any).photos) ? ((p as any).photos as string[]) : [];
        const idx = (p as any).main_idx ?? 0;
        profMap.set((p as any).id, {
          nickname: (p as any).nickname ?? null,
          avatar: photos[idx] ?? photos[0] ?? null,
        });
      }
    }

    return {
      comments: (rows ?? []).map<CommunityComment>((r: any) => ({
        id: r.id,
        post_id: r.post_id,
        author_id: r.author_id,
        content: r.content,
        created_at: r.created_at,
        author_nickname: profMap.get(r.author_id)?.nickname ?? null,
        author_avatar: profMap.get(r.author_id)?.avatar ?? null,
      })),
    };
  });

export const addCommunityComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        post_id: z.string().uuid(),
        content: z.string().trim().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("community_comments")
      .insert({ post_id: data.post_id, author_id: userId, content: data.content })
      .select("id, post_id, author_id, content, created_at")
      .single();
    if (error) throw new Error(error.message);

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, photos, main_idx")
      .eq("id", userId)
      .maybeSingle();

    const photos = Array.isArray((profile as any)?.photos) ? ((profile as any).photos as string[]) : [];
    const idx = (profile as any)?.main_idx ?? 0;

    return {
      comment: {
        id: row.id,
        post_id: row.post_id,
        author_id: row.author_id,
        content: row.content,
        created_at: row.created_at,
        author_nickname: profile?.nickname ?? null,
        author_avatar: photos[idx] ?? photos[0] ?? null,
      } as CommunityComment,
    };
  });

export const deleteCommunityComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ comment_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", data.comment_id)
      .eq("author_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });