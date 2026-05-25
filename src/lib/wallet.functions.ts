import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GIFT_CATALOG } from "./wallet";

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("wallets")
      .select("coins, pro_until, updated_at")
      .eq("id", userId)
      .maybeSingle();
    return {
      coins: data?.coins ?? 0,
      proUntil: data?.pro_until ?? null,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const getMyLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("wallet_ledger")
      .select("id, delta, kind, balance_after, ref, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { entries: (data ?? []) as any[] };
  });

export const topUpCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ amount: z.number().int().min(1).max(100000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: newBal, error } = await supabase.rpc("wallet_topup", {
      _amount: data.amount,
      _ref: { source: "in_app_test" } as any,
    });
    if (error) throw new Error(error.message);
    return { coins: newBal as unknown as number };
  });

export const buyProPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ plan: z.enum(["month", "quarter", "year"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: until, error } = await supabase.rpc("wallet_buy_pro", { _plan: data.plan });
    if (error) throw new Error(error.message);
    return { proUntil: until as unknown as string };
  });

export const sendGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      receiverId: z.string().uuid(),
      giftCode: z.string().min(1).max(32),
      message: z.string().max(200).optional(),
      conversationId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const gift = GIFT_CATALOG.find((g) => g.code === data.giftCode);
    if (!gift) throw new Error("未知礼物");
    const { data: giftId, error } = await supabase.rpc("wallet_send_gift", {
      _receiver_id: data.receiverId,
      _gift_code: gift.code,
      _coins: gift.coins,
      _message: data.message ?? "",
      _conv_id: data.conversationId ?? null,
    } as any);
    if (error) {
      if (/wallets_coins_check|coins.*>=.*0/.test(error.message)) {
        throw new Error("心动币不足，请先充值");
      }
      throw new Error(error.message);
    }
    return { giftId: giftId as unknown as string };
  });

export const listGiftsForConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("gift_transactions")
      .select("id, sender_id, receiver_id, gift_code, coins, message, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    // restrict: only sender or receiver allowed
    const safe = (rows ?? []).filter((r) => r.sender_id === userId || r.receiver_id === userId);
    return { gifts: safe };
  });