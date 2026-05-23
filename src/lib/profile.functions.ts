import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const payload: Record<string, unknown> = {
      id: userId,
      nickname: (data.nickname as string) || null,
      gender: (data.gender as string) || null,
      birthday: (data.birthday as string) || null,
      city: (data.city as string) || null,
      hometown: (data.hometown as string) || null,
      height: (data.height as string) || null,
      education: (data.education as string) || null,
      job: (data.job as string) || null,
      school: (data.school as string) || null,
      photos: data.photos ?? [],
      main_idx: (data.mainIdx as number) ?? 0,
      video_intro: (data.videoIntro as string) || null,
      signature: (data.signature as string) || null,
      intro: (data.intro as string) || null,
      status: (data.status as string) || null,
      interests: data.interests ?? [],
      personality: data.personality ?? [],
      mbti: (data.mbti as string) || null,
      zodiac: (data.zodiac as string) || null,
      smoke: (data.smoke as string) || null,
      drink: (data.drink as string) || null,
      sleep: (data.sleep as string) || null,
      diet: (data.diet as string) || null,
      pet: (data.pet as string) || null,
      intent: data.intent ?? [],
      relationship: (data.relationship as string) || null,
      ideal_type: (data.idealType as string) || null,
      age_range: data.ageRange ?? null,
      distance: (data.distance as string) || null,
      icebreaker: (data.icebreaker as string) || null,
      verify_real: Boolean(data.verifyReal),
      verify_student: Boolean(data.verifyStudent),
      onboarded: true,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload as never, { onConflict: "id" });

    if (error) throw new Error(error.message);

    const phone = (data.phone as string) || null;
    if (phone) {
      const { error: pErr } = await supabase
        .from("profiles_private")
        .upsert({ id: userId, phone } as never, { onConflict: "id" });
      if (pErr) throw new Error(pErr.message);
    }
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });