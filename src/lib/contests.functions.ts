import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Contest = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  description: string | null;
  cover: string | null;
  category: string;
  location: string | null;
  prize: string | null;
  organizer: string | null;
  contact: string | null;
  register_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  deadline: string | null;
  status: string;
  hot: number;
  created_at: string;
};

export const listContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contests")
      .select("id,author_id,title,summary,description,cover,category,location,prize,organizer,register_url,starts_at,ends_at,deadline,status,hot,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { contests: (data ?? []) as Omit<Contest, "contact">[] };
  });

export const getContest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { contest: (row as Contest | null) };
  });

const ContestInput = z.object({
  title: z.string().min(2).max(80),
  summary: z.string().min(2).max(160),
  description: z.string().max(2000).optional().nullable(),
  cover: z.string().url().optional().nullable(),
  category: z.string().min(1).max(40).default("general"),
  location: z.string().max(80).optional().nullable(),
  prize: z.string().max(120).optional().nullable(),
  organizer: z.string().max(80).optional().nullable(),
  contact: z.string().max(120).optional().nullable(),
  register_url: z.string().url().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const createContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ContestInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("contests")
      .insert({ ...data, author_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { contest: row as Contest };
  });