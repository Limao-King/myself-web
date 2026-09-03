/**
 * 游戏经历数据 —— 来自《游戏历程.md》。
 * hours 为时长标注，仅 >50 小时的填写。
 * 后续可为重点款补充 comment（评述）。
 */
export interface GameItem {
  name: string;
  hours?: string;
  comment?: string;
}

export interface GameGroup {
  subtitle: string; // 子类名（如 JRPG / RTS），无子类则为空字符串
  items: GameItem[];
}

export interface GameCategory {
  title: string; // 大类名
  groups: GameGroup[];
}

export const gameCategories: GameCategory[] = [
  {
    title: '角色扮演（RPG）',
    groups: [
      {
        subtitle: 'JRPG',
        items: [
          { name: '真女神转生5', hours: '100+', comment: '数值调控合理。纯粹，硬核的JRPG策略战斗体验' },
          { name: '女神异闻录5', hours: '80', comment: '宫殿探索→校园日常双循环设计，每一个层面都关照玩家不一样的体验' },
          { name: '勇者斗恶龙：寻觅逝去的时光', hours: '100+', comment: '系列集大成之作，战斗系统简约而不简单，三个周目都有不同的体验' },
          { name: '空之轨迹', hours: '60', comment: 'JRPG经典之作，Second发售我一定也要玩' },
          { name: '如龙7 / 如龙8', hours: '90', comment: '回合制拓展与创新的典范，7代的剧本扎实，8代改革的回合制战斗体验爽快' },
          { name: '八方旅人2', comment: '弱点破防的战斗系统与八位角色带来的迥异剧情体验' },
          { name: '古剑奇谭' },
          { name: '星之海', comment: '炸穿地球的美术表现规格，战斗体验有待商榷' },
        ],
      },
      {
        subtitle: '欧美 RPG',
        items: [
          { name: '上古卷轴', comment: '在沉浸的开放大世界探索，做任何你想做的事情' },
          { name: '巫师3' },
          { name: '极乐迪斯科', comment: '盘旋的幽灵，竹节虫的奇迹，独特的气质让往后所有类迪斯科游戏都陷入了似我者死的境地' },
          { name: '正义之怒' },
          { name: '索拉斯塔' },
          { name: '骑马与砍杀系列', hours: '500+', comment: '战斗系统打磨精致，扮演无名小卒成长为一国之主的游戏体验独一份' },
          { name: '天国拯救2', hours: '100+', comment: '绝对独一份的中世纪生活体验，扮演亨利在中世纪经历自己的第二人生' },
          { name: '荒野大镖客' },
          { name: '红色沙漠' },
          { name: '英勇无厌' },
        ],
      },
      {
        subtitle: 'CRPG / 战棋 RPG',
        items: [
          { name: '博德之门3', hours: '200+', comment: '经典之作在新世代再放光辉，精彩多样的演出和交互性强的引擎让跑团体验一流' },
          { name: '神界：原罪2', hours: '100+', comment: '独到的元素反应 + 物理环境交互设计，扎实的文本量让世界并不悬浮' },
        ],
      },
      {
        subtitle: '回合制 RPG',
        items: [
          { name: '传说之下' },
          { name: '吞食天地系列', hours: '50+', comment: 'FC时代经典回合制游戏，剧情流程量大管饱，体验从桃园结义到一统天下' },
          { name: '暗黑地牢系列', hours: '250+', comment: '压力系统配合暗黑的气质带给了玩家独特的记忆' },
          { name: '为了吾王' },
          { name: '憎恶之西 & 憎恶之影', hours: '55+', comment: '搞怪，neta，但又有一定策略深度的回合制RPG' },
          { name: '乌尔图克：荒凉' },
          { name: 'Small Saga', comment: '经典回合制玩法，故事着笔点放在生活在人类现代社会的老鼠们，讲述他们的战记' },
          { name: 'Look Outside', comment: '对克苏鲁的描摹十分精妙的一部作品，且回合制战斗的底子也不差' },
          { name: 'Keep Driving' },
          { name: 'Astronatch' },
          { name: '垃圾王国', comment: '精品回合制独立游戏，讲述垃圾桶骑士Dustbin和伙伴们的冒险故事' },
          { name: '漫野奇谭', comment: '让自己的角色成为故事，成为传说，被后来者传颂' },
          { name: '光与影：33号远征队', hours: '70+', comment: '动作元素融入回合制的大胆尝试，QTE流畅自然，并无太多操作焦虑' },
        ],
      },
    ],
  },
  {
    title: '策略',
    groups: [
      {
        subtitle: 'RTS（即时战略）',
        items: [
          { name: '帝国时代系列', hours: '50+' },
          { name: '要塞：十字军东征' },
          { name: '傲世三国系列' },
          { name: '神话时代系列' },
          { name: '北境之地' },
          { name: '红色警戒系列' },
        ],
      },
      {
        subtitle: '回合制策略 / 战棋',
        items: [
          { name: '英雄无敌7 / 上古纪元', hours: '50+', comment: '经典再续，管理你的资源，在回合轮中考虑好短期与长期收益，为最终决战做好准备' },
          { name: '三国志系列', hours: '50+' },
          { name: '战场兄弟', hours: '50+', comment: '核心循环类骑马与砍杀，管理你的佣兵团，在战斗的循环中不断壮大' },
          { name: '太阁立志传' },
          { name: '逸剑风云决' },
          { name: '三国志英杰传' },
          { name: '三国志曹操传及其 MOD', hours: '200+', comment: '战棋敌我回合的行动资源博弈，MOD 生态的教科书' },
          { name: '梦幻模拟战' },
          { name: '战争交响曲：尼菲林传奇', comment: '独特的将领组配军团功能令人记忆犹新' },
          { name: '战律' },
          { name: '地平线之门' },
          { name: '侠客风云传：前传' },
          { name: '奇妙探险队系列' },
          { name: '冥狱战术', hours: '82', comment: '卡牌+Rouge+自走棋的玩法融合。每种元素都多样扎实，构筑套路丰富' },
          { name: '梦境战术' },
        ],
      },
    ],
  },
  {
    title: 'Roguelike',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '土豆兄弟', hours: '250+', comment: '类幸存者系列中节奏打磨独到的作品，二十分钟一局的游戏畅快淋漓。' },
          { name: '原点计划' },
          { name: 'The Dungeon Beneath' },
          { name: '吾王保卫战' },
          { name: '喵喵的结合' },
        ],
      },
    ],
  },
  {
    title: '卡牌',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '欺诈之地', comment: '谈判作为另一套战斗系统的补充设计，但也有让玩法过度复杂之嫌' },
          { name: 'Racine' },
          { name: '杀戮尖塔系列', hours: '400+', comment: '卡牌构筑，资源管理的典范，成为许多卡牌肉鸽的参考样本' },
          { name: '王权系列' },
          { name: '卡牌生存：热带岛屿' },
          { name: '妖精股份公司', comment: '合理管理卡牌与其他角色进行博弈的大富翁plus' },
        ],
      },
    ],
  },
  {
    title: '沙盒 / 生存',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '饥荒', hours: '100+', comment: '饥饿/精神/生命的管理带来基本的生存压力，季节/区域的动态拓展游戏的深层内容' },
          { name: '泰拉瑞亚' },
          { name: '我的世界', hours: '1000+', comment: '像素方块的硬核才是王道' },
          { name: '勇者斗恶龙：创世小玩家2', hours: '70+', comment: '凭丰富的JRPG基底，用任务、剧情驱动玩家进行建造，享受创造' },
          { name: 'Islands of Caliph' },
          { name: '地痞街区', comment: '很轻量，很rouge，但是深度有待商榷' },
        ],
      },
    ],
  },
  {
    title: '模拟经营',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '星露谷物语' },
          { name: '小动物餐吧' },
          { name: '开罗游戏系列', hours: '100+' },
          { name: '主播女孩重度依赖' },
        ],
      },
    ],
  },
  {
    title: '动作',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '真三国无双系列', hours: '50+', comment: '光荣经典之作，在千军万马中化身三国武将酣畅淋漓割草' },
          { name: '黑暗之魂2' },
          { name: '只狼：影逝二度', hours: '50+', comment: '鼓励进攻的架势系统打造了独特的战斗美学' },
          { name: '识质存在' },
        ],
      },
    ],
  },
  {
    title: '剧情 / 叙事',
    groups: [
      {
        subtitle: '',
        items: [
          { name: '底特律：变人', comment: '蝴蝶效应与多样的分支，让玩家的每个选择都在真正积累重量' },
          { name: 'Pentiment', comment: '当岁月侵蚀，历史的墙沿剥落之时，真相已无处可寻' },
          { name: '死亡搁浅', hours: '50+', comment: '异步联机的精巧设计，在死亡搁浅的世界里，仍有渴望与他人连接的期冀' },
          { name: 'To the Moon', comment: '简单的拼图设计，动人的真挚剧情' },
          { name: '逆转裁判 123 + 大逆转裁判', hours: '100+', comment: '经典的搜证+公堂对峙玩法，真正的男人，只有在了结一切之后才可以落下眼泪' },
          { name: '海市蜃楼之馆系列', comment: '层层反转的诡计叙事，不断变动的岁月中，馆依然伫立在那里' },
          { name: '人狼村之谜', comment: '乡村民俗环境下的狼人杀，首章体验奇佳，后续轮回收束平稳' },
          { name: '428：被封锁的涩谷', comment: 'Jump机制让剧情通过蒙太奇桥接，不过badEnd分支数量之多甚至成了特色' },
          { name: '情感反诈模拟器（捞女游戏）' },
          { name: '布兰特爵士的生平与痛苦' },
          { name: '莱拉是谁', comment: '莱拉一旦被创生就投射成为所有人的记忆，无法消除' },
          { name: '烟火', comment: '独特的中式恐怖意境，优秀的角色形象设计' },
          { name: '三伏', comment: '绝对让人惊叹的奇观式首章塑造' },
          { name: 'Florence' },
          { name: '卢卡诺伯爵' },
          { name: '雅皮士精神', comment: '优秀的像素画风与寓言性的故事带来强烈的张力' },
          { name: '婆罗洲的红珍珠' },
          { name: '纸房子' },
          { name: '翩翩夕零', comment: '通过世界观里独特的夕零现象作为讨论疾病与人的窗口，故事整体富有温情' },
          { name: '寂静岭F', comment: '多周目叙事让让每一周目的故事都有不同的表意和指向，日式恐怖氛围较为浓厚' },
        ],
      },
    ],
  },
  {
    title: '休闲 / 其他',
    groups: [
      {
        subtitle: 'FPS',
        items: [{ name: '生死狙击' }, { name: '求生之路2' }],
      },
      {
        subtitle: '竞技',
        items: [{ name: '王者荣耀', hours: '1500+' }],
      },
      {
        subtitle: '派对 / 小游戏',
        items: [{ name: '揍击派对' }, { name: '大骗局（诈欺娇娃）' }],
      },
      {
        subtitle: '其他',
        items: [
          { name: '王国：80年代' },
          { name: '早期 QQ 游戏', hours: '500+' },
          { name: '4399 网站游戏', hours: '500+' },
          { name: 'JavaScript 手机游戏', hours: '100+' },
        ],
      },
    ],
  },
];

/** 统计：总款数 */
export const totalGameCount = gameCategories.reduce(
  (sum, c) => sum + c.groups.reduce((s, g) => s + g.items.length, 0),
  0
);

/** 统计：带深度评述的款数 */
export const commentedGameCount = gameCategories.reduce(
  (sum, c) => sum + c.groups.reduce((s, g) => s + g.items.filter((i) => i.comment).length, 0),
  0
);

/** 按名称查找某款游戏（跨类别） */
export function findGame(name: string): GameItem | undefined {
  for (const c of gameCategories) {
    for (const g of c.groups) {
      const hit = g.items.find((i) => i.name === name);
      if (hit) return hit;
    }
  }
  return undefined;
}
