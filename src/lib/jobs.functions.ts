import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Job = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  location: string | null;
  salary: string | null;
  contact: string;
  tags: string[];
  status: string;
  expires_at: string | null;
  created_at: string;
};

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category?: string } | undefined) =>
    z.object({ category: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("jobs")
      .select("id,author_id,title,summary,description,category,location,salary,tags,status,expires_at,created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (data.category && data.category !== "all") q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { jobs: (rows ?? []) as Omit<Job, "contact">[] };
  });

const JobInput = z.object({
  title: z.string().min(2).max(80),
  summary: z.string().min(2).max(160),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(["parttime", "intern", "fulltime", "freelance", "collab"]).default("parttime"),
  location: z.string().max(80).optional().nullable(),
  salary: z.string().max(60).optional().nullable(),
  contact: z.string().min(1).max(120),
  tags: z.array(z.string().min(1).max(20)).max(8).default([]),
  expires_at: z.string().optional().nullable(),
});

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => JobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("jobs")
      .insert({ ...data, author_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { job: row as Job };
  });