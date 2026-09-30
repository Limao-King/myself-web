/** From the existing project writeups. These short notes make each case scannable without changing its underlying facts. */
export const caseNotes: Record<string, {
  eyebrow: string;
  status: string;
  challenge: string;
  decision: string;
  outcome: string;
  proof: string;
}> = {
  'fairytale-demo': {
    eyebrow: '可玩原型 · 系统设计',
    status: '可试玩 Demo',
    challenge: '在约十天的制作周期内，让回合制战斗形成可验证的决策空间。',
    decision: '以距离影响命中与敌方行动，并控制数值成长量级，让玩家更多依靠指令和站位取胜。',
    outcome: '完成包含战斗、装备、队伍、背包、商店与主线事件的可玩序章。',
    proof: '在线试玩、主策划案、战斗流程图与演示截图',
  },
  gujie: {
    eyebrow: '团队项目 · 世界与任务',
    status: '未完成项目',
    challenge: '为开放世界 RPG 建立多地区、多年代的统一设定与协作方式。',
    decision: '建立协作文档，主导世界观与多角色主线，并参与任务、对话及首个场景落地。',
    outcome: '产出地域文明设定与历史年表；项目因规模评估过大、团队难以持续推进而未完成。',
    proof: '地区发展概论、历史年表、任务对话与场景截图',
  },
  huanzhenming: {
    eyebrow: '叙事能力 · 团队协作',
    status: '完整梗概与剧本',
    challenge: '将心理悬疑与民俗童话题材组织成节奏清楚的动画故事。',
    decision: '作为组长完成梗概初稿，依据同学和组员反馈做减法、调整节奏，并撰写结局章节。',
    outcome: '团队完成剧本；故事世界观后来成为《童话冒险》的创作来源之一。',
    proof: '完整梗概、结局章节与概念美术',
  },
  'chaos-three-kingdoms': {
    eyebrow: '早期实践 · 关卡设计',
    status: '已发布地图',
    challenge: '让玩家在较大的三国战场关卡中始终知道目标和胜利条件。',
    decision: '以据点水晶连接战斗目标和通关剧情，并在多个关卡复用这套清晰的规则。',
    outcome: '完成约 30 个主线关卡；原发布帖获得 10 万余次点击、作品约 3000 次下载。',
    proof: '关卡截图、系统说明与发布结果',
  },
};
