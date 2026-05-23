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
};

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category?: string; location?: string } | undefined) =>
    z
      .object({
        category: z.union([CATEGORY, z.literal("all")]).optional(),
        location: z.string().min(1).max(120).optional(),
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
    if (data.location) query = query.eq("location", data.location);

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

    return {
      posts: (rows ?? []).map<CommunityPost>((r: any) => ({
        id: r.id,
        author_id: r.author_id,
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
      })),
    };
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        category: CATEGORY,
        title: z.string().trim().min(1).max(120),
        content: z.string().trim().min(1).max(2000),
        tags: z.array(z.string().trim().min(1).max(20)).max(6).optional(),
        location: z.string().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: userId,
        category: data.category,
        title: data.title,
        content: data.content,
        cover: COVER_BY_CATEGORY[data.category],
        tags: data.tags ?? [],
        location: data.location,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { post: row };
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