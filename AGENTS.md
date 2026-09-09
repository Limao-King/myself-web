# 工作区说明（本文件由 DSH 自动注入每个新会话）

> 通用协议（交接文档 / 不联网 / 步数阈值 / 换模型 / 合规红线）见全局 `~/.dsh/AGENTS.md`，**此处只写本工程特有约束**。

**游戏策划求职作品集网站**，部署在 [www.limao.site](https://www.limao.site)。技术栈：Astro 7 + Tailwind CSS 4，内容用 Markdown 管理。

## 权威文档（别找错，别重述）
- `CHANGES.md` —— **改动账本 + 9 条开发者注意事项，改样式/布局前必读**
- `README.md` —— 项目简介；下方 `## Development` 段 —— Astro 官方规范

## 硬约束
- **`CHANGES.md` 每次改动后追加记录**，不要重写历史
- **验收靠构建**：改完跑 `npx astro build` 必须零报错；视觉改动给可复现步骤（桌面 1440px / 移动 390px）
- `node_modules/`、`dist/`、`.astro/` **不要手改、不要提交**

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
