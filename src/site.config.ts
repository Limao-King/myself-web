/**
 * 站点统一配置 —— 全站个人信息都在这里改。
 */
export const siteConfig = {
  /** 名字（导航栏 / 页脚 / 浏览器标签页） */
  name: '明鑫',
  /** 线上站点地址（用于 OG / 分享） */
  siteUrl: 'https://www.limao.site',
  /** 浏览器标签页后缀 */
  title: '游戏系统策划 · 作品集',
  /** 首页与分享时的站点描述 */
  description:
    '明鑫的游戏系统策划作品集：可玩原型、项目案例、策划文档与游戏设计拆解。',
  /** 简历下载地址（真实 PDF 放在 public/ 下；中文文件名便于下载后识别） */
  resumeUrl: '/明鑫-游戏策划简历.pdf',
  /** 全部文档 / Demo 打包下载（百度网盘） */
  downloadUrl: 'https://pan.baidu.com/s/1L2zQ2hUVPqM05ViGb74iow?pwd=abee',
  downloadPwd: 'abee',
  /** 联系方式 */
  email: 'Limao233666@outlook.com',
  github: 'https://github.com/Limao-King',
  // 手机号不放在这里：本文件所在仓库是公开的，明文手机号会被代码搜索/爬虫收走。
  // 简历 PDF 里保留手机号（HR 从那里获取联系方式，且 ATS 需要可解析的文本）。
  // 页面侧的联系入口走上面的 email 与首页/页脚的「联系我 / 直接联系」。
  /** 首页 Hero 区文案 */
  hero: {
    greeting: '你好！我是',
    role: '游戏系统策划（兼具叙事能力）',
    /** 首屏副标语 */
    tagline:
      '关注战斗、成长与任务系统如何让玩家做出有意思的选择，并用可玩原型和策划文档验证设计。',
  },
};
