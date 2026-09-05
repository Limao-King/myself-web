// @ts-check
import { defineConfig } from 'astro/config';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

// 设计草稿页（配色/排版预览）只用于本地评审，不发布到生产 dist——
// 求职作品集站点不该让招聘方翻到"后台草稿"。
const PREVIEW_ROUTES = [
  'color-preview',
  'gpt-preview',
  'paper-note-preview',
  'project-paper-layout',
  'roadtrip-preview',
];

/** 构建完成后从 dist 中剔除预览页（dev 模式仍可正常访问） */
function dropPreviewPages() {
  return {
    name: 'drop-preview-pages',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        await Promise.all(
          PREVIEW_ROUTES.map(async (route) => {
            for (const path of [`${root}/${route}/`, `${root}/${route}.html`]) {
              await rm(path, { recursive: true, force: true });
            }
          })
        );
        logger.info(`已从生产构建剔除预览页：${PREVIEW_ROUTES.join(', ')}`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // 开发期关闭悬浮工具栏：不遮挡页面、不混进截图评审（需要时可临时改回 true）
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [dropPreviewPages()]
});
