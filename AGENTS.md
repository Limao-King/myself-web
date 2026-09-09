# 工作区说明（本文件由 DSH 自动注入每个新会话）

**游戏策划求职作品集网站**，部署在 [www.limao.site](https://www.limao.site)。技术栈：Astro 7 + Tailwind CSS 4，内容用 Markdown 管理。

## 交接文档
- **最新：`交接文档/CURRENT.md`** —— 开工前先读；历史在 `交接文档/archive/`
- 新会话第一步：读完 `CURRENT.md` 后，**复述「当前目标 / 下一步 / 什么不能碰」三点**，我确认后再动手

## 权威文档（别找错，别重述）
- `CHANGES.md` —— **改动账本 + 9 条开发者注意事项，改样式/布局前必读**
- `README.md` —— 项目简介；下方 `## Development` 段 —— Astro 官方规范

## 硬约束
- **不要联网搜索**。需要外部资料时，由我在网页端查好再给你
- **`CHANGES.md` 每次改动后追加记录**，不要重写历史
- **验收靠构建**：改完跑 `npx astro build` 必须零报错；视觉改动给可复现步骤
- `node_modules/`、`dist/`、`.astro/` **不要手改、不要提交**
- **一个会话只做一件事**；超过 100 步、上下文超 150K、或跨天，就提醒我归档
- **不要在一个会话里更换模型**（换模型 = 缓存全失效，要换就开新会话）
- 改动涉及 2 个以上文件时，**先给计划**，我确认后再动手；不确定先问我，不要猜
- ⚠️ **合规红线**：在线笔试 / 面试不要用 AI

## 归档（我说「归档」时执行）
按 `交接文档/_TEMPLATE.md` 生成 → 覆盖 `CURRENT.md` → 旧内容存 `archive/YYYY-MM-DD-<任务名>.md` → 告诉我下次该贴什么

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
