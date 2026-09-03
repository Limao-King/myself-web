# 游戏策划求职个人网站

基于 **Astro 7 + Tailwind CSS 4** 的内容型作品集骨架。内容全部用 Markdown 管理，日常维护不需要会写代码。

---

## 🚀 快速开始

```sh
npm install        # 第一次运行前安装依赖
npm run dev        # 本地开发，浏览器打开 http://localhost:4321
```

---

## ✅ 上线前要改的清单（照着做一遍就能投简历）

| 文件 | 改什么 |
| --- | --- |
| `src/site.config.ts` | **你的名字、求职定位、邮箱、GitHub、一句话介绍**（全站只改这一个配置） |
| `public/resume.pdf` | 换成你的**真实简历**（现在是个占位文件） |
| `src/content/projects/project-1.md`、`project-2.md` | 你的**项目经历**（每个项目一个 .md 文件） |
| `src/content/docs/system-design-sample.md`、`numeric-design-sample.md` | 你的**设计文档** |
| `src/content/analysis/game-analysis-sample.md` | 你的**游戏拆解报告** |
| `src/pages/game-history.astro` | **游戏经历**（改页面里 `items` 数组） |
| `src/pages/about.astro` | **关于我**：教育背景、技能栈、荣誉 |
| `src/pages/index.astro` | （可选）首页的擅长方向标签 |
| `public/images/projects/` | 项目截图放入此目录，再在项目 md 里填 `cover: '/images/projects/xxx.png'` |

---

## 📁 目录结构与内容规则

```text
src/
├── site.config.ts        ← 站点配置（个人信息）
├── content.config.ts     ← 内容字段校验（字段名别乱改）
├── content/
│   ├── projects/*.md     ← 项目：title / date / type / role / teamSize / duration / summary / tags ...
│   ├── docs/*.md         ← 文档：title / date / category（系统|数值|关卡|文案|UI/UX|其他）/ summary
│   └── analysis/*.md     ← 拆解：title / date / game（拆解对象）/ summary
├── pages/                ← 页面路由（一般不用动）
├── components/           ← 组件（导航、卡片、时间线）
├── layouts/              ← 页面布局
└── styles/global.css     ← 全局样式 & 主题
public/
├── resume.pdf            ← 简历（替换成你的）
├── favicon.svg           ← 站点图标
└── images/               ← 所有图片（projects/ docs/ gallery/）
```

**新增内容的语法**：复制任意一个示例 .md，改文件名（英文短横线，如 `my-game.md`）和 frontmatter 字段即可，列表页和详情页会自动生成。

---

## 🧞 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发服务器（http://localhost:4321） |
| `npm run build` | 构建到 `dist/` 目录 |
| `npm run preview` | 本地预览构建产物（部署前检查用） |

---

## ☁️ 部署到 Vercel

1. **GitHub**：注册账号 → 新建仓库（仓库名如 `my-portfolio`）→ 把本目录代码推上去
   （不会用命令行的同学：可以装 GitHub Desktop 图形化操作，或 `git init && git add . && git commit -m "first"` 后推）
2. **Vercel**（你已注册）：登录 → [vercel.com/new] → Import 你的 GitHub 仓库
3. 框架会自动识别 **Astro**；Build Command 填 `npm run build`，Output Directory 填 `dist`
4. 点 **Deploy**，等一分钟，拿到 `https://xxx.vercel.app` 网址
5. （推荐）之后在 Vercel 设置里绑定你自己的域名

> 推送代码后 Vercel 会自动重新构建，日常更新 = 改完内容 `git push` 即可。

---

## 🎨 想换风格怎么办（内容不用动）

- **主色调**：在 `src/styles/global.css` 和组件里搜 `violet`（紫），整体替换成喜欢的颜色，如 `emerald`（绿）/ `cyan`（青）/ `rose`（粉）
- **全局字体/主题**：`src/styles/global.css` 顶部的 `@theme`
- **文章排版**：同文件里的 `.prose-article` 部分
- **导航/页脚文案**：`src/components/Nav.astro`、`Footer.astro`
- 以后想加游戏试玩/动画：可以在页面里引入 React/Svelte 组件（Astro 岛屿架构），不需要重构

---

## ❓ 常见问题

- **改了 .md 页面没变？** 确认 frontmatter 字段没写错（字段名校验在 `src/content.config.ts`），保存后刷新浏览器。
- **图片显示不出来？** 图片必须放在 `public/` 里，md 里用 `/images/xxx.png` 这种以 `/` 开头的路径。
- **改了个人信息没生效？** 检查 `src/site.config.ts` 保存了，且页面重启了 dev 服务器。