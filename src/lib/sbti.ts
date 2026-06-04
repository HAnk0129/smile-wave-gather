// SBTI 26 种趣味人格 — Mock 数据，单独维护方便后续替换

export const SBTI_TEST_URL = "https://example.com/sbti-test"; // TODO: 替换为真实测试地址

export type SbtiPersonality = {
  code: string;
  name: string;
  keywords: string[];
  summary: string;
  color: string; // 卡片渐变主色
  outfit: string[]; // 限定虚拟装扮
  badge: string; // 人格铭牌
};

export const SBTI_LIST: SbtiPersonality[] = [
  { code: "JOKER", name: "快乐显眼包", keywords: ["气氛担当", "抽象达人", "随时接梗"], summary: "只要我不尴尬，尴尬的就是别人。", color: "#ff8a3d", outfit: ["小丑帽", "彩色外套", "趣味眼镜"], badge: "JOKER · 气氛担当" },
  { code: "LOVER", name: "恋爱观察家", keywords: ["心动雷达", "感性", "浪漫主义"], summary: "嘴上说不谈，心里写满了 99+。", color: "#ff5a8a", outfit: ["心形耳坠", "粉色卫衣", "玫瑰胸针"], badge: "LOVER · 心动雷达" },
  { code: "GHOST", name: "已读不回鬼", keywords: ["低能量", "慢热", "社交节能"], summary: "回消息这件事，我会的，只是不会现在。", color: "#8b8fb0", outfit: ["白色斗篷", "幽灵口罩", "夜灯挂件"], badge: "GHOST · 慢热守恒" },
  { code: "STAR", name: "舞台中心", keywords: ["自带光环", "外向", "聚光灯"], summary: "走到哪里，灯就跟到哪里。", color: "#ffd23d", outfit: ["闪片夹克", "话筒挂坠", "星形墨镜"], badge: "STAR · 舞台之光" },
  { code: "NERD", name: "知识储物间", keywords: ["细节控", "理性", "考据癖"], summary: "三句话不到，开始引用论文。", color: "#5eb0ff", outfit: ["圆框眼镜", "格子衬衫", "书袋"], badge: "NERD · 行走百科" },
  { code: "POET", name: "深夜诗人", keywords: ["敏感", "文艺", "失眠王"], summary: "白天写 brief，晚上写 if only。", color: "#a78bfa", outfit: ["羊毛围巾", "钢笔挂坠", "牛皮笔记本"], badge: "POET · 月光主义" },
  { code: "BOSS", name: "项目经理人", keywords: ["执行力", "强势", "to-do 控"], summary: "这事我安排，你只管出现就行。", color: "#1f6feb", outfit: ["小西装", "公文包", "金属胸针"], badge: "BOSS · 行动派" },
  { code: "MUSE", name: "灵感缪斯", keywords: ["艺术", "审美", "颜色狂"], summary: "随手一拍都能上 Wallpaper。", color: "#ec4899", outfit: ["贝雷帽", "亚麻围裙", "彩色画笔"], badge: "MUSE · 审美在线" },
  { code: "SAGE", name: "树洞贤者", keywords: ["共情力", "倾听者", "靠谱"], summary: "别人崩溃找我，我崩溃找猫。", color: "#10b981", outfit: ["米色毛衣", "马克杯", "木质念珠"], badge: "SAGE · 情绪稳态" },
  { code: "WOLF", name: "孤独猎手", keywords: ["独行侠", "酷", "高冷"], summary: "群聊里不说话，单独聊起来比谁都暖。", color: "#374151", outfit: ["黑色风衣", "银耳环", "狼牙项链"], badge: "WOLF · 独行美学" },
  { code: "BUNNY", name: "蹦跶小可爱", keywords: ["元气", "话痨", "撒娇"], summary: "今天也是元气满满的废话第一名。", color: "#fb7185", outfit: ["兔耳发箍", "毛绒围脖", "胡萝卜挂件"], badge: "BUNNY · 元气满格" },
  { code: "BEAR", name: "稳重熊", keywords: ["靠谱", "顾家", "慢温柔"], summary: "我话不多，但你饿了我有粮。", color: "#92400e", outfit: ["熊耳帽", "厚毛衣", "蜂蜜罐"], badge: "BEAR · 安全感大户" },
  { code: "CHAOS", name: "混沌制造机", keywords: ["跳脱", "随性", "整活"], summary: "计划赶不上变化，我是变化本人。", color: "#f43f5e", outfit: ["撞色拼接外套", "乱涂帆布鞋", "贴纸"], badge: "CHAOS · 不讲武德" },
  { code: "ZEN", name: "清醒佛系人", keywords: ["稳定", "佛", "情绪节流"], summary: "顺其自然，但绝不躺平。", color: "#0ea5e9", outfit: ["素色长袍", "木珠手串", "竹笠"], badge: "ZEN · 内观大师" },
  { code: "FOXY", name: "心眼狐狸", keywords: ["机敏", "幽默", "嘴硬"], summary: "嘴上说不在意，眼睛已经写满。", color: "#f97316", outfit: ["狐狸耳朵", "狐尾毛球", "茶色围巾"], badge: "FOXY · 嘴硬专家" },
  { code: "ROBO", name: "极简机器人", keywords: ["效率", "冷面", "理性"], summary: "情绪？参数错误，已忽略。", color: "#64748b", outfit: ["金属耳机", "工装外套", "数据胸牌"], badge: "ROBO · 系统稳定" },
  { code: "WITCH", name: "玄学少女", keywords: ["占卜", "玄", "直觉党"], summary: "塔罗、星盘、MBTI 一个都不能少。", color: "#7c3aed", outfit: ["黑色尖帽", "水晶项链", "星月披风"], badge: "WITCH · 玄学顶配" },
  { code: "CHEF", name: "深夜食堂", keywords: ["烟火气", "宠粉", "暖胃"], summary: "我做的饭，是你今晚最大的奖励。", color: "#dc2626", outfit: ["白色厨师帽", "围裙", "木铲挂坠"], badge: "CHEF · 投喂大师" },
  { code: "PUNK", name: "叛逆小炮", keywords: ["反骨", "敢说", "热血"], summary: "你说东，我偏要看看西边到底有什么。", color: "#111827", outfit: ["铆钉皮衣", "鸡冠头", "拳套"], badge: "PUNK · 永不服气" },
  { code: "ANGEL", name: "白月光", keywords: ["温柔", "干净", "治愈"], summary: "见到你那天，emo 都决定请假。", color: "#e0f2fe", outfit: ["蕾丝白裙", "羽毛翅膀", "光环"], badge: "ANGEL · 温柔回血" },
  { code: "DEMON", name: "小恶魔", keywords: ["撩人", "毒舌", "上头"], summary: "嘴上不饶人，行动很诚实。", color: "#9f1239", outfit: ["黑色翅膀", "尖角发箍", "尾巴挂件"], badge: "DEMON · 上头注意" },
  { code: "NOMAD", name: "数字游民", keywords: ["自由", "在路上", "探索者"], summary: "下一站？哪里有 wifi 就去哪。", color: "#0891b2", outfit: ["机能马甲", "登山包", "相机挂坠"], badge: "NOMAD · 永远在路上" },
  { code: "OTAKU", name: "宅家研究员", keywords: ["专注", "热爱", "知识库"], summary: "推我入坑，我能给你写一万字。", color: "#4f46e5", outfit: ["渔夫帽", "JK 袖章", "周边徽章"], badge: "OTAKU · 入坑大师" },
  { code: "DIVA", name: "派对女王", keywords: ["夜店王", "气场", "时髦"], summary: "我不是去玩，我是被请来撑场子的。", color: "#be185d", outfit: ["金属流苏裙", "墨镜", "香槟杯挂件"], badge: "DIVA · 全场最靓" },
  { code: "BABY", name: "永远的小孩", keywords: ["纯真", "贪玩", "好奇"], summary: "成年人的世界？我先去玩会儿再说。", color: "#fcd34d", outfit: ["奶嘴挂件", "玩具熊", "气球"], badge: "BABY · 拒绝长大" },
  { code: "STORM", name: "暴风发疯人", keywords: ["上头", "冲动", "热烈"], summary: "今天又是想冲进雨里大喊的一天。", color: "#1e40af", outfit: ["闪电卫衣", "战靴", "雨伞武器"], badge: "STORM · 情绪满格" },
];

export const getSbti = (code: string) =>
  SBTI_LIST.find((p) => p.code.toLowerCase() === code.toLowerCase());