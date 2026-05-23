import { createServerFn } from "@tanstack/react-start";

type PalmReport = {
  overall: string;
  love: { score: number; line: string; comment: string };
  career: { score: number; line: string; comment: string };
  life: { score: number; line: string; comment: string };
  fortune: string;
  matchHint: string;
  warning: string;
};

export const readPalm = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string }) => {
    if (!d?.imageDataUrl || typeof d.imageDataUrl !== "string") {
      throw new Error("缺少手掌图片");
    }
    if (!d.imageDataUrl.startsWith("data:image/")) {
      throw new Error("图片格式不正确");
    }
    // ~6 MB after base64 expansion safety limit
    if (d.imageDataUrl.length > 8_000_000) {
      throw new Error("图片过大，请压缩后重试");
    }
    return d;
  })
  .handler(async ({ data }): Promise<PalmReport> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI 服务未配置");

    const prompt = `你是一位风趣又走心的现代手相师，融合传统手相学与心理学。请观察图片中的手掌，
以"娱乐为主"的口吻给出一份**简短而有趣**的手相报告。即使图中不是清晰的手掌，也请大胆发挥（这是一款社交娱乐小游戏）。
所有内容必须使用简体中文，每段一两句话，避免说教。严格按 JSON 输出，不要加任何额外文字。

输出 JSON 字段：
{
  "overall": "总体性格画像，一句话",
  "love": { "score": 0-100, "line": "感情线状态描述，6-12字", "comment": "感情运势点评，一句话" },
  "career": { "score": 0-100, "line": "事业线状态描述，6-12字", "comment": "事业点评，一句话" },
  "life": { "score": 0-100, "line": "生命线状态描述，6-12字", "comment": "健康活力点评，一句话" },
  "fortune": "近期运势小贴士，一句话",
  "matchHint": "适合什么类型的伴侣，一句话",
  "warning": "幽默免责声明，一句话"
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI 请求过于频繁，请稍后再试");
    if (res.status === 402) throw new Error("AI 额度不足，请联系管理员");
    if (!res.ok) throw new Error(`AI 服务出错 (${res.status})`);

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI 未返回结果");

    try {
      return JSON.parse(content) as PalmReport;
    } catch {
      // Try to extract a JSON block if model wrapped it
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as PalmReport;
      throw new Error("AI 返回格式异常");
    }
  });